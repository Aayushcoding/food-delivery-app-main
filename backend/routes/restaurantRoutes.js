///restaurantRoutes.js
const express=require("express");
const router=express.Router();
const{
getAllRestaurants,
getRestaurantById,
getRestaurantMenu,
getRestaurantByOwner,
createRestaurant,
updateRestaurant,
deleteRestaurant
}=require("../controllers/restaurantController");

router.get("/",getAllRestaurants);
router.post("/",createRestaurant);
router.get("/owner/:ownerId",getRestaurantByOwner);
router.get("/:id/menu",getRestaurantMenu);
router.get("/:id",getRestaurantById);
router.put("/:id",updateRestaurant);
router.delete("/:id",deleteRestaurant);

module.exports=router;