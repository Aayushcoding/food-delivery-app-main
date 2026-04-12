const express=require("express");
const router=express.Router();
const{
getAllMenuItems,
getMenuByRestaurant,
searchMenuItems,
addMenuItem,
updateMenuItem,
deleteMenuItem,
getMenuItemById
}=require("../controllers/menuController");

router.get("/",getAllMenuItems);
router.get("/search",searchMenuItems);
router.get("/restaurant/:restaurantId",getMenuByRestaurant);
router.get("/:id",getMenuItemById);
router.post("/",addMenuItem);
router.put("/:id",updateMenuItem);
router.delete("/:id",deleteMenuItem);

module.exports=router;