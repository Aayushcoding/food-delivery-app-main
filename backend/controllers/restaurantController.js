// controllers/restaurantController.js
// Using MongoDB with Mongoose ONLY

const Restaurant = require('../models/Restaurant');

// ── GET ALL RESTAURANTS ────────────────────────────────────────────────────────
// GET /api/restaurants?isVeg=true&search=restaurantName&ownerId=usr_001
const getRestaurants = async (req, res) => {
  try {
    const { isVeg, search, ownerId } = req.query;
    
    let query = {};
    
    if (isVeg !== undefined) {
      query.isVeg = isVeg === 'true';
    }
    
    if (ownerId) {
      query.ownerId = ownerId;
    }
    
    if (search) {
      query.$or = [
        { restaurantName: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') }
      ];
    }
    
    const restaurants = await Restaurant.find(query);
    
    res.status(200).json({ success: true, total: restaurants.length, data: restaurants });
  } catch (error) {
    console.error('Error in getRestaurants:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET SINGLE RESTAURANT ──────────────────────────────────────────────────────
// GET /api/restaurants/:id
const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    console.error('Error in getRestaurant:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE RESTAURANT ──────────────────────────────────────────────────────────
// POST /api/restaurants
const createRestaurant = async (req, res) => {
  try {
    const { restaurantName, ownerId, contactNo, address, email, cuisine, isVeg, rating } = req.body;
    
    if (!restaurantName || !ownerId) {
      return res.status(400).json({ success: false, message: 'restaurantName and ownerId are required' });
    }
    
    const newRestaurant = new Restaurant({
      restaurantName,
      ownerId,
      contactNo: contactNo || '',
      address: address || '',
      email: email || '',
      cuisine: cuisine || [],
      isVeg: isVeg || false,
      rating: rating || 4.5
    });
    
    await newRestaurant.save();
    
    res.status(201).json({ success: true, data: newRestaurant });
  } catch (error) {
    console.error('Error in createRestaurant:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE RESTAURANT ──────────────────────────────────────────────────────────
// PUT /api/restaurants/:id
const updateRestaurant = async (req, res) => {
  try {
    const { restaurantName, contactNo, address, email, cuisine, isVeg, rating } = req.body;
    
    const updated = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { restaurantName, contactNo, address, email, cuisine, isVeg, rating },
      { new: true }
    );
    
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in updateRestaurant:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE RESTAURANT ──────────────────────────────────────────────────────────
// DELETE /api/restaurants/:id
const deleteRestaurant = async (req, res) => {
  try {
    const deleted = await Restaurant.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    
    res.status(200).json({ success: true, message: 'Restaurant deleted' });
  } catch (error) {
    console.error('Error in deleteRestaurant:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant };
