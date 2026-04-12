///paymentController.js
const db = require('../utils/dbManager');

// ================= PROCESS PAYMENT =================
// POST /api/payment/pay
const processPayment = async(req, res) => {
  try {
    const { orderId, userId } = req.body;

    // Validate input
    if (!orderId || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: "orderId and userId are required" 
      });
    }

    // Find order
    const order = db.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if this user owns the order
    if (order.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Forbidden: Not your order" 
      });
    }

    // Prevent payment for already confirmed/delivered orders
    if (order.status === "confirmed" || order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Order cannot be paid. Current status: ${order.status}`
      });
    }

    // Update order status to confirmed
    const updated = db.updateOrder(orderId, { status: "confirmed" });

    res.status(200).json({
      success: true,
      message: "Payment successful. Order confirmed!",
      data: {
        orderId: updated.id,
        status: updated.status,
        totalAmount: updated.totalAmount,
      },
    });
  } catch(err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { processPayment };