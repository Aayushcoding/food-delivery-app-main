////menuRoutes.js
const express = require("express");
const router = express.Router();
const { auth, roleAuth } = require('../middleware/auth');
const {
  getAllMenuItems,
  getMenuByRestaurant,
  getMenuByRestaurantOwner,
  searchMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemById
} = require("../controllers/menuController");

// ── PUBLIC (Customer-facing) ─────────────────────────────────────────
// Returns only AVAILABLE items
router.get("/", getAllMenuItems);
router.get("/search", searchMenuItems);
router.get("/restaurant/:restaurantId", getMenuByRestaurant);
router.get("/:id", getMenuItemById);

// ── OWNER-ONLY ───────────────────────────────────────────────────────
// Returns ALL items including unavailable (for management)
router.get("/owner/restaurant/:restaurantId", auth, roleAuth(['Owner']), getMenuByRestaurantOwner);

// Owner CRUD on menu
router.post("/", auth, roleAuth(['Owner']), addMenuItem);
router.put("/:id", auth, roleAuth(['Owner']), updateMenuItem);
router.delete("/:id", auth, roleAuth(['Owner']), deleteMenuItem);

module.exports = router;