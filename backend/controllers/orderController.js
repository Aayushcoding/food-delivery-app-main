// controllers/orderController.js
// Fields: orderId, userId, restaurantId, items[{itemId,quantity,price}],
//         totalAmount, status, date, deliveryAgentId
// String query: Order.findOne({ orderId: value }) — NO findById(), NO populate()

const Order         = require('../models/Order');
const Cart          = require('../models/Cart');
const User          = require('../models/User');
const DeliveryAgent = require('../models/DeliveryAgent');

// ── GET ALL ORDERS ─────────────────────────────────────────────────────────────
// GET /api/orders?userId=usr_001&status=Pending&deliveryAgentId=agent_001
//                &page=1&limit=10&sortBy=totalAmount&order=desc
const getOrders = async (req, res) => {
  try {
    const {
      userId, restaurantId, status, deliveryAgentId,
      page = 1, limit = 10, sortBy = 'date', order = 'desc'
    } = req.query;

    const filter = {};
    if (userId)          filter.userId          = userId;
    if (restaurantId)    filter.restaurantId    = restaurantId;
    if (status)          filter.status          = status;
    if (deliveryAgentId) filter.deliveryAgentId = deliveryAgentId;

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip      = (parseInt(page) - 1) * parseInt(limit);
    const total     = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), data: orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET SINGLE ORDER ───────────────────────────────────────────────────────────
// GET /api/orders/:id   (id = "order_001")
const getOrder = async (req, res) => {
  try {
    // String-based query — DO NOT use findById()
    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── CREATE ORDER (direct) ──────────────────────────────────────────────────────
// POST /api/orders
// Body: { orderId?, userId, restaurantId, items[{itemId,quantity,price}], deliveryAgentId?, status? }
const createOrder = async (req, res) => {
  try {
    const { userId, restaurantId, items, deliveryAgentId } = req.body;

    if (!userId || !restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'userId, restaurantId and items[] are required' });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Auto-generate orderId if not provided
    const count   = await Order.countDocuments();
    const orderId = req.body.orderId || `order_${String(count + 1).padStart(3, '0')}`;

    const order = new Order({
      orderId,
      userId,
      restaurantId,
      items,
      totalAmount,
      status:          req.body.status || 'Pending',
      date:            req.body.date   || new Date(),
      deliveryAgentId: deliveryAgentId || null
    });

    const saved = await order.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── PLACE ORDER FROM CART ──────────────────────────────────────────────────────
// POST /api/orders/place
// Body: { cartId, deliveryAgentId? }
// Automatically assigns an available agent if none provided
const placeOrderFromCart = async (req, res) => {
  try {
    const { cartId, deliveryAgentId } = req.body;

    if (!cartId) return res.status(400).json({ message: 'cartId is required' });

    // TODO: Replace cart.userId with req.user.id after JWT integration
    // if (req.user.id !== cart.userId) {
    //   return res.status(403).json({ message: 'Unauthorized' });
    // }
    if (cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    // Verify user exists
    const user = await User.findOne({ id: cart.userId });
    if (!user) return res.status(404).json({ message: `User '${cart.userId}' not found` });

    // Resolve delivery agent
    let assignedAgentId = deliveryAgentId || null;
    if (!assignedAgentId) {
      // Auto-assign first available agent
      const agent = await DeliveryAgent.findOne({ isAvailable: true });
      if (agent) {
        assignedAgentId = agent.id;
        // Mark agent as unavailable
        await DeliveryAgent.findOneAndUpdate({ id: agent.id }, { $set: { isAvailable: false } });
      }
    } else {
      // Validate provided agent
      const agent = await DeliveryAgent.findOne({ id: assignedAgentId });
      if (!agent) return res.status(404).json({ message: `Delivery agent '${assignedAgentId}' not found` });
    }

    // Build order items from cart (includes price from cart)
    const orderItems = cart.items.map((item) => ({
      itemId:   item.itemId,
      quantity: item.quantity,
      price:    item.price
    }));

    const count   = await Order.countDocuments();
    const orderId = `order_${String(count + 1).padStart(3, '0')}`;

    const order = new Order({
      orderId,
      userId:          cart.userId,
      restaurantId:    cart.restaurantId,
      items:           orderItems,
      totalAmount:     cart.totalAmount,
      status:          'Pending',
      date:            new Date(),
      deliveryAgentId: assignedAgentId
    });

    await order.save();

    // Clear the cart after placing order
    cart.items       = [];
    cart.totalAmount = 0;
    await cart.save();

    const message = assignedAgentId
      ? 'Order placed successfully'
      : 'Order placed successfully, but no delivery agent available - pending assignment';

    res.status(201).json({ success: true, message, data: order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── UPDATE ORDER ───────────────────────────────────────────────────────────────
// PUT /api/orders/:id
// Allows updating status, deliveryAgentId, etc.
const updateOrder = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.orderId; // prevent id override

    const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (updates.status && !validStatuses.includes(updates.status)) {
      return res.status(400).json({
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
      });
    }

    const updated = await Order.findOneAndUpdate(
      { orderId: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Order not found' });

    // If order is Delivered, free up the delivery agent
    if (updates.status === 'Delivered' && updated.deliveryAgentId) {
      await DeliveryAgent.findOneAndUpdate(
        { id: updated.deliveryAgentId },
        { $set: { isAvailable: true } }
      );
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── DELETE ORDER ───────────────────────────────────────────────────────────────
// DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ orderId: req.params.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Free up delivery agent if order had one
    if (order.deliveryAgentId) {
      await DeliveryAgent.findOneAndUpdate(
        { id: order.deliveryAgentId },
        { $set: { isAvailable: true } }
      );
    }

    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOrders, getOrder, createOrder, placeOrderFromCart, updateOrder, deleteOrder };
