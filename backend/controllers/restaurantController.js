/////restaurantController.js
const db = require('../utils/dbManager');

// GET /api/restaurants (supports ?search=name)
const getAllRestaurants = async(req, res) => {
  try {
    const { search } = req.query;
    let restaurants = db.getAllRestaurants();
    
    // Add default image if missing
    restaurants = restaurants.map(r => ({
      ...r,
      imageUrl: r.imageUrl || 'https://source.unsplash.com/featured/?restaurant'
    }));
    
    if (search) {
      restaurants = restaurants.filter(r => 
        r.restaurantName.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    res.json({ success: true, data: restaurants });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/restaurants/:id
const getRestaurantById = async(req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
    }
    
    const restaurant = db.getRestaurant(id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    
    // Add default image if missing
    restaurant.imageUrl = restaurant.imageUrl || 'https://source.unsplash.com/featured/?restaurant';
    
    res.json({ success: true, data: restaurant });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/restaurants/:id/menu
const getRestaurantMenu = async(req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
    }
    
    // Verify restaurant exists
    const restaurant = db.getRestaurant(id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    
    // Get menu items for this restaurant
    const menuItems = db.getMenuByRestaurant(id).filter(item => item.isAvailable);
    
    res.json({ success: true, data: menuItems });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/restaurants/owner/:ownerId
const getRestaurantByOwner = async(req, res) => {
  try {
    const { ownerId } = req.params;
    
    if (!ownerId || ownerId.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'ownerId is required' });
    }
    
    // Verify owner exists
    const owner = db.getUser(ownerId);
    if (!owner) {
      return res.status(404).json({ success: false, message: `User '${ownerId}' not found` });
    }
    
    const restaurant = db.getRestaurantByOwnerId(ownerId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found for this owner' });
    }
    res.json({ success: true, data: restaurant });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/restaurants (owner creates restaurant)
const createRestaurant = async(req, res) => {
  try {
    const { restaurantName, ownerId, restaurantContactNo, address, email, cuisine, gstinNo } = req.body;

    // Validation
    if (!restaurantName || restaurantName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'restaurantName is required' });
    }
    
    if (!ownerId || ownerId.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'ownerId is required' });
    }

    // Verify owner exists
    const owner = db.getUser(ownerId);
    if (!owner) {
      return res.status(404).json({ success: false, message: `Owner '${ownerId}' not found` });
    }

    const restaurant = db.createRestaurant({
      restaurantName,
      ownerId,
      restaurantContactNo,
      address,
      email,
      cuisine,
      gstinNo
    });

    res.status(201).json({ success: true, data: restaurant });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/restaurants/:id (owner updates restaurant)
const updateRestaurant = async(req, res) => {
  try {
    const { id } = req.params;
    const { restaurantName, address, restaurantContactNo, cuisine, isVeg, rating } = req.body;
    
    if (!id || id.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
    }
    
    // Verify restaurant exists
    const existing = db.getRestaurant(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    
    const restaurant = db.updateRestaurant(id, {
      restaurantName: restaurantName || existing.restaurantName,
      address: address || existing.address,
      restaurantContactNo: restaurantContactNo || existing.restaurantContactNo,
      cuisine: cuisine || existing.cuisine,
      isVeg: isVeg !== undefined ? isVeg : existing.isVeg,
      rating: rating !== undefined ? rating : existing.rating
    });
    
    res.json({ success: true, data: restaurant });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/restaurants/:id (owner deletes restaurant)
const deleteRestaurant = async(req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Restaurant ID is required' });
    }
    
    const restaurant = db.deleteRestaurant(id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    res.json({ success: true, message: 'Restaurant deleted' });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantMenu,
  getRestaurantByOwner,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
};