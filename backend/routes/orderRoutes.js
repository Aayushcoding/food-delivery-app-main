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
  cancelOrder,
  getInvoice,
  // ── Part 2: new delivery endpoints ────────────────────────────
  getAvailableOrdersForAgent,
  acceptDelivery,
  updateDeliveryStatus,
  // ── Offer system ─────────────────────────────────────
  applyOffer
} = require("../controllers/orderController");

// ── Static/prefix routes (MUST be before /:id to avoid capture) ──────────────

// Admin: all orders
router.get("/", getAllOrders);

// Customer: place order from cart
router.post("/", auth, roleAuth(['Customer']), createOrder);

// Customer: view own orders
router.get("/user/:userId", auth, getUserOrders);

// Owner: view orders for their restaurant
router.get("/restaurant/:restaurantId", auth, roleAuth(['Owner']), getOrdersByRestaurant);

// ── Part 2: Delivery agent — available orders ──────────────────────────────────
// GET /api/orders/available
// Returns out_for_delivery orders with no agent assigned yet.
// Also auto-clears 30-minute expired assignments on each call.
router.get("/available", getAvailableOrdersForAgent);

// Offer system: POST /api/orders/apply-offer
// Must be before /:id to avoid route collision
router.post("/apply-offer", auth, applyOffer);

// ── Part 2: Delivery agent — accept order ──────────────────────────────────────
// PATCH /api/orders/:id/accept-delivery
// Body: { agentId }
router.patch("/:id/accept-delivery", auth, acceptDelivery);

// ── Part 2: Delivery agent — advance delivery status ──────────────────────────
// PATCH /api/orders/:id/delivery-status
// Body: { agentId, status: 'picked_up' | 'on_the_way' | 'arriving' | 'delivered' }
router.patch("/:id/delivery-status", auth, updateDeliveryStatus);

// ── Dynamic /:id routes (after all prefix routes) ─────────────────────────────

// Invoice: MUST be before /:id to avoid conflict
router.get("/:orderId/invoice", auth, getInvoice);

// Shared: view single order
router.get("/:id", auth, getOrderById);

// Owner: update order status (accept/prepare/dispatch — owner-only statuses)
router.put("/:id/status", auth, roleAuth(['Owner']), updateOrderStatus);

// Customer: cancel their order
router.put("/:id/cancel", auth, cancelOrder);

module.exports = router;