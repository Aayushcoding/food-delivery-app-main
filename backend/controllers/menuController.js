const Menu = require('../models/Menu');

// Get all menu items
const getMenus = async (req, res) => {
  try {
    const filters = {};
    if (req.query.restaurantId) {
      filters.restaurantId = req.query.restaurantId;
    }
    const menus = await Menu.find(filters);
    res.json(menus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single menu item
const getMenu = async (req, res) => {
  try {
    const menu = await Menu.findOne({ menuId: req.params.id });
    if (!menu) return res.status(404).json({ message: 'Menu item not found' });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create menu item
const createMenu = async (req, res) => {
  const menu = new Menu(req.body);
  try {
    const newMenu = await menu.save();
    res.status(201).json(newMenu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update menu item
const updateMenu = async (req, res) => {
  try {
    const updatedMenu = await Menu.findOneAndUpdate(
      { menuId: req.params.id },
      req.body,
      { new: true }
    );
    if (!updatedMenu) return res.status(404).json({ message: 'Menu item not found' });
    res.json(updatedMenu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete menu item
const deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findOneAndDelete({ menuId: req.params.id });
    if (!menu) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMenus,
  getMenu,
  createMenu,
  updateMenu,
  deleteMenu
};