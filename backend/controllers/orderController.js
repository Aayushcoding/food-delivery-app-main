// controllers/orderController.js
// Using MongoDB with Mongoose ONLY

const Order = require('../models/Order');
const Cart = require('../models/Cart');

// ── GET ALL ORDERS ─────────────────────────────────────────────────────────────
// GET /api/orders?userId=usr_001&restaurantId=rest_001&status=Pending
const getOrders = async (req, res) => {
  try {
    const { userId, restaurantId, status, deliveryAgentId, ownerId } = req.query;

    let query = {};

    if (userId) {
      query.userId = userId;
    }

    if (status) {
      query.status = status;
    }

    if (restaurantId) {
      query.restaurantId = restaurantId;
    }

    if (deliveryAgentId) {
      query.deliveryAgentId = deliveryAgentId;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, total: orders.length, data: orders });
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET SINGLE ORDER ───────────────────────────────────────────────────────────
// GET /api/orders/:id
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error in getOrder:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE ORDER (direct) ──────────────────────────────────────────────────────
// POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { userId, restaurantId, items, deliveryAgentId, status } = req.body;

    if (!userId || !restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'userId, restaurantId and items[] are required' });
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);

    const newOrder = new Order({
      userId,
      restaurantId,
      items,
      totalAmount,
      status: status || 'Pending',
      deliveryAgentId: deliveryAgentId || null
    });

    await newOrder.save();

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PLACE ORDER FROM CART ──────────────────────────────────────────────────────
// POST /api/orders/place-from-cart
const placeOrderFromCart = async (req, res) => {
  try {
    const { cartId, deliveryAgentId } = req.body;

    if (!cartId) {
      return res.status(400).json({ success: false, message: 'cartId is required' });
    }

    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Create order from cart
    const totalAmount = cart.totalAmount;
    const newOrder = new Order({
      userId: cart.userId,
      restaurantId: cart.restaurantId,
      items: cart.items,
      totalAmount,
      status: 'Pending',
      deliveryAgentId: deliveryAgentId || null
    });

    await newOrder.save();

    // Clear cart after order
    await Cart.findByIdAndDelete(cartId);

    res.status(201).json({ success: true, data: newOrder, message: 'Order placed successfully' });
  } catch (error) {
    console.error('Error in placeOrderFromCart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE ORDER ───────────────────────────────────────────────────────────────
// PUT /api/orders/:id
const updateOrder = async (req, res) => {
  try {
    const { status, deliveryAgentId } = req.body;

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status, deliveryAgentId },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in updateOrder:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE ORDER ───────────────────────────────────────────────────────────────
// DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, message: 'Order deleted' });
  } catch (error) {
    console.error('Error in deleteOrder:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getOrders, getOrder, createOrder, placeOrderFromCart, updateOrder, deleteOrder };
