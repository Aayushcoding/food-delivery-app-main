////authRoutes.js
const express=require('express');
const router=express.Router();
const{registerCustomer,registerOwner,login}=require('../controllers/authController');

router.post('/register/customer',registerCustomer);
router.post('/register/owner',registerOwner);
router.post('/login',login);

module.exports=router;