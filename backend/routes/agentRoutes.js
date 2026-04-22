// routes/agentRoutes.js
// All routes under /api/agent — requires agentAuth middleware.
const express    = require('express');
const router     = express.Router();
const { agentAuth } = require('../middleware/agentAuth');
const {
  getAvailableOrdersForAgentRoute,
  getMyOrders,
  getMyDeliveryHistory,
  acceptOrderByAgent,
  updateStatusByAgent
} = require('../controllers/deliveryController');

// ── GET /api/agent/available-orders ─────────────────────────────────────────
// Returns all out_for_delivery orders with no agent assigned.
// Also auto-releases any 30-minute stale assignments.
router.get('/available-orders', agentAuth, getAvailableOrdersForAgentRoute);

// ── GET /api/agent/my-orders ─────────────────────────────────────────────────
// Returns all in-progress orders currently assigned to this agent.
router.get('/my-orders', agentAuth, getMyOrders);

// ── POST /api/agent/accept/:orderId ──────────────────────────────────────────
// Agent accepts an order:
//   - Assigns deliveryAgentId
//   - Changes status → picked_up
//   - Starts the 30-minute tracking clock
router.post('/accept/:orderId', agentAuth, acceptOrderByAgent);

// ── POST /api/agent/update-status/:orderId ────────────────────────────────────
// Agent advances status through: on_the_way → arriving → delivered
// Body: { status }
router.post('/update-status/:orderId', agentAuth, updateStatusByAgent);

// ── GET /api/agent/history ────────────────────────────────────────────────────
// Returns all DELIVERED orders by this agent, enriched with restaurantName & customerName.
router.get('/history', agentAuth, getMyDeliveryHistory);

module.exports = router;
