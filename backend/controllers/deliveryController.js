// controllers/deliveryController.js
const DeliveryAgent = require('../models/DeliveryAgent');
const Order         = require('../models/Order');
const Restaurant    = require('../models/Restaurant');
const User          = require('../models/User');
const { getNextSequence } = require('../utils/counter');

// ── Timeout constants ───────────────────────────────────────────────────────
const PICKUP_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Internal helper: release any expired assignments.
 * Called before returning available orders so stale assignments auto-clear.
 */
async function releaseExpiredAssignments() {
  const cutoff = new Date(Date.now() - PICKUP_TIMEOUT_MS).toISOString();
  const expired = await Order.find({
    status:          'out_for_delivery',
    deliveryAgentId: { $ne: null },
    acceptedAt:      { $lt: cutoff }
  }).lean();

  for (const order of expired) {
    // Free the agent
    await DeliveryAgent.findOneAndUpdate(
      { id: order.deliveryAgentId },
      { isAvailable: true, currentOrderId: null }
    );
    // Remove assignment from order (stays out_for_delivery, back in pool)
    await Order.findOneAndUpdate(
      { id: order.id },
      { deliveryAgentId: null, acceptedAt: null }
    );
    console.log(`[timeout] Released expired assignment for order ${order.id}`);
  }
}

