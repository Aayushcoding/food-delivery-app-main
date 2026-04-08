// controllers/restaurantController.js
// Fields: restaurantId, restaurantName, ownerId, contactNo, address,
//         email, cuisine[], isVeg, rating, gstinNo, imageUrl
// String query: Restaurant.findOne({ restaurantId: value }) — NO findById(), NO populate()

const Restaurant = require('../models/Restaurant');

// ── GET ALL RESTAURANTS ────────────────────────────────────────────────────────
// GET /api/restaurants?isVeg=true&cuisine=Indian&search=spice&page=1&limit=10&sortBy=rating&order=desc
const getRestaurants = async (req, res) => {
  try {
    const { isVeg, cuisine, search, ownerId, page = 1, limit = 10, sortBy = 'restaurantName', order = 'asc' } = req.query;
    const filter = {};

    if (isVeg !== undefined)  filter.isVeg = isVeg === 'true';
    if (ownerId)              filter.ownerId = ownerId;
    if (cuisine)              filter.cuisine = { $in: [cuisine] };
    if (search) {
      filter.$or = [
        { restaurantName: { $regex: search, $options: 'i' } },
        { address:        { $regex: search, $options: 'i' } },
        { cuisine:        { $regex: search, $options: 'i' } }
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const skip      = (parseInt(page) - 1) * parseInt(limit);
    const total     = await Restaurant.countDocuments(filter);

    const restaurants = await Restaurant.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), data: restaurants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET SINGLE RESTAURANT ──────────────────────────────────────────────────────
// GET /api/restaurants/:id   (id = "rest_001")
const getRestaurant = async (req, res) => {
  try {
    // String-based query — DO NOT use findById()
    const restaurant = await Restaurant.findOne({ restaurantId: req.params.id });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── CREATE RESTAURANT ──────────────────────────────────────────────────────────
// POST /api/restaurants
const createRestaurant = async (req, res) => {
  try {
    const { restaurantId, restaurantName, ownerId, contactNo, address, email } = req.body;

    if (!restaurantId || !restaurantName || !ownerId || !contactNo || !address || !email) {
      return res.status(400).json({ message: 'restaurantId, restaurantName, ownerId, contactNo, address and email are required' });
    }

    const existing = await Restaurant.findOne({ restaurantId });
    if (existing) return res.status(409).json({ message: `Restaurant '${restaurantId}' already exists` });

    const restaurant = new Restaurant(req.body);
    const saved = await restaurant.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── UPDATE RESTAURANT ──────────────────────────────────────────────────────────
// PUT /api/restaurants/:id
const updateRestaurant = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.restaurantId; // prevent id override

    const updated = await Restaurant.findOneAndUpdate(
      { restaurantId: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Restaurant not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── DELETE RESTAURANT ──────────────────────────────────────────────────────────
// DELETE /api/restaurants/:id
const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOneAndDelete({ restaurantId: req.params.id });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json({ success: true, message: 'Restaurant deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant };
