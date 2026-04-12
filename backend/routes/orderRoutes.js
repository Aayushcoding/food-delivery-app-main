////orderRoutes.js
const express = require("express");
const router = express.Router();
const { auth, roleAuth } = require('../middleware/auth');
const {
  getAllOrders,
  getUserOrders,
  getOrderById,
  createOrder,
  getOrdersByRestaurant,
  updateOrderStatus,
  cancelOrder
} = require("../controllers/orderController");

// Admin: all orders
router.get("/", getAllOrders);

// Customer: place order from cart
router.post("/", auth, roleAuth(['Customer']), createOrder);

// Customer: view own orders
router.get("/user/:userId", auth, getUserOrders);

// Owner: view orders for their restaurant
router.get("/restaurant/:restaurantId", auth, roleAuth(['Owner']), getOrdersByRestaurant);

// Shared: view single order
router.get("/:id", auth, getOrderById);

// Owner: update order status (accept/prepare/dispatch)
router.put("/:id/status", auth, roleAuth(['Owner']), updateOrderStatus);

// Customer: cancel their order
router.put("/:id/cancel", auth, cancelOrder);

module.exports = router;