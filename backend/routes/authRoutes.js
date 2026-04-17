////authRoutes.js
const express = require('express');
const router  = express.Router();
const { registerCustomer, registerOwner, registerDeliveryAgent, login } = require('../controllers/authController');

router.post('/register/customer',  registerCustomer);
router.post('/register/owner',     registerOwner);
router.post('/register/delivery',  registerDeliveryAgent);   // used by SignupDeliveryComponent
router.post('/register/agent',     registerDeliveryAgent);   // alias used by unified signup
router.post('/login',              login);

module.exports = router;
