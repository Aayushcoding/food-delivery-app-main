// controllers/menuController.js
const Menu       = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const { getNextSequence } = require('../utils/counter');

const resolveImage = (req) => {
  if (req.file) return `/uploads/${req.file.filename}`;
  return (req.body.image || '').trim() || null;
};

// GET /api/menu  (customer — available items, optional ?restaurantId=)
const getAllMenuItems = async (req, res) => {
  try {
    const filter = { isAvailable: true };
    if (req.query.restaurantId) filter.restaurantId = req.query.restaurantId;
    const items = await Menu.find(filter).lean();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/menu/restaurant/:restaurantId  (customer — available only)
const getMenuByRestaurant = async (req, res) => {
  try {
    const items = await Menu.find({ restaurantId: req.params.restaurantId, isAvailable: true }).lean();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/menu/owner/restaurant/:restaurantId  (owner — all items)
const getMenuByRestaurantOwner = async (req, res) => {
  try {
    const items = await Menu.find({ restaurantId: req.params.restaurantId }).lean();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/menu/:id
const getMenuItemById = async (req, res) => {
  try {
    const item = await Menu.findOne({ menuId: req.params.id }).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/menu
const addMenuItem = async (req, res) => {
  try {
    const { restaurantId, itemName, price, description, isVeg, category } = req.body;
    if (!restaurantId?.trim()) return res.status(400).json({ success: false, message: 'restaurantId is required' });
    if (!itemName?.trim())     return res.status(400).json({ success: false, message: 'itemName is required' });
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0)
      return res.status(400).json({ success: false, message: 'price must be a non-negative number' });

    const restaurant = await Restaurant.findOne({ restaurantId }).lean();
    if (!restaurant) return res.status(404).json({ success: false, message: `Restaurant '${restaurantId}' not found` });

    const item = await new Menu({
      menuId:       await getNextSequence('menu'),
      restaurantId,
      itemName:     itemName.trim(),
      price:        Number(price),
      description:  description || '',
      isVeg:        isVeg === 'true' || isVeg === true,
      category:     (category || '').trim(),
      image:        resolveImage(req),
      isAvailable:  true
    }).save();

    res.status(201).json({ success: true, message: 'Menu item added', data: item.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/menu/:id
const updateMenuItem = async (req, res) => {
  try {
    const existing = await Menu.findOne({ menuId: req.params.id }).lean();
    if (!existing) return res.status(404).json({ success: false, message: 'Menu item not found' });

    // Ownership check: only the restaurant's owner can edit items
    if (req.user) {
      const restaurant = await Restaurant.findOne({ restaurantId: existing.restaurantId }).lean();
      if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
      if (restaurant.ownerId !== req.user.id)
        return res.status(403).json({ success: false, message: 'You can only edit menu items for your own restaurant' });
    }

    const { itemName, price, description, isVeg, category, isAvailable } = req.body;
    const updates = {};
    if (itemName    !== undefined) updates.itemName    = itemName;
    if (price       !== undefined) updates.price       = Number(price);
    if (description !== undefined) updates.description = description;
    if (isVeg       !== undefined) updates.isVeg       = isVeg === 'true' || isVeg === true;
    if (category    !== undefined) updates.category    = category;
    if (isAvailable !== undefined) updates.isAvailable = isAvailable === 'true' || isAvailable === true;
    if (req.file)                  updates.image       = `/uploads/${req.file.filename}`;
    else if (req.body.image !== undefined) updates.image = req.body.image.trim() || null;

    const updated = await Menu.findOneAndUpdate({ menuId: req.params.id }, updates, { new: true }).lean();
    res.json({ success: true, message: 'Menu item updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/menu/:id
const deleteMenuItem = async (req, res) => {
  try {
    const item = await Menu.findOne({ menuId: req.params.id }).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });

    // Ownership check: only the restaurant's owner can delete items
    if (req.user) {
      const restaurant = await Restaurant.findOne({ restaurantId: item.restaurantId }).lean();
      if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
      if (restaurant.ownerId !== req.user.id)
        return res.status(403).json({ success: false, message: 'You can only delete menu items for your own restaurant' });
    }

    await Menu.findOneAndDelete({ menuId: req.params.id });
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllMenuItems, getMenuByRestaurant, getMenuByRestaurantOwner, getMenuItemById, addMenuItem, updateMenuItem, deleteMenuItem };