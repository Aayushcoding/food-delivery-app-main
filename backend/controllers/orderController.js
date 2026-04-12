////orderController.js
const db = require('../utils/dbManager');

// ────────────────────────────────────────────────────────────────────
// CREATE ORDER (from backend cart — never from frontend data)
// ────────────────────────────────────────────────────────────────────
const createOrder = async(req, res) => {
  try {
    const { userId, deliveryAddress } = req.body;

    if (!userId || userId.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    // Verify user exists
    const user = db.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: `User '${userId}' not found` });
    }

    // Resolve delivery address
    let resolvedAddress = deliveryAddress;
    if (!resolvedAddress) {
      const addr = user.address;
      if (Array.isArray(addr) && addr.length > 0) {
        resolvedAddress = `${addr[0].street || ''}, ${addr[0].city || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
      } else if (typeof addr === 'string' && addr.trim()) {
        resolvedAddress = addr.trim();
      } else {
        resolvedAddress = 'Address not provided';
      }
    }

    // Fetch cart from DB — backend is the single source of truth
    const cart = db.getCartByUserId(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Add items before placing an order.'
      });
    }

    // Validate every cart item and enrich with current menu data
    const enrichedItems = [];
    for (const cartItem of cart.items) {
      const menuItem = db.getMenuItem(cartItem.itemId);
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `Item '${cartItem.name || cartItem.itemId}' no longer exists in the menu`
        });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `'${menuItem.itemName}' is currently unavailable`
        });
      }
      enrichedItems.push({
        itemId: cartItem.itemId,
        name: menuItem.itemName,          // always use DB name
        price: menuItem.price,             // always use DB price (recalculate to prevent cart tampering)
        quantity: cartItem.quantity,
        restaurantId: cartItem.restaurantId || menuItem.restaurantId
      });
    }

    // Recalculate total server-side — never trust stored cart total
    const totalAmount = enrichedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const order = db.createOrder({
      userId,
      restaurantId: cart.restaurantId,
      items: enrichedItems,
      totalAmount,
      deliveryAddress: resolvedAddress,
      status: 'pending'
    });

    // Delete cart after order is placed — clean state for next order
    db.deleteCart(cart.id);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch(error) {
    console.error('[createOrder] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// ────────────────────────────────────────────────────────────────────
// GET ORDERS FOR USER
// ────────────────────────────────────────────────────────────────────
const getUserOrders = async(req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const user = db.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: `User '${userId}' not found` });
    }

    const orders = db.getOrdersByUserId(userId);

    return res.status(200).json({ success: true, data: orders });
  } catch(error) {
    console.error('[getUserOrders] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────
// GET SINGLE ORDER
// ────────────────────────────────────────────────────────────────────
const getOrderById = async(req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = db.getOrder(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, data: order });
  } catch(error) {
    console.error('[getOrderById] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────
// GET ALL ORDERS (admin use)
// ────────────────────────────────────────────────────────────────────
const getAllOrders = async(req, res) => {
  try {
    const orders = db.getAllOrders();
    return res.status(200).json({ success: true, data: orders });
  } catch(error) {
    console.error('[getAllOrders] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────
// GET ORDERS BY RESTAURANT (owner dashboard)
// ────────────────────────────────────────────────────────────────────
const getOrdersByRestaurant = async(req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }

    // Verify restaurant exists
    const restaurant = db.getRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const allOrders = db.getAllOrders();
    const orders = allOrders.filter(o => o.restaurantId === restaurantId);

    return res.status(200).json({ success: true, data: orders });
  } catch(error) {
    console.error('[getOrdersByRestaurant] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────
// UPDATE ORDER STATUS (owner only)
// ────────────────────────────────────────────────────────────────────
const updateOrderStatus = async(req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    if (!status || status.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = db.updateOrder(id, { status });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch(error) {
    console.error('[updateOrderStatus] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────
// CANCEL ORDER (customer)
// ────────────────────────────────────────────────────────────────────
const cancelOrder = async(req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = db.getOrder(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    const updated = db.updateOrder(id, { status: 'cancelled' });
    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: updated
    });
  } catch(error) {
    console.error('[cancelOrder] Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
  getOrdersByRestaurant,
  updateOrderStatus,
  cancelOrder
};