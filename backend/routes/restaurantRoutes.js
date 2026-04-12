///restaurantRoutes.js
const express = require("express");
const router = express.Router();
const { auth, roleAuth } = require('../middleware/auth');
const {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantMenu,
  getRestaurantByOwner,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
} = require("../controllers/restaurantController");

// ── PUBLIC ───────────────────────────────────────────────────────────
router.get("/", getAllRestaurants);
router.get("/owner/:ownerId", getRestaurantByOwner);
router.get("/:id/menu", getRestaurantMenu);
router.get("/:id", getRestaurantById);

// ── OWNER-ONLY ───────────────────────────────────────────────────────
router.post("/", auth, roleAuth(['Owner']), createRestaurant);
router.put("/:id", auth, roleAuth(['Owner']), updateRestaurant);
router.delete("/:id", auth, roleAuth(['Owner']), deleteRestaurant);

module.exports = router;