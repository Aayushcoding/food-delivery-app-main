////userRoutes.js
const express=require('express');
const router=express.Router();
const{
getUsers,
getUser,
createUser,
loginUser,
updateUser,
deleteUser
}=require('../controllers/userController');

router.get('/',getUsers);
router.get('/:id',getUser);
router.post('/signup',createUser); // change made here
router.post('/login',loginUser);
router.put('/:id',updateUser);
router.delete('/:id',deleteUser);

module.exports=router;