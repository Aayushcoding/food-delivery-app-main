////cartRoutes.js
const express=require('express');
const router=express.Router();
const{auth,roleAuth}=require('../middleware/auth');
const{
getCarts,
getCart,
getCartByUser,
createCart,
updateCart,
addItemToCart,
updateItemQuantity,
removeItemFromCart,
deleteCart
}=require('../controllers/cartController');

router.get('/',getCarts);
router.post('/',createCart);
router.post('/add-item',addItemToCart);
router.put('/update-quantity',updateItemQuantity);
router.post('/remove-item',removeItemFromCart);
router.get('/user/:userId',getCartByUser);
router.get('/:id',getCart);
router.put('/:id',updateCart);
router.delete('/:id',deleteCart);

module.exports=router;