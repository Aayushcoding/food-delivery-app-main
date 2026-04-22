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
    const { userId, addressId, deliveryAddress } = req.body;

    if (!userId || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    // ── Address: addressId is the preferred (required) field ──────────────────
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
    const cart = await Cart.findOne({ userId }).sort({ createdAt: -1 }).lean();
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

    // Resolve restaurantId: prefer cart-level field, fall back to first item's restaurantId
    const resolvedRestaurantId = cart.restaurantId || enrichedItems[0]?.restaurantId || '';
    console.log(`[createOrder] restaurantId: "${resolvedRestaurantId}"`);

    const order = await new Order({
      id:              await getNextSequence('ord'),
      userId,
      restaurantId:    resolvedRestaurantId,
      items:           enrichedItems,
      totalAmount,
      finalAmount:     totalAmount,   // always initialised — updated by apply-offer
      discountAmount:  0,
      deliveryAddress: resolvedAddress,
      status:          'pending',
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
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Order ID is required' });

    const order = await Order.findOne({ id }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

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

    const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE ORDER STATUS — Restaurant owner only
// Owners can set: pending, confirmed, preparing, out_for_delivery, cancelled
// picked_up / on_the_way / arriving / delivered are AGENT-ONLY via delivery routes
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) return res.status(400).json({ success: false, message: 'Order ID is required' });
    if (!status || !status.trim()) return res.status(400).json({ success: false, message: 'Status is required' });

    // Restaurant can ONLY control up to out_for_delivery
    const ownerStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'cancelled'];
    if (!ownerStatuses.includes(status)) {
      return res.status(403).json({
        success: false,
        message: `Restaurants cannot set status to '${status}'. Only delivery agents can progress past out_for_delivery.`
      });
    }

    console.log(`[updateOrderStatus] Order: ${id} → status: ${status} (by owner)`);

    const order = await Order.findOneAndUpdate({ id }, { status }, { new: true }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    console.log(`[updateOrderStatus] ✅ Order ${id} updated | status: ${order.status} | agentId: ${order.deliveryAgentId}`);

    return res.json({ success: true, message: 'Order status updated', data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// CANCEL ORDER — only within 5 minutes, only if pending
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Order ID is required' });

    const order = await Order.findOne({ id }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.`
      });
    }

    const orderTime = new Date(order.createdAt);
    const diffInMinutes = (Date.now() - orderTime.getTime()) / (1000 * 60);
    if (diffInMinutes > 5) {
      return res.status(400).json({
        success: false,
        message: 'You can only cancel an order within 5 minutes of placing it.'
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

    const invoice = {
      orderId:         order.id,
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
      restaurantId:    order.restaurantId    || ''
    };

    return res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('[getInvoice]', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder, getUserOrders, getOrderById, getAllOrders, getOrdersByRestaurant, updateOrderStatus, cancelOrder, getInvoice };

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

    // Revenue accumulation on delivery via this route
    if (status === 'delivered' && updated.restaurantId) {
      const orderAmount = updated.finalAmount > 0 ? updated.finalAmount : updated.totalAmount;
      await Restaurant.findOneAndUpdate(
        { restaurantId: updated.restaurantId },
        { $inc: { totalRevenue: orderAmount } }
      );
    }

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

    // Validate code is one of the supported offers
    const VALID_CODES = ['FLAT100', 'PERC20', 'FIRST50'];
    if (!VALID_CODES.includes(code)) {
      return res.status(400).json({
        success: false,
        message: `Invalid offer code '${rawCode}'. Valid codes: ${VALID_CODES.join(', ')}`
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
        if (order.totalAmount >= 299) {
          discount = 100;
        } else {
          return res.status(400).json({
            success: false,
            message: `FLAT100 requires a minimum order of ₹299 (your total: ₹${order.totalAmount})`
          });
        }
        break;

      case 'PERC20':
        discount = Math.min(Math.round(order.totalAmount * 0.2), 150);
        break;

      case 'FIRST50': {
        // First order check: exclude the current order itself
        const prevOrders = await Order.countDocuments({
          userId: order.userId,
          id:     { $ne: orderId }
        });
        if (prevOrders > 0) {
          return res.status(400).json({
            success: false,
            message: 'FIRST50 is only valid on your first order'
          });
        }
        discount = Math.min(Math.round(order.totalAmount * 0.5), 50);
        break;
      }
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
  applyOffer
};