// ── GET /api/delivery — list all agents (with optional search) ──────────────
const getDeliveryAgents = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      const q = search.toLowerCase();
      query = {
        $or: [
          { name:    { $regex: q, $options: 'i' } },
          { phoneNo: { $regex: q, $options: 'i' } }
        ]
      };
    }
    const agents = await DeliveryAgent.find(query).lean();
    const clean  = agents.map(({ _id, __v, ...a }) => a);
    res.json({ success: true, data: clean });
  } catch (error) {
    console.error('[getDeliveryAgents]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/delivery/:id ───────────────────────────────────────────────────
const getDeliveryAgent = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findOne({ id: req.params.id }).lean();
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }
    const { _id, __v, ...clean } = agent;
    res.json({ success: true, data: clean });
  } catch (error) {
    console.error('[getDeliveryAgent]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/delivery — create agent profile ───────────────────────────────
const createDeliveryAgent = async (req, res) => {
  try {
    const { name, phoneNo, email } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    if (!phoneNo || !phoneNo.trim()) {
      return res.status(400).json({ success: false, message: 'phoneNo is required' });
    }

    const agentId = await getNextSequence('agent');
    const agent   = await new DeliveryAgent({
      id:           agentId,
      name:         name.trim(),
      email:        email ? email.trim().toLowerCase() : '',
      phoneNo:      phoneNo.trim(),
      isAvailable:  true,
      currentOrderId: null
    }).save();

    const { _id, __v, ...clean } = agent.toObject();
    res.status(201).json({ success: true, data: clean });
  } catch (error) {
    console.error('[createDeliveryAgent]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PUT /api/delivery/:id — update profile / availability ──────────────────
const updateDeliveryAgent = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.id;

    const agent = await DeliveryAgent.findOneAndUpdate(
      { id: req.params.id },
      updates,
      { new: true }
    ).lean();

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }
    const { _id, __v, ...clean } = agent;
    res.json({ success: true, data: clean });
  } catch (error) {
    console.error('[updateDeliveryAgent]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/delivery/:id ────────────────────────────────────────────────
const deleteDeliveryAgent = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findOneAndDelete({ id: req.params.id }).lean();
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }
    res.json({ success: true, message: 'Delivery agent deleted' });
  } catch (error) {
    console.error('[deleteDeliveryAgent]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/delivery/:id/orders — orders actively assigned to THIS agent ───
const getAgentOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await DeliveryAgent.findOne({ id }).lean();
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }

    // Only orders currently assigned to this specific agent, not yet delivered
    const orders = await Order.find({
      deliveryAgentId: id,
      status: { $nin: ['delivered', 'cancelled'] }
    }).sort({ createdAt: -1 }).lean();

    const clean = orders.map(({ _id, __v, ...o }) => o);
    res.json({ success: true, data: clean });
  } catch (error) {
    console.error('[getAgentOrders]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/delivery/orders/available ─────────────────────────────────────
// Returns out_for_delivery orders with NO agent assigned yet.
// Also auto-expires stale assignments before returning.
const getAvailableOrders = async (req, res) => {
  try {
    // Clear timed-out assignments first
    await releaseExpiredAssignments();

    const orders = await Order.find({
      status:          'out_for_delivery',
      deliveryAgentId: null
    }).sort({ createdAt: -1 }).lean();

    const clean = orders.map(({ _id, __v, ...o }) => o);
    res.json({ success: true, data: clean });
  } catch (error) {
    console.error('[getAvailableOrders]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/delivery/assign/:orderId — agent accepts an order ─────────────
const assignOrderToAgent = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ success: false, message: 'agentId is required' });
    }

    const agent = await DeliveryAgent.findOne({ id: agentId }).lean();
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }

    // Order must be out_for_delivery AND not yet assigned
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'out_for_delivery') {
      return res.status(400).json({
        success: false,
        message: `Order is not available for pickup (status: ${order.status})`
      });
    }
    if (order.deliveryAgentId) {
      return res.status(409).json({
        success: false,
        message: 'Order has already been accepted by another agent'
      });
    }

    // Assign agent + record acceptance time. Status stays out_for_delivery until picked up.
    const now = new Date().toISOString();
    const updated = await Order.findOneAndUpdate(
      { id: orderId },
      { deliveryAgentId: agentId, acceptedAt: now },
      { new: true }
    ).lean();

    // Mark agent busy
    await DeliveryAgent.findOneAndUpdate(
      { id: agentId },
      { isAvailable: false, currentOrderId: orderId }
    );

    const { _id, __v, ...clean } = updated;
    res.json({ success: true, message: 'Order accepted — you have 30 minutes to pick it up!', data: clean });
  } catch (error) {
    console.error('[assignOrderToAgent]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/delivery/reject/:orderId — agent rejects / ignores an order ───
const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ success: false, message: 'agentId is required' });
    }

    const order = await Order.findOne({ id: orderId }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only reject if THIS agent owns the assignment
    if (order.deliveryAgentId && order.deliveryAgentId !== agentId) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this order' });
    }

    // Clear assignment — order goes back to available pool
    await Order.findOneAndUpdate(
      { id: orderId },
      { deliveryAgentId: null, acceptedAt: null }
    );

    // Free the agent
    await DeliveryAgent.findOneAndUpdate(
      { id: agentId },
      { isAvailable: true, currentOrderId: null }
    );

    res.json({ success: true, message: 'Order declined — it is back in the pool' });
  } catch (error) {
    console.error('[rejectOrder]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PUT /api/delivery/:agentId/orders/:orderId/status ───────────────────────
// Agent progresses the delivery: picked_up → on_the_way → arriving → delivered
const updateOrderStatusByAgent = async (req, res) => {
  try {
    const { agentId, orderId } = req.params;
    const { status } = req.body;

    const agentStatuses = ['picked_up', 'on_the_way', 'arriving', 'delivered'];
    if (!status || !agentStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${agentStatuses.join(', ')}`
      });
    }

    const agent = await DeliveryAgent.findOne({ id: agentId }).lean();
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }

    const order = await Order.findOne({ id: orderId }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify this agent is assigned to this order
    if (order.deliveryAgentId !== agentId) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this order' });
    }

    const updated = await Order.findOneAndUpdate(
      { id: orderId },
      { status },
      { new: true }
    ).lean();

    // On delivered: accumulate revenue to restaurant + free the agent
    if (status === 'delivered') {
      const orderAmount = updated.finalAmount > 0 ? updated.finalAmount : updated.totalAmount;
      if (updated.restaurantId) {
        await Restaurant.findOneAndUpdate(
          { restaurantId: updated.restaurantId },
          { $inc: { totalRevenue: orderAmount } }
        );
      }
      await DeliveryAgent.findOneAndUpdate(
        { id: agentId },
        { isAvailable: true, currentOrderId: null }
      );
    }

    const { _id, __v, ...clean } = updated;
    res.json({ success: true, message: `Order status updated to ${status}`, data: clean });
  } catch (error) {
    console.error('[updateOrderStatusByAgent]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── /api/agent/* handlers (agent-centric, use req.agent from agentAuth) ─────

/**
 * GET /api/agent/available-orders
 * Returns out_for_delivery orders with no agent assigned.
 * Automatically expires stale assignments first.
 */
const getAvailableOrdersForAgentRoute = async (req, res) => {
  try {
    await releaseExpiredAssignments();
    const orders = await Order.find({
      status:          'out_for_delivery',
      deliveryAgentId: null
    }).sort({ createdAt: -1 }).lean();

    console.log(`[available-orders] Agent: ${req.agent?.id} | Query: {status:"out_for_delivery", deliveryAgentId:null} | Results: ${orders.length}`);
    orders.forEach(o => console.log(`  → Order ${o.id} | status: ${o.status} | agentId: ${o.deliveryAgentId}`));

    const clean = orders.map(({ _id, __v, ...o }) => o);
    res.json({ success: true, data: clean });
  } catch (error) {
    console.error('[getAvailableOrdersForAgentRoute]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * GET /api/agent/my-orders
 * Returns all orders currently assigned to the authenticated agent.
 */
const getMyOrders = async (req, res) => {
  try {
    const agentId = req.agent.id;
    const orders = await Order.find({
      deliveryAgentId: agentId,
      status: { $in: ['out_for_delivery', 'picked_up', 'on_the_way', 'arriving'] }
    }).sort({ createdAt: -1 }).lean();
    const clean = orders.map(({ _id, __v, ...o }) => o);
    res.json({ success: true, data: clean });
  } catch (error) {
    console.error('[getMyOrders]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/agent/accept/:orderId
 * Agent accepts an order:
 *   - Assigns deliveryAgentId
 *   - Changes status → picked_up
 *   - Records acceptedAt timestamps
 *   - Marks agent busy
 */
const acceptOrderByAgent = async (req, res) => {
  try {
    const { orderId } = req.params;
    const agentId    = req.agent.id;

    console.log(`[acceptOrder] Agent: ${agentId} trying to accept order: ${orderId}`);

    // Auto-release any expired assignments first
    await releaseExpiredAssignments();

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log(`[acceptOrder] Order ${orderId} | status: ${order.status} | agentId: ${order.deliveryAgentId}`);

    if (order.status !== 'out_for_delivery') {
      return res.status(400).json({
        success: false,
        message: `Order is not available for pickup (status: ${order.status})`
      });
    }
    if (order.deliveryAgentId) {
      return res.status(409).json({
        success: false,
        message: 'Order has already been accepted by another agent'
      });
    }

    const now = new Date();
    const updated = await Order.findOneAndUpdate(
      { id: orderId },
      {
        deliveryAgentId:    agentId,
        acceptedAt:         now.toISOString(),
        deliveryAcceptedAt: now,
        status:             'picked_up'           // per spec: accept → immediately picked_up
      },
      { new: true }
    ).lean();

    // Mark agent busy (only applies to legacy DeliveryAgent collection)
    await DeliveryAgent.findOneAndUpdate(
      { id: agentId },
      { isAvailable: false, currentOrderId: orderId }
    );

    console.log(`[acceptOrder] ✅ Order ${orderId} accepted by agent ${agentId} → status: picked_up`);

    const { _id, __v, ...clean } = updated;
    res.json({ success: true, message: 'Order accepted and picked up!', data: clean });
  } catch (error) {
    console.error('[acceptOrderByAgent]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/agent/update-status/:orderId
 * Agent advances the delivery status:
 *   picked_up → on_the_way → arriving → delivered
 * Body: { status }
 */
const updateStatusByAgent = async (req, res) => {
  try {
    const { orderId } = req.params;
    const agentId    = req.agent.id;
    const { status } = req.body;

    const allowedStatuses = ['on_the_way', 'arriving', 'delivered'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const order = await Order.findOne({ id: orderId }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.deliveryAgentId !== agentId) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this order' });
    }

    const patch = { status };
    if (status === 'delivered') patch.deliveredAt = new Date();

    const updated = await Order.findOneAndUpdate({ id: orderId }, patch, { new: true }).lean();

    // Revenue accumulation + free agent on delivery
    if (status === 'delivered') {
      const orderAmount = updated.finalAmount > 0 ? updated.finalAmount : updated.totalAmount;
      if (updated.restaurantId) {
        await Restaurant.findOneAndUpdate(
          { restaurantId: updated.restaurantId },
          { $inc: { totalRevenue: orderAmount } }
        );
      }
      await DeliveryAgent.findOneAndUpdate(
        { id: agentId },
        { isAvailable: true, currentOrderId: null }
      );
    }

    const { _id, __v, ...clean } = updated;
    res.json({ success: true, message: `Status updated to ${status}`, data: clean });
  } catch (error) {
    console.error('[updateStatusByAgent]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /debug/make-available/:orderId  (TEMP — for quick testing)
 * Force-sets an order to status=out_for_delivery and clears deliveryAgentId
 * so it appears in the agent dashboard immediately.
 */
const debugMakeAvailable = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updated = await Order.findOneAndUpdate(
      { id: orderId },
      { status: 'out_for_delivery', deliveryAgentId: null, acceptedAt: null, deliveryAcceptedAt: null },
      { new: true }
    ).lean();

    console.log(`[debug] Order ${orderId} forced → out_for_delivery`);
    const { _id, __v, ...clean } = updated;
    res.json({ success: true, message: `Order ${orderId} is now out_for_delivery and visible to agents`, data: clean });
  } catch (error) {
    console.error('[debugMakeAvailable]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/agent/history
 * Returns all orders DELIVERED by this agent, enriched with:
 * - restaurantName (from Restaurant collection)
 * - customerName   (from User collection)
 */
const getMyDeliveryHistory = async (req, res) => {
  try {
    const agentId = req.agent.id;

    const orders = await Order.find({
      deliveryAgentId: agentId,
      status: 'delivered'
    }).sort({ deliveredAt: -1, createdAt: -1 }).lean();

    // Enrich each order with restaurant and customer names
    const enriched = await Promise.all(orders.map(async (order) => {
      const { _id, __v, ...o } = order;

      // Fetch restaurant name
      let restaurantName = o.restaurantId || 'Unknown Restaurant';
      if (o.restaurantId) {
        const rest = await Restaurant.findOne({ restaurantId: o.restaurantId }).lean();
        if (rest?.restaurantName) restaurantName = rest.restaurantName;
      }

      // Fetch customer name
      let customerName = o.userId || 'Unknown Customer';
      if (o.userId) {
        const user = await User.findOne({ id: o.userId }).lean();
        if (user?.username) customerName = user.username;
        else if (user?.email) customerName = user.email;
      }

      return { ...o, restaurantName, customerName };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('[getMyDeliveryHistory]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDeliveryAgents,
  getDeliveryAgent,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
  getAgentOrders,
  getAvailableOrders,
  assignOrderToAgent,
  rejectOrder,
  updateOrderStatusByAgent,
  // /api/agent/* handlers
  getAvailableOrdersForAgentRoute,
  getMyOrders,
  getMyDeliveryHistory,
  acceptOrderByAgent,
  updateStatusByAgent,
  // debug (temp — remove in production)
  debugMakeAvailable
};