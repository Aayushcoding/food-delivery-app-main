////orderRoutes.js
const express=require("express");
const router=express.Router();
const{
  getAllOrders,
  getUserOrders,
  getOrderById,
  createOrder,
  getOrdersByRestaurant,
  updateOrderStatus,
  cancelOrder
}=require("../controllers/orderController");

router.get("/",getAllOrders);
router.post("/",createOrder);
router.get("/user/:userId",getUserOrders);
router.get("/restaurant/:restaurantId",getOrdersByRestaurant);
router.get("/:id",getOrderById);
router.put("/:id/status",updateOrderStatus);
router.put("/:id/cancel",cancelOrder);

module.exports=router;