///restaurantRoutes.js
const express = require("express");
const router = express.Router();
const { auth, roleAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantMenu,
  getRestaurantByOwner,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantDashboard
} = require("../controllers/restaurantController");

// ── PUBLIC ───────────────────────────────────────────────────────────
router.get("/", getAllRestaurants);
router.get("/owner/:ownerId", getRestaurantByOwner);

// Dashboard (static prefix — MUST be before /:id to avoid capture)
// GET /api/restaurants/dashboard?restaurantId=<id>
router.get("/dashboard", auth, roleAuth(['Owner']), getRestaurantDashboard);

// ── OWNER BULK-CITY fix — PATCH /api/restaurants/bulk-city ───────────
// Body: { city: "pune" }  → sets city on ALL restaurants owned by the caller
router.patch("/bulk-city", auth, roleAuth(['Owner']), async (req, res) => {
  const Restaurant = require('../models/Restaurant');
  const { city } = req.body;
  if (!city || !city.trim()) {
    return res.status(400).json({ success: false, message: 'city is required' });
  }
  const normalized = city.trim().toLowerCase();
  const result = await Restaurant.updateMany(
    { ownerId: req.user.id, $or: [{ city: '' }, { city: null }, { city: { $exists: false } }] },
    { $set: { city: normalized } }
  );
  return res.json({
    success: true,
    message: `Set city="${normalized}" on ${result.modifiedCount} restaurant(s) that had no city.`,
    modifiedCount: result.modifiedCount
  });
});

router.get("/:id/menu", getRestaurantMenu);
router.get("/:id", getRestaurantById);

// ── OWNER-ONLY ───────────────────────────────────────────────────────
// upload.single('displayImage') handles optional restaurant image upload
router.post("/", auth, roleAuth(['Owner']), upload.single('displayImage'), createRestaurant);
router.put("/:id", auth, roleAuth(['Owner']), upload.single('displayImage'), updateRestaurant);
router.delete("/:id", auth, roleAuth(['Owner']), deleteRestaurant);

module.exports = router;