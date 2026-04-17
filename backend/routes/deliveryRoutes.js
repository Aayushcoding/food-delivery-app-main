const express = require('express');
const router  = express.Router();
const {
  getDeliveryAgents,
  getDeliveryAgent,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
  getAgentOrders,
  getAvailableOrders,
  assignOrderToAgent,
  rejectOrder,
  updateOrderStatusByAgent
} = require('../controllers/deliveryController');

// ── Order helpers (declared BEFORE /:id to avoid conflict) ──────────────────
router.get('/orders/available',                       getAvailableOrders);
router.post('/assign/:orderId',                       assignOrderToAgent);   // agent accepts
router.post('/reject/:orderId',                       rejectOrder);          // agent rejects
router.put('/:agentId/orders/:orderId/status',        updateOrderStatusByAgent);
router.get('/:id/orders',                             getAgentOrders);

// ── Agent CRUD ───────────────────────────────────────────────────────────────
router.get('/',    getDeliveryAgents);
router.post('/',   createDeliveryAgent);
router.get('/:id',    getDeliveryAgent);
router.put('/:id',    updateDeliveryAgent);
router.delete('/:id', deleteDeliveryAgent);

module.exports = router;