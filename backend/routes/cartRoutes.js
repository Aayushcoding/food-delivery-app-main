const express = require('express');
const router = express.Router();
const { auth, roleAuth } = require('../middleware/auth');
const {
  getCarts,
  getCart,
  getCartByUser,
  createCart,
  updateCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  deleteCart
} = require('../controllers/cartController');

// TODO: Add auth middleware here after JWT implementation
// router.get('/', auth, roleAuth(['Customer']), getCarts);
router.get('/', getCarts);
// TODO: Add auth middleware here after JWT implementation
// router.get('/:id', auth, roleAuth(['Customer']), getCart);
router.get('/:id', getCart);
// TODO: Add auth middleware here after JWT implementation
// router.get('/user/:userId', auth, roleAuth(['Customer']), getCartByUser);
router.get('/user/:userId', getCartByUser);

// TODO: Add auth middleware here after JWT implementation
// router.post('/', auth, roleAuth(['Customer']), createCart);
router.post('/', createCart);

// TODO: Add auth middleware here after JWT implementation
// router.put('/:id', auth, roleAuth(['Customer']), updateCart);
router.put('/:id', updateCart);

// Cart-specific operations
// TODO: Add auth middleware here after JWT implementation
// router.post('/add-item', auth, roleAuth(['Customer']), addItemToCart);
router.post('/add-item', addItemToCart);

// TODO: Add auth middleware here after JWT implementation
// router.put('/update-quantity', auth, roleAuth(['Customer']), updateItemQuantity);
router.put('/update-quantity', updateItemQuantity);

// TODO: Add auth middleware here after JWT implementation
// router.post('/remove-item', auth, roleAuth(['Customer']), removeItemFromCart);
router.post('/remove-item', removeItemFromCart);

// TODO: Add auth middleware here after JWT implementation
// router.delete('/:id', auth, roleAuth(['Customer']), deleteCart);
router.delete('/:id', deleteCart);

module.exports = router;