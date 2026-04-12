////menuController.js
const db = require('../utils/dbManager');

// GET /api/menu (all items or search by restaurantId)
const getAllMenuItems = async(req, res) => {
  try {
    const { restaurantId } = req.query;
    let items = db.getAllMenus();
    
    if (restaurantId) {
      items = items.filter(m => m.restaurantId === restaurantId);
    }
    
    res.json({ success: true, data: items });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/menu/restaurant/:restaurantId (all items for a restaurant)
const getMenuByRestaurant = async(req, res) => {
  try {
    const { restaurantId } = req.params;
    
    if (!restaurantId || restaurantId.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }
    
    // Verify restaurant exists
    const restaurant = db.getRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    
    const items = db.getMenuByRestaurant(restaurantId)
      .filter(m => m.isAvailable);
    res.json({ success: true, data: items });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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

// POST /api/menu (owner adds menu item)
const addMenuItem = async(req, res) => {
  try {
    const { restaurantId, itemName, price, description, isVeg, category } = req.body;

    // Validation
    if (!restaurantId || restaurantId.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }
    
    if (!itemName || itemName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'itemName is required' });
    }
    
    if (price === undefined || price === null || price < 0) {
      return res.status(400).json({ success: false, message: 'price is required and must be >= 0' });
    }
    
    if (!category || category.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'category is required' });
    }

    // Verify restaurant exists
    const restaurant = db.getRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: `Restaurant '${restaurantId}' not found` });
    }

    const item = db.createMenuItem({
      restaurantId,
      itemName,
      price,
      description,
      isVeg,
      category
    });

    res.status(201).json({ success: true, message: 'Menu item added', data: item });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/menu/:id (owner updates menu item)
const updateMenuItem = async(req, res) => {
  try {
    const { itemName, price, description, isVeg, category, isAvailable, rating } = req.body;
    
    const item = db.updateMenuItem(req.params.id, {
      itemName,
      price,
      description,
      isVeg,
      category,
      isAvailable,
      rating
    });
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    res.json({ success: true, message: 'Item updated', data: item });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/menu/:id (owner deletes menu item)
const deleteMenuItem = async(req, res) => {
  try {
    const item = db.deleteMenuItem(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/menu/:id — get a single menu item by its menuId
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
  searchMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemById
};