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

router.get('/', auth, getOrders); // Both customers and owners can view orders
router.get('/:id', auth, getOrder); // Both can view specific order
router.post('/', auth, roleAuth(['Customer']), createOrder); // Only customers can create orders
router.put('/:id', auth, roleAuth(['Owner']), updateOrder); // Only owners can update order status
router.delete('/:id', auth, roleAuth(['Owner']), deleteOrder); // Only owners can delete orders

module.exports = router;