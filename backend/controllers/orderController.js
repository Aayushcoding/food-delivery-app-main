////orderController.js
const db = require('../utils/dbManager');

// ────────────────────────────────────────────────────────────────────
// CREATE ORDER
// ────────────────────────────────────────────────────────────────────
const createOrder = async(req, res) => {
  try {
    const { userId, deliveryAddress } = req.body;

    // Validation
    if (!userId || userId.trim().length === 0) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    // Verify user exists
    const user = db.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: `User '${userId}' not found` });
    }

    // Derive delivery address — use request body value, fall back to user's stored address
    let resolvedAddress = deliveryAddress;
    if (!resolvedAddress) {
      const addr = user.address;
      if (Array.isArray(addr) && addr.length > 0) {
        resolvedAddress = `${addr[0].street || ''}, ${addr[0].city || ''}`.trim().replace(/^,\s*|,\s*$/g, '');
      } else if (typeof addr === 'string' && addr.trim()) {
        resolvedAddress = addr.trim();
      } else {
        resolvedAddress = 'Default Delivery Address';
      }
    }

    // Get user's cart
    const cart = db.getCartByUserId(userId);
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty. Add items before placing an order.",
      });
    }

    // Verify all items in cart are still available
    for (const cartItem of cart.items) {
      const menuItem = db.getMenuItem(cartItem.itemId);
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `Item '${cartItem.itemId}' no longer exists`
        });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Item '${menuItem.itemName}' is currently unavailable`
        });
      }
    }

    // Create order from cart
    const order = db.createOrder({
      userId,
      restaurantId: cart.restaurantId,
      items: cart.items,
      totalAmount: cart.totalAmount,
      deliveryAddress: resolvedAddress,
      status: "pending"
    });

    // Delete the cart after order — prevents "different restaurant" errors next time
    db.deleteCart(cart.id);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch(error) {
    console.error("[createOrder] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
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
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    // Verify user exists
    const user = db.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: `User '${userId}' not found` });
    }

    const orders = db.getOrdersByUserId(userId);

    return res.status(200).json({
      success: true,
      data: orders
    });
  } catch(error) {
    console.error("[getUserOrders] Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ────────────────────────────────────────────────────────────────────
// GET SINGLE ORDER
// ────────────────────────────────────────────────────────────────────
const getOrderById = async(req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }
    
    const order = db.getOrder(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    return res.status(200).json({ success: true, data: order });
  } catch(error) {
    console.error("[getOrderById] Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ────────────────────────────────────────────────────────────────────
// GET ALL ORDERS
// ────────────────────────────────────────────────────────────────────
const getAllOrders = async(req, res) => {
  try {
    const orders = db.getAllOrders();
    return res.status(200).json({ success: true, data: orders });
  } catch(error) {
    console.error("[getAllOrders] Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ────────────────────────────────────────────────────────────────────
// GET ORDERS BY RESTAURANT (for owner panel)
// ────────────────────────────────────────────────────────────────────
const getOrdersByRestaurant = async(req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }
    const allOrders = db.getAllOrders();
    const orders = allOrders.filter(o => o.restaurantId === restaurantId);
    return res.status(200).json({ success: true, data: orders });
  } catch(error) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ────────────────────────────────────────────────────────────────────
// UPDATE ORDER STATUS
// ────────────────────────────────────────────────────────────────────
const updateOrderStatus = async(req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || id.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    if (!status || status.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const validStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(", ")}`
      });
    }

    const order = db.updateOrder(id, { status });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      data: order
    });
  } catch(error) {
    console.error("[updateOrderStatus] Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// ────────────────────────────────────────────────────────────────────
// CANCEL ORDER
// ────────────────────────────────────────────────────────────────────
const cancelOrder = async(req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const order = db.getOrder(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`
      });
    }

    const updated = db.updateOrder(id, { status: "cancelled" });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: updated
    });
  } catch(error) {
    console.error("[cancelOrder] Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
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