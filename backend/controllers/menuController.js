// controllers/menuController.js
// Using MongoDB with Mongoose ONLY

const Menu = require('../models/Menu');

// ── GET ALL MENU ITEMS ─────────────────────────────────────────────────────────
// GET /api/menu?restaurantId=rest_001&isVeg=true&category=Indian&search=biryani
const getMenus = async (req, res) => {
  try {
    const { restaurantId, isVeg, category, search } = req.query;
    
    let query = {};
    
    if (restaurantId) {
      query.restaurantId = restaurantId;
    }
    
    if (isVeg !== undefined) {
      query.isVeg = isVeg === 'true';
    }
    
    if (category) {
      query.category = new RegExp(category, 'i');
    }
    
    if (search) {
      query.$or = [
        { itemName: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    
    const menus = await Menu.find(query);
    
    res.status(200).json({ success: true, total: menus.length, data: menus });
  } catch (error) {
    console.error('Error in getMenus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET SINGLE MENU ITEM ───────────────────────────────────────────────────────
// GET /api/menu/:id
const getMenu = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }
    res.status(200).json({ success: true, data: menu });
  } catch (error) {
    console.error('Error in getMenu:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE MENU ITEM ───────────────────────────────────────────────────────────
// POST /api/menu
const createMenu = async (req, res) => {
  try {
    const { itemName, price, restaurantId, description, category, isVeg, isAvailable, imageUrl } = req.body;

    if (!itemName || price === undefined || !restaurantId) {
      return res.status(400).json({ success: false, message: 'itemName, price, and restaurantId are required' });
    }

    const newMenu = new Menu({
      itemName,
      price,
      restaurantId,
      description: description || '',
      category: category || 'Others',
      isVeg: isVeg || false,
      isAvailable: isAvailable !== false,
      imageUrl: imageUrl || ''
    });

    await newMenu.save();

    res.status(201).json({ success: true, data: newMenu });
  } catch (error) {
    console.error('Error in createMenu:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE MENU ITEM ───────────────────────────────────────────────────────────
// PUT /api/menu/:id
const updateMenu = async (req, res) => {
  try {
    const { itemName, price, description, category, isVeg, isAvailable, imageUrl } = req.body;

    const updated = await Menu.findByIdAndUpdate(
      req.params.id,
      { itemName, price, description, category, isVeg, isAvailable, imageUrl },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in updateMenu:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE MENU ITEM ───────────────────────────────────────────────────────────
// DELETE /api/menu/:id
const deleteMenu = async (req, res) => {
  try {
    const deleted = await Menu.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.status(200).json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    console.error('Error in deleteMenu:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMenus, getMenu, createMenu, updateMenu, deleteMenu };
