const express = require('express');
const router = express.Router();
const { auth, roleAuth } = require('../middleware/auth');
const {
  getCarts,
  getCart,
  createCart,
  updateCart,
  deleteCart
} = require('../controllers/cartController');

router.get('/', auth, roleAuth(['Customer']), getCarts); // Only customers can view carts
router.get('/:id', auth, roleAuth(['Customer']), getCart); // Only customers can view cart
router.post('/', auth, roleAuth(['Customer']), createCart); // Only customers can create cart
router.put('/:id', auth, roleAuth(['Customer']), updateCart); // Only customers can update cart
router.delete('/:id', auth, roleAuth(['Customer']), deleteCart); // Only customers can delete cart

module.exports = router;