// controllers/restaurantController.js
const Restaurant = require('../models/Restaurant');
const Order      = require('../models/Order');
const Menu       = require('../models/Menu');
const { getNextSequence } = require('../utils/counter');

const PHONE_REGEX = /^\d{10}$/;

const normalizeCuisine = (cuisine) => {
  if (!cuisine) return [];
  if (Array.isArray(cuisine)) return cuisine.map(c => c.trim()).filter(Boolean);
  try { const p = JSON.parse(cuisine); if (Array.isArray(p)) return p.map(c => c.trim()).filter(Boolean); } catch (_) {}
  return cuisine.split(',').map(c => c.trim()).filter(Boolean);
};

const resolveImage = (req) => {
  if (req.file) return `/uploads/${req.file.filename}`;
  return (req.body.displayImage || '').trim() || null;
};

// GET /api/restaurants
const getAllRestaurants = async (req, res) => {
  try {
    const { search, city } = req.query;

    const filter = {};

    // City-based filtering: strict lowercase exact match
    if (city && city.trim()) {
      const normalizedCity = city.trim().toLowerCase();
      filter.city = normalizedCity;
      console.log(`[getAllRestaurants] Filtering by city: "${normalizedCity}"`);
    }

    let restaurants = await Restaurant.find(filter).lean();
    console.log(`[getAllRestaurants] Found ${restaurants.length} restaurant(s) | city filter: "${filter.city || 'none'}"`);


    if (search) {
      const q = search.toLowerCase();
      restaurants = restaurants.filter(r =>
        r.restaurantName.toLowerCase().includes(q) ||
        (r.cuisine || []).some(c => c.toLowerCase().includes(q))
      );
    }
    res.json({ success: true, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/restaurants/owner/:ownerId
const getRestaurantByOwner = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ ownerId: req.params.ownerId }).lean();
    res.json({ success: true, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



// GET /api/restaurants/:id
const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ restaurantId: req.params.id }).lean();
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/restaurants/:id/menu
const getRestaurantMenu = async (req, res) => {
  try {
    const items = await Menu.find({ restaurantId: req.params.id, isAvailable: true }).lean();
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/restaurants
const createRestaurant = async (req, res) => {
  try {
    const { restaurantName, restaurantContactNo, address, city, cuisine } = req.body;
    const ownerId = req.user.id;

    if (!restaurantName?.trim()) return res.status(400).json({ success: false, message: 'restaurantName is required' });

    if (restaurantContactNo?.trim() && !PHONE_REGEX.test(restaurantContactNo.trim()))
      return res.status(400).json({ success: false, message: 'Contact must be exactly 10 digits' });

    const restaurant = await new Restaurant({
      restaurantId:        await getNextSequence('rest'),
      restaurantName:      restaurantName.trim(),
      ownerId,
      restaurantContactNo: restaurantContactNo?.trim() || '',
      address:             address || '',
      city:                (city || '').trim().toLowerCase(),
      cuisine:             normalizeCuisine(cuisine),
      displayImage:        resolveImage(req)
    }).save();

    res.status(201).json({ success: true, data: restaurant.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/restaurants/:id
const updateRestaurant = async (req, res) => {
  try {
    const existing = await Restaurant.findOne({ restaurantId: req.params.id });
    if (!existing) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    if (req.user.id !== existing.ownerId) return res.status(403).json({ success: false, message: 'Not your restaurant' });

    const { restaurantName, address, city, restaurantContactNo, cuisine } = req.body;

    if (restaurantContactNo?.trim() && !PHONE_REGEX.test(restaurantContactNo.trim()))
      return res.status(400).json({ success: false, message: 'Contact must be exactly 10 digits' });

    const updates = {};
    if (restaurantName?.trim())            updates.restaurantName      = restaurantName.trim();
    if (address !== undefined)             updates.address             = address;
    if (city    !== undefined)             updates.city                = city.trim().toLowerCase();
    if (restaurantContactNo !== undefined) updates.restaurantContactNo = restaurantContactNo.trim();
    if (cuisine !== undefined)             updates.cuisine             = normalizeCuisine(cuisine);
    if (req.file)                          updates.displayImage        = `/uploads/${req.file.filename}`;
    else if (req.body.displayImage !== undefined) updates.displayImage = req.body.displayImage.trim() || null;

    const updated = await Restaurant.findOneAndUpdate({ restaurantId: req.params.id }, updates, { new: true }).lean();
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/restaurants/:id
const deleteRestaurant = async (req, res) => {
  try {
    const existing = await Restaurant.findOne({ restaurantId: req.params.id });
    if (!existing) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    if (req.user.id !== existing.ownerId) return res.status(403).json({ success: false, message: 'Not your restaurant' });
    await Restaurant.findOneAndDelete({ restaurantId: req.params.id });
    res.json({ success: true, message: 'Restaurant deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/restaurants/dashboard?restaurantId=<id>
// Owner dashboard — real data only, no fake figures.
const getRestaurantDashboard = async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId || req.params.restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }

    const restaurant = await Restaurant.findOne({ restaurantId }).lean();
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Active orders = everything that is NOT delivered or cancelled
    const inactiveStatuses = ['delivered', 'cancelled'];

    const [totalOrders, activeOrders, deliveredOrders] = await Promise.all([
      Order.countDocuments({ restaurantId }),
      Order.countDocuments({ restaurantId, status: { $nin: inactiveStatuses } }),
      Order.find({ restaurantId, status: 'delivered' }, { finalAmount: 1, totalAmount: 1 }).lean()
    ]);

    // Revenue = sum of finalAmount (or totalAmount as fallback) for delivered orders only
    const totalRevenue = deliveredOrders.reduce((sum, o) => {
      const amount = (o.finalAmount && o.finalAmount > 0) ? o.finalAmount : (o.totalAmount || 0);
      return sum + amount;
    }, 0);

    console.log(`[dashboard] restaurantId:${restaurantId} | total:${totalOrders} | active:${activeOrders} | revenue:${totalRevenue}`);

    return res.json({
      success: true,
      data: {
        restaurantId,
        restaurantName: restaurant.restaurantName,
        totalOrders,
        pendingOrders:  activeOrders,      // all non-delivered/non-cancelled
        totalRevenue                        // sum from delivered orders only
      }
    });
  } catch (err) {
    console.error('[getRestaurantDashboard]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllRestaurants, getRestaurantById, getRestaurantMenu, getRestaurantByOwner, createRestaurant, updateRestaurant, deleteRestaurant, getRestaurantDashboard };