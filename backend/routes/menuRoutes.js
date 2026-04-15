// routes/menuRoutes.js
const express = require('express');
const router  = express.Router();
const { auth, roleAuth } = require('../middleware/auth');
const upload  = require('../middleware/upload');
const {
  getAllMenuItems,
  getMenuByRestaurant,
  getMenuByRestaurantOwner,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemById
} = require('../controllers/menuController');

// ── PUBLIC (Customer-facing) — available items only ──────────────────
router.get('/', getAllMenuItems);
router.get('/restaurant/:restaurantId', getMenuByRestaurant);

// ── OWNER-ONLY — must be declared BEFORE /:id to avoid param clash ───
router.get('/owner/restaurant/:restaurantId', auth, roleAuth(['Owner']), getMenuByRestaurantOwner);

// Owner CRUD
router.post('/',    auth, roleAuth(['Owner']), upload.single('image'), addMenuItem);
router.put('/:id',  auth, roleAuth(['Owner']), upload.single('image'), updateMenuItem);
router.delete('/:id', auth, roleAuth(['Owner']), deleteMenuItem);

// ── Parameterised routes last ─────────────────────────────────────────
router.get('/:id', getMenuItemById);

module.exports = router;