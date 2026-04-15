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
    const { userId, deliveryAddress } = req.body;

    if (!userId || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const user = await User.findOne({ id: userId }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: `User '${userId}' not found` });
    }

    let resolvedAddress = deliveryAddress;
    if (!resolvedAddress) {
      const addr = user.address;
      if (Array.isArray(addr) && addr.length > 0) {
        resolvedAddress = `${addr[0].street || ''}, ${addr[0].city || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
      } else {
        resolvedAddress = 'Address not provided';
      }
    }

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

    const order = await new Order({
      id:              await getNextSequence('ord'),
      userId,
      restaurantId:    cart.restaurantId || '',
      items:           enrichedItems,
      totalAmount,
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

// UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) return res.status(400).json({ success: false, message: 'Order ID is required' });
    if (!status || !status.trim()) return res.status(400).json({ success: false, message: 'Status is required' });

    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findOneAndUpdate({ id }, { status }, { new: true }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

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

module.exports = { createOrder, getUserOrders, getOrderById, getAllOrders, getOrdersByRestaurant, updateOrderStatus, cancelOrder };