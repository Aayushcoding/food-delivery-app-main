////menuController.js
const db = require('../utils/dbManager');

// ── GET ALL MENU ITEMS (public — available items only) ─────────────────────────
// GET /api/menu  (optional ?restaurantId=xxx filter)
const getAllMenuItems = async(req, res) => {
  try {
    const { restaurantId } = req.query;
    let items = db.getAllMenus().filter(m => m.isAvailable);

    if (restaurantId) {
      items = items.filter(m => m.restaurantId === restaurantId);
    }

    res.json({ success: true, data: items });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET MENU BY RESTAURANT (public — available items only) ─────────────────────
// GET /api/menu/restaurant/:restaurantId
const getMenuByRestaurant = async(req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId || restaurantId.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }

    const restaurant = db.getRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Only available items for customers
    const items = db.getMenuByRestaurant(restaurantId).filter(m => m.isAvailable);
    res.json({ success: true, data: items });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET MENU BY RESTAURANT FOR OWNER (auth required — ALL items) ───────────────
// GET /api/menu/owner/restaurant/:restaurantId
// Owner sees all items including unavailable ones — needed for management
const getMenuByRestaurantOwner = async(req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId || restaurantId.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }

    const restaurant = db.getRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // No availability filter — owner sees ALL menu items
    const items = db.getMenuByRestaurant(restaurantId);
    res.json({ success: true, data: items });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── SEARCH MENU ITEMS (public) ─────────────────────────────────────────────────
// GET /api/menu/search?search=itemName
const searchMenuItems = async(req, res) => {
  try {
    const { search } = req.query;
    let items = db.getAllMenus().filter(m => m.isAvailable);

    if (search) {
      items = items.filter(m =>
        m.itemName.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({ success: true, data: items });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADD MENU ITEM (owner only) ─────────────────────────────────────────────────
// POST /api/menu
const addMenuItem = async(req, res) => {
  try {
    const { restaurantId, itemName, price, description, isVeg, category } = req.body;

    if (!restaurantId || restaurantId.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }
    if (!itemName || itemName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'itemName is required' });
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'price must be a non-negative number' });
    }
    if (!category || category.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'category is required' });
    }

    const restaurant = db.getRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: `Restaurant '${restaurantId}' not found` });
    }

    const item = db.createMenuItem({
      restaurantId,
      itemName: itemName.trim(),
      price: Number(price),
      description: description || '',
      isVeg: !!isVeg,
      category: category.trim()
    });

    res.status(201).json({ success: true, message: 'Menu item added', data: item });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE MENU ITEM (owner only) ──────────────────────────────────────────────
// PUT /api/menu/:id
const updateMenuItem = async(req, res) => {
  try {
    const existing = db.getMenuItem(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const { itemName, price, description, isVeg, category, isAvailable } = req.body;

    const updates = {};
    if (itemName !== undefined) updates.itemName = itemName;
    if (price !== undefined) updates.price = Number(price);
    if (description !== undefined) updates.description = description;
    if (isVeg !== undefined) updates.isVeg = !!isVeg;
    if (category !== undefined) updates.category = category;
    if (isAvailable !== undefined) updates.isAvailable = !!isAvailable;

    const item = db.updateMenuItem(req.params.id, updates);
    res.json({ success: true, message: 'Menu item updated', data: item });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE MENU ITEM (owner only) ──────────────────────────────────────────────
// DELETE /api/menu/:id
const deleteMenuItem = async(req, res) => {
  try {
    const item = db.deleteMenuItem(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET MENU ITEM BY ID (public) ───────────────────────────────────────────────
// GET /api/menu/:id
const getMenuItemById = async(req, res) => {
  try {
    const item = db.getMenuItem(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.json({ success: true, data: item });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllMenuItems,
  getMenuByRestaurant,
  getMenuByRestaurantOwner,
  searchMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemById
};