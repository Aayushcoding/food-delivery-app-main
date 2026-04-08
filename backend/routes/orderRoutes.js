const express = require('express');
const router = express.Router();
const { auth, roleAuth } = require('../middleware/auth');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder
} = require('../controllers/orderController');

// TODO: Add auth middleware here after JWT implementation
// router.get('/', auth, getOrders);
router.get('/', getOrders);

// TODO: Add auth middleware here after JWT implementation
// router.get('/:id', auth, getOrder);
router.get('/:id', getOrder);

// TODO: Add auth middleware here after JWT implementation
// router.post('/', auth, roleAuth(['Customer']), createOrder);
router.post('/', createOrder);

// TODO: Add auth middleware here after JWT implementation
// router.put('/:id', auth, roleAuth(['Owner']), updateOrder);
router.put('/:id', updateOrder);

// TODO: Add auth middleware here after JWT implementation
// router.delete('/:id', auth, roleAuth(['Owner']), deleteOrder);
router.delete('/:id', deleteOrder);

module.exports = router;