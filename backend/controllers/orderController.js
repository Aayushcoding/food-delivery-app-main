// controllers/orderController.js
const User       = require('../models/User');
const Menu       = require('../models/Menu');
const Cart       = require('../models/Cart');
const Order      = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { getNextSequence } = require('../utils/counter');

// CREATE ORDER
const createOrder = async (req, res) => {
  try {
    const { userId, addressId, deliveryAddress, clientOrderId, restaurantId: reqRestaurantId } = req.body;

    if (!userId || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    // ── #1 IDEMPOTENCY: return existing order if clientOrderId already used ──────────
    // Protects against double-tap, network retry, or accidental re-submit.
    if (clientOrderId && clientOrderId.trim()) {
      const duplicate = await Order.findOne({ userId, clientOrderId: clientOrderId.trim() }).lean();
      if (duplicate) {
        console.log(`[createOrder] Duplicate clientOrderId=${clientOrderId} — returning existing order ${duplicate.id}`);
        return res.status(200).json({ success: true, message: 'Order already placed', data: duplicate });
      }
    }

    // Multiple orders allowed — customers can order from different restaurants simultaneously.

    // ── Address ──────────────────────────────────────────────────────────────
    if (!addressId && !deliveryAddress) {
      return res.status(400).json({ success: false, message: 'addressId is required' });
    }

    const user = await User.findOne({ id: userId }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: `User '${userId}' not found` });
    }

    let resolvedAddress;

    if (addressId) {
      // ── Preferred path: look up by saved address _id ───────────────────────
      const savedAddrs = Array.isArray(user.addresses) ? user.addresses : [];
      const found = savedAddrs.find((a) => String(a._id) === String(addressId));
      if (!found) {
        return res.status(400).json({
          success: false,
          message: `Address '${addressId}' not found in your saved addresses. Please add it first.`
        });
      }
      resolvedAddress = {
        street:   (found.street   || '').trim(),
        city:     (found.city     || '').trim().toLowerCase(),   // always lowercase
        pincode:  (found.pincode  || '').trim(),
        landmark: (found.landmark || '').trim()
      };
    } else if (typeof deliveryAddress === 'object' && !Array.isArray(deliveryAddress)) {
      // ── Legacy fallback: full address object sent directly ─────────────────
      resolvedAddress = {
        street:   (deliveryAddress.street   || '').trim(),
        city:     (deliveryAddress.city     || '').trim().toLowerCase(),   // always lowercase
        pincode:  (deliveryAddress.pincode  || '').trim(),
        landmark: (deliveryAddress.landmark || '').trim()
      };
    } else if (typeof deliveryAddress === 'string' && deliveryAddress.trim()) {
      // ── Legacy string fallback ─────────────────────────────────────────────
      resolvedAddress = { street: deliveryAddress.trim(), city: '', pincode: '', landmark: '' };
    } else {
      return res.status(400).json({ success: false, message: 'addressId is required' });
    }

    console.log(`[createOrder] User: ${userId} | Delivery city: "${resolvedAddress.city}" | street: "${resolvedAddress.street}"`);

    if (!resolvedAddress.street && !resolvedAddress.city) {
      return res.status(400).json({ success: false, message: 'Delivery address cannot be empty' });
    }


    // ── Cart ──────────────────────────────────────────────────────────────────
    // Look up the cart for this specific restaurant (multi-cart support)
    let cart;
    if (reqRestaurantId) {
      cart = await Cart.findOne({ userId, restaurantId: reqRestaurantId }).lean();
    } else {
      // Fallback for legacy calls without restaurantId
      cart = await Cart.findOne({ userId }).sort({ createdAt: -1 }).lean();
    }
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Add items before placing an order.' });
    }

    const enrichedItems = [];
    for (const cartItem of cart.items) {
      const menuItem = await Menu.findOne({ menuId: cartItem.itemId }).lean();
      if (!menuItem) {
        return res.status(400).json({ success: false, message: `Item '${cartItem.name || cartItem.itemId}' no longer exists in the menu` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ success: false, message: `'${menuItem.itemName}' is currently unavailable` });
      }
      enrichedItems.push({
        itemId:       cartItem.itemId,
        name:         menuItem.itemName,
        itemName:     menuItem.itemName,
        price:        menuItem.price,
        quantity:     cartItem.quantity,
        restaurantId: cartItem.restaurantId || menuItem.restaurantId
      });
    }

    const totalAmount = enrichedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Minimum order amount
    const MIN_ORDER_AMOUNT = 49;
    if (totalAmount < MIN_ORDER_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${MIN_ORDER_AMOUNT}. Your cart total is ₹${totalAmount}.`
      });
    }

    // Resolve restaurantId: prefer cart-level field, fall back to first item's restaurantId
    const resolvedRestaurantId = cart.restaurantId || enrichedItems[0]?.restaurantId || '';
    console.log(`[createOrder] restaurantId: "${resolvedRestaurantId}"`);

    // ── Honour client-side discount (already validated in frontend) ──────────
    const rawDiscount   = Number(req.body.discountAmount) || 0;
    const couponCode    = (req.body.couponCode || '').trim().toUpperCase() || null;
    const discountAmount = Math.min(Math.max(0, rawDiscount), totalAmount);
    const finalAmount    = Math.max(0, totalAmount - discountAmount);

    // ── Payment method ───────────────────────────────────────────────────────
    const VALID_PAYMENT_METHODS = ['cod', 'upi', 'card', 'netbanking'];
    const paymentMethod = VALID_PAYMENT_METHODS.includes(req.body.paymentMethod)
      ? req.body.paymentMethod : 'cod';
    const isPaid = paymentMethod !== 'cod';   // COD = unpaid until delivered

    const order = await new Order({
      id:              await getNextSequence('ord'),
      userId,
      restaurantId:    resolvedRestaurantId,
      items:           enrichedItems,
      totalAmount,
      finalAmount,
      discountAmount,
      offerApplied:    couponCode || null,
      paymentMethod,
      isPaid,
      deliveryAddress: resolvedAddress,
      status:          'pending',
      clientOrderId:   clientOrderId?.trim() || null,
      createdAt:       new Date().toISOString()
    }).save();

    await Cart.findOneAndDelete({ id: cart.id });

    return res.status(201).json({ success: true, message: 'Order placed successfully', data: order.toJSON() });
  } catch (error) {
    console.error('[createOrder] Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};


// GET ORDERS FOR USER
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const user = await User.findOne({ id: userId }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: `User '${userId}' not found` });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET SINGLE ORDER
// Also auto-expires stale pending orders (> 5 min) on every fetch.
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Order ID is required' });

    let order = await Order.findOne({ id }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // ── #7 AUTO EXPIRY ────────────────────────────────────────────────────────
    // If the order has been sitting in 'pending' for more than 5 minutes with no
    // action from the restaurant, auto-cancel it so the user isn't stuck waiting.
    const PENDING_EXPIRY_MS = 5 * 60 * 1000;   // 5 minutes
    if (order.status === 'pending') {
      const ageMs = Date.now() - new Date(order.createdAt).getTime();
      if (ageMs > PENDING_EXPIRY_MS) {
        order = await Order.findOneAndUpdate(
          { id, status: 'pending' },            // guard: only if not already progressed
          { status: 'cancelled' },
          { new: true }
        ).lean();
        console.log(`[autoExpiry] Order ${id} auto-cancelled (pending > 5 min)`);
      }
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL ORDERS
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET ORDERS BY RESTAURANT
const getOrdersByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!restaurantId) return res.status(400).json({ success: false, message: 'restaurantId is required' });

    const restaurant = await Restaurant.findOne({ restaurantId }).lean();
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    const rawOrders = await Order.find({ restaurantId }).sort({ createdAt: -1 }).lean();

    // Enrich with customer name + phone for owner display
    const orders = await Promise.all(rawOrders.map(async (o) => {
      let customerName  = 'Customer';
      let customerPhone = '';
      if (o.userId) {
        const cu = await User.findOne({ id: o.userId }).lean();
        if (cu?.name)    customerName  = cu.name;
        else if (cu?.username) customerName = cu.username;
        if (cu?.phoneNo) customerPhone = cu.phoneNo;
      }
      return { ...o, customerName, customerPhone };
    }));

    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// STATUS TRANSITION MAP — defines every legal state progression
// Owner controls: pending → confirmed → preparing
// Agent controls: confirmed/preparing → out_for_delivery → picked_up → on_the_way → arriving → delivered
const OWNER_TRANSITIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled']
  // preparing has no owner-controlled next step — agent must accept the order
};

// UPDATE ORDER STATUS — Restaurant owner only
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id)     return res.status(400).json({ success: false, message: 'Order ID is required' });
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    // Fetch current order so we can validate the transition
    const order = await Order.findOne({ id }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Enforce strict status transition
    const allowed = OWNER_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status change: '${order.status}' → '${status}'. Allowed: ${allowed ? allowed.join(', ') : 'none'}`
      });
    }

    console.log(`[updateOrderStatus] Order: ${id} | ${order.status} → ${status} (by owner)`);

    const updated = await Order.findOneAndUpdate({ id }, { status }, { new: true }).lean();
    console.log(`[updateOrderStatus] ✅ Order ${id} updated to '${status}'`);

    return res.json({ success: true, message: 'Order status updated', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// CANCEL ORDER
// Allowed from: pending (within 5 min) OR confirmed (within 5 min)
// Once preparing or beyond → cannot cancel
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Order ID is required' });

    const order = await Order.findOne({ id }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status '${order.status}'. Only pending or confirmed orders can be cancelled.`
      });
    }

    const orderTime   = new Date(order.createdAt);
    const ageMinutes  = (Date.now() - orderTime.getTime()) / (1000 * 60);
    if (ageMinutes > 5) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation window expired. Orders can only be cancelled within 5 minutes of placing.'
      });
    }

    const updated = await Order.findOneAndUpdate({ id }, { status: 'cancelled' }, { new: true }).lean();
    return res.json({ success: true, message: 'Order cancelled successfully', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET INVOICE — GET /api/orders/:orderId/invoice
const getInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });

    let order = await Order.findOne({ id: orderId }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is only available for delivered orders'
      });
    }

    // Generate transactionId on-demand (prototype)
    if (!order.transactionId) {
      const txnId = 'txn_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      order = await Order.findOneAndUpdate(
        { id: orderId },
        { transactionId: txnId, invoiceGenerated: true },
        { new: true }
      ).lean();
    }

    // Fetch restaurant name for the invoice
    let restaurantName = '';
    if (order.restaurantId) {
      const restaurant = await Restaurant.findOne({ restaurantId: order.restaurantId }).lean();
      if (restaurant) restaurantName = restaurant.restaurantName || '';
    }

    const invoice = {
      orderId:         order.id,
      restaurantName:  restaurantName,
      transactionId:   order.transactionId,
      invoiceDate:     new Date().toISOString(),
      orderDate:       order.createdAt,
      status:          order.status,
      deliveryAddress: order.deliveryAddress || '',
      items:           order.items || [],
      totalAmount:     order.totalAmount,
      discountAmount:  order.discountAmount  || 0,
      offerApplied:    order.offerApplied    || null,
      finalAmount:     order.finalAmount     || order.totalAmount,
      restaurantId:    order.restaurantId    || '',
      paymentMethod:   order.paymentMethod   || 'cod',
      isPaid:          order.isPaid          || false
    };

    return res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('[getInvoice]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder, getUserOrders, getOrderById, getAllOrders, getOrdersByRestaurant, updateOrderStatus, cancelOrder, getInvoice };

// ─────────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id/contact-info
// Returns restaurant contact + delivery agent phone for the order.
// Safe: never exposes password, token, or address list.
// ─────────────────────────────────────────────────────────────────────────────────
const getContactInfo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Order ID is required' });

    const order = await Order.findOne({ id }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // ─ Restaurant details ──────────────────────────────────────────────
    let restaurant = null;
    if (order.restaurantId) {
      const r = await Restaurant.findOne({ restaurantId: order.restaurantId }).lean();
      if (r) {
        restaurant = {
          name:    r.restaurantName  || '',
          phone:   r.restaurantContactNo || '',
          address: r.address         || '',
          city:    r.city            || '',
          email:   r.email           || ''
        };
      }
    }

    // ─ Delivery agent details (only if assigned) ─────────────────────
    let agent = null;
    if (order.deliveryAgentId) {
      const u = await User.findOne({ id: order.deliveryAgentId }).lean();
      if (u) {
        agent = {
          name:  u.name || u.username || 'Delivery Partner',
          phone: u.phoneNo  || ''
        };
      }
    }

    return res.json({
      success: true,
      data: { restaurant, agent }
    });
  } catch (error) {
    console.error('[getContactInfo]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PART 2 — NEW DELIVERY ENDPOINTS (additive, non-breaking)
// ─────────────────────────────────────────────────────────────────────────────

const PICKUP_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Shared helper: expire stale agent assignments.
 * Called on each GET /api/orders/available hit.
 */
async function releaseExpiredOrderAssignments() {
  const cutoff = new Date(Date.now() - PICKUP_TIMEOUT_MS);

  // Find orders accepted >30 min ago that are still in out_for_delivery
  const expired = await Order.find({
    status:             'out_for_delivery',
    deliveryAgentId:    { $ne: null },
    deliveryAcceptedAt: { $lt: cutoff }
  }).lean();

  for (const order of expired) {
    await Order.findOneAndUpdate(
      { id: order.id },
      { deliveryAgentId: null, acceptedAt: null, deliveryAcceptedAt: null }
    );
    console.log(`[timeout] Cleared stale assignment for order ${order.id}`);
  }
}

// ── GET /api/orders/available ─────────────────────────────────────────────────
// Returns orders ready for pickup: confirmed | preparing | out_for_delivery (unassigned).
// Agents can pick any of these up. Clears expired assignments first.
const getAvailableOrdersForAgent = async (req, res) => {
  try {
    await releaseExpiredOrderAssignments();

    // Include orders that the owner has accepted/is preparing — not just out_for_delivery
    const orders = await Order.find({
      status:          { $in: ['confirmed', 'preparing', 'out_for_delivery'] },
      deliveryAgentId: null
    }).sort({ createdAt: -1 }).lean();

    return res.json({ success: true, data: orders });
  } catch (error) {
    console.error('[getAvailableOrdersForAgent]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── PATCH /api/orders/:id/accept-delivery ───────────────────────────────────
// Agent accepts an order: assigns agentId, records timestamps.
// Transitions status to out_for_delivery regardless of confirmed/preparing/out_for_delivery.
const acceptDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId } = req.body;

    if (!agentId) {
      return res.status(400).json({ success: false, message: 'agentId is required' });
    }

    const order = await Order.findOne({ id }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Accept orders that are ready: confirmed, preparing, or already out_for_delivery
    const acceptableStatuses = ['confirmed', 'preparing', 'out_for_delivery'];
    if (!acceptableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be accepted (current status: ${order.status}). Only confirmed or preparing orders can be picked up.`
      });
    }
    if (order.deliveryAgentId) {
      return res.status(409).json({
        success: false,
        message: 'This order has already been accepted by another agent'
      });
    }

    const now = new Date();
    const updated = await Order.findOneAndUpdate(
      { id },
      {
        status:             'out_for_delivery',   // transition: confirmed/preparing → out_for_delivery
        deliveryAgentId:    agentId,
        acceptedAt:         now.toISOString(),    // ISO string (Part 1 compat)
        deliveryAcceptedAt: now                   // Date for timeout math
      },
      { new: true }
    ).lean();

    return res.json({
      success: true,
      message: 'Order accepted — 30-minute pickup window started',
      data: updated
    });
  } catch (error) {
    console.error('[acceptDelivery]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── PATCH /api/orders/:id/delivery-status ─────────────────────────────────────
// Agent advances delivery through: picked_up → on_the_way → arriving → delivered
// Sets deliveredAt when status becomes 'delivered'.
const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId, status } = req.body;

    const agentStatuses = ['picked_up', 'on_the_way', 'arriving', 'delivered'];
    if (!status || !agentStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${agentStatuses.join(', ')}`
      });
    }
    if (!agentId) {
      return res.status(400).json({ success: false, message: 'agentId is required' });
    }

    const order = await Order.findOne({ id }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.deliveryAgentId !== agentId) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this order'
      });
    }

    const patch = { status };
    if (status === 'delivered') {
      patch.deliveredAt = new Date();
    }

    const updated = await Order.findOneAndUpdate({ id }, patch, { new: true }).lean();

    // NOTE: Revenue accumulation for 'delivered' is handled exclusively by the
    // agent route (deliveryController.updateStatusByAgent) which is the canonical
    // path agents use. Accumulating here too would double-count revenue.

    return res.json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: updated
    });
  } catch (error) {
    console.error('[updateDeliveryStatus]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/orders/apply-offer ──────────────────────────────────────────────
// Apply an offer code to a pending order.
//
// Body: { orderId, code }   (also accepts 'offerCode' for backward compat)
//
// Supported codes:
//   FLAT100 → ₹100 OFF (min order ₹299)
//   PERC20  → 20% OFF  (max ₹150)
//   FIRST50 → 50% OFF  (max ₹50, only first order)
//
// Rules:
//   - Only ONE offer per order
//   - Offer only on pending orders
//   - Invalid / unmet-condition code → return error
//   - Discount is PERSISTED via order.save()

const applyOffer = async (req, res) => {
  try {
    const { orderId, code: bodyCode, offerCode } = req.body;
    const rawCode = bodyCode || offerCode;   // accept both field names

    if (!orderId || !rawCode) {
      return res.status(400).json({ success: false, message: 'orderId and code are required' });
    }

    const code = rawCode.trim().toUpperCase();

    // All valid offer codes (must match frontend ALL_OFFERS list)
    const VALID_CODES = ['FLAT100', 'PERC20', 'FIRST50', 'FIRST70',
                         'BOGO1', 'WKND40', 'SAVE60', 'RICE50', 'UPI150',
                         'PREM20', 'LATE50', 'HEALTH30', 'BIG200'];
    if (!VALID_CODES.includes(code)) {
      return res.status(400).json({
        success: false,
        message: `Invalid offer code '${rawCode}'.`
      });
    }

    // Fetch as a Mongoose document (not .lean()) so we can call .save()
    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Offers can only be applied to pending orders (current status: ${order.status})`
      });
    }
    if (order.offerApplied) {
      return res.status(400).json({
        success: false,
        message: `Offer '${order.offerApplied}' is already applied to this order`
      });
    }

    let discount = 0;

    switch (code) {
      case 'FLAT100':
        if (order.totalAmount >= 299) { discount = 100; }
        else return res.status(400).json({ success: false, message: `FLAT100 requires a minimum order of ₹299 (your total: ₹${order.totalAmount})` });
        break;

      case 'SAVE60':
        if (order.totalAmount >= 199) { discount = 60; }
        else return res.status(400).json({ success: false, message: `SAVE60 requires a minimum order of ₹199` });
        break;

      case 'BIG200': {
        const day = new Date().getDay();
        const isWeekend = day === 0 || day === 6;
        if (!isWeekend) return res.status(400).json({ success: false, message: 'BIG200 is only valid on weekends (Sat/Sun).' });
        if (order.totalAmount < 599) return res.status(400).json({ success: false, message: 'BIG200 requires a minimum order of ₹599.' });
        discount = 200;
        break;
      }

      case 'PERC20':
        discount = Math.min(Math.round(order.totalAmount * 0.2), 150);
        break;

      case 'PREM20':
        // Premium restaurant check must have been done on frontend;
        // backend persists whatever discount the frontend computed
        discount = Math.min(Math.round(order.totalAmount * 0.2), 100);
        break;

      case 'RICE50':
        discount = Math.min(Math.round(order.totalAmount * 0.5), 75);
        break;

      case 'HEALTH30':
        discount = Math.min(Math.round(order.totalAmount * 0.3), 60);
        break;

      case 'WKND40': {
        const day = new Date().getDay();
        if (day !== 0 && day !== 6) return res.status(400).json({ success: false, message: 'WKND40 is only valid on weekends (Sat/Sun).' });
        discount = Math.min(Math.round(order.totalAmount * 0.4), 80);
        break;
      }

      case 'FIRST70':
      case 'FIRST50': {
        const prevOrders = await Order.countDocuments({ userId: order.userId, id: { $ne: orderId } });
        if (prevOrders > 0) return res.status(400).json({ success: false, message: `${code} is only valid on your first order.` });
        if (code === 'FIRST70') discount = Math.min(Math.round(order.totalAmount * 0.7), 50);
        else                    discount = Math.min(Math.round(order.totalAmount * 0.5), 50);
        break;
      }

      case 'LATE50': {
        const hour = new Date().getHours();
        if (hour < 22 && hour >= 2) return res.status(400).json({ success: false, message: 'LATE50 is only valid between 10 PM and 2 AM.' });
        discount = 50;
        break;
      }

      case 'UPI150':
        if (order.paymentMethod !== 'upi') {
          return res.status(400).json({
            success: false,
            message: 'UPI150 is only valid when paying via UPI. Please select UPI as your payment method.'
          });
        }
        discount = Math.min(150, order.totalAmount);
        break;

      case 'BOGO1':
        if (order.paymentMethod !== 'netbanking') {
          return res.status(400).json({
            success: false,
            message: 'BOGO1 is only valid when paying via Net Banking.'
          });
        }
        discount = Math.min(Math.round(order.totalAmount * 0.5), 200);
        break;

    }

    // Cap discount so finalAmount never goes below 0
    discount = Math.min(discount, order.totalAmount);

    // ── PERSIST to DB via order.save() ────────────────────────────────────────
    order.offerApplied   = code;
    order.discountAmount = discount;
    order.finalAmount    = Math.max(0, order.totalAmount - discount);
    await order.save();

    return res.json({
      success: true,
      message: `Offer '${code}' applied! You save ₹${discount}.`,
      data: {
        totalAmount:    order.totalAmount,
        discountAmount: order.discountAmount,
        finalAmount:    order.finalAmount,
        offerApplied:   order.offerApplied
      }
    });
  } catch (error) {
    console.error('[applyOffer]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// Re-export everything including the three new handlers
module.exports = {
  // ── existing ──────────────────────────────────────────────
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  getOrdersByRestaurant,
  updateOrderStatus,
  cancelOrder,
  getInvoice,
  // ── Part 2 additions ──────────────────────────────────────
  getAvailableOrdersForAgent,
  acceptDelivery,
  updateDeliveryStatus,
  // ── Offer system ──────────────────────────────────────────
  applyOffer,
  getContactInfo
};