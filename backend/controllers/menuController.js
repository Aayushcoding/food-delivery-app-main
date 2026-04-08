// controllers/menuController.js
// Fields: menuId, restaurantId, itemName, price, category, rating,
//         isAvailable, description, isVeg, imageUrl
// String query: Menu.findOne({ menuId: value }) — NO findById(), NO populate()

const Menu       = require('../models/Menu');
const Restaurant = require('../models/Restaurant');

// ── GET ALL MENU ITEMS ─────────────────────────────────────────────────────────
// GET /api/menus?restaurantId=rest_001&isVeg=true&isAvailable=true
//               &category=Indian&search=biryani&page=1&limit=10&sortBy=price&order=asc
const getMenus = async (req, res) => {
  try {
    const {
      restaurantId, isVeg, isAvailable, category,
      search, page = 1, limit = 10, sortBy = 'itemName', order = 'asc'
    } = req.query;

    const filter = {};

    if (restaurantId)             filter.restaurantId = restaurantId;
    if (category)                 filter.category     = { $regex: category, $options: 'i' };
    if (isVeg !== undefined)      filter.isVeg        = isVeg === 'true';
    if (isAvailable !== undefined)filter.isAvailable  = isAvailable === 'true';
    if (search) {
      filter.$or = [
        { itemName:    { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category:    { $regex: search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip      = (parseInt(page) - 1) * parseInt(limit);
    const total     = await Menu.countDocuments(filter);

    const menus = await Menu.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), data: menus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET SINGLE MENU ITEM ───────────────────────────────────────────────────────
// GET /api/menus/:id   (id = "menu_001")
const getMenu = async (req, res) => {
  try {
    // String-based query — DO NOT use findById()
    const menu = await Menu.findOne({ menuId: req.params.id });
    if (!menu) return res.status(404).json({ message: 'Menu item not found' });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── CREATE MENU ITEM ───────────────────────────────────────────────────────────
// POST /api/menus
const createMenu = async (req, res) => {
  try {
    const { menuId, restaurantId, itemName, price } = req.body;

    if (!menuId || !restaurantId || !itemName || price === undefined) {
      return res.status(400).json({ message: 'menuId, restaurantId, itemName and price are required' });
    }

    // Verify restaurant exists using string query
    const restaurant = await Restaurant.findOne({ restaurantId });
    if (!restaurant) {
      return res.status(404).json({ message: `Restaurant '${restaurantId}' not found` });
    }

    const existing = await Menu.findOne({ menuId });
    if (existing) return res.status(409).json({ message: `Menu item '${menuId}' already exists` });

    const menu  = new Menu(req.body);
    const saved = await menu.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── UPDATE MENU ITEM ───────────────────────────────────────────────────────────
// PUT /api/menus/:id
const updateMenu = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.menuId; // prevent id override

    const updated = await Menu.findOneAndUpdate(
      { menuId: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── DELETE MENU ITEM ───────────────────────────────────────────────────────────
// DELETE /api/menus/:id
const deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findOneAndDelete({ menuId: req.params.id });
    if (!menu) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMenus, getMenu, createMenu, updateMenu, deleteMenu };
