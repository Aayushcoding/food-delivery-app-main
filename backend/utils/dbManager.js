// utils/dbManager.js
// MongoDB data access layer — kept for backwards compatibility.
// All ID generation uses Counter-based auto-increment via getNextSequence().

const { getNextSequence } = require('./counter');
const User       = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Menu       = require('../models/Menu');
const Cart       = require('../models/Cart');
const Order      = require('../models/Order');

const strip = (doc) => {
  if (!doc) return doc;
  const obj = { ...doc };
  delete obj._id;
  delete obj.__v;
  return obj;
};
const stripMany = (docs) => docs.map(strip);

// ─── USERS ────────────────────────────────────────────────────────────────────

const getUser             = (id)          => User.findOne({ id }).lean().then(strip);
const getUserByEmail      = (email)       => User.findOne({ email: email.toLowerCase() }).lean().then(strip);
const getUserByEmailAndRole = (email, role) => User.findOne({ email: email.toLowerCase(), role }).lean().then(strip);
const getAllUsers          = ()            => User.find({}).lean().then(stripMany);

const createUser = async (userData) => {
  const user = new User({
    id:        userData.id || await getNextSequence('usr'),
    username:  userData.username,
    email:     userData.email.toLowerCase().trim(),
    password:  userData.password,
    phoneNo:   userData.phoneNo ? userData.phoneNo.trim() : '',
    address:   userData.address || [],
    role:      userData.role || 'Customer',
    createdAt: userData.createdAt || new Date().toISOString()
  });
  const saved = await user.save();
  return strip(saved.toObject({ versionKey: false }));
};

const updateUser = (id, updates) =>
  User.findOneAndUpdate({ id }, updates, { new: true }).lean().then(strip);

const deleteUser = (id) =>
  User.findOneAndDelete({ id }).lean().then(strip);

// ─── RESTAURANTS ──────────────────────────────────────────────────────────────

const getRestaurant        = (restaurantId) => Restaurant.findOne({ restaurantId }).lean().then(strip);
const getRestaurantByOwnerId = (ownerId)    => Restaurant.find({ ownerId }).lean().then(stripMany);
const getAllRestaurants     = ()             => Restaurant.find({}).lean().then(stripMany);

const createRestaurant = async (data) => {
  if (!data.restaurantName?.trim()) throw new Error('restaurantName is required');
  if (!data.ownerId?.trim())        throw new Error('ownerId is required');

  let cuisine = data.cuisine;
  if (!cuisine) cuisine = [];
  else if (typeof cuisine === 'string') cuisine = cuisine.split(',').map(c => c.trim()).filter(Boolean);
  else if (!Array.isArray(cuisine))     cuisine = [String(cuisine)];

  const restaurant = new Restaurant({
    restaurantId:        data.restaurantId || await getNextSequence('rest'),
    restaurantName:      data.restaurantName.trim(),
    ownerId:             data.ownerId,
    restaurantContactNo: data.restaurantContactNo || '',
    address:             data.address || '',
    email:               (data.email && data.email.trim()) ? data.email.trim().toLowerCase() : null,
    cuisine,
    isVeg:               data.isVeg || false,
    rating:              data.rating || 0,
    gstinNo:             data.gstinNo || '',
    displayImage:        (data.displayImage || data.imageUrl || '').trim() || null,
    imageUrl:            (data.displayImage || data.imageUrl || '').trim() || null
  });
  const saved = await restaurant.save();
  return strip(saved.toObject({ versionKey: false }));
};

const updateRestaurant = async (restaurantId, updates) => {
  if (updates.cuisine !== undefined) {
    if (typeof updates.cuisine === 'string') {
      updates.cuisine = updates.cuisine.split(',').map(c => c.trim()).filter(Boolean);
    } else if (!Array.isArray(updates.cuisine)) {
      updates.cuisine = updates.cuisine ? [String(updates.cuisine)] : [];
    }
  }
  if (updates.email !== undefined) {
    updates.email = (updates.email && updates.email.trim()) ? updates.email.trim().toLowerCase() : null;
  }
  return Restaurant.findOneAndUpdate({ restaurantId }, updates, { new: true }).lean().then(strip);
};

const deleteRestaurant = (restaurantId) =>
  Restaurant.findOneAndDelete({ restaurantId }).lean().then(strip);

// ─── MENU ─────────────────────────────────────────────────────────────────────

const getMenuItem       = (menuId)       => Menu.findOne({ menuId }).lean().then(strip);
const getMenuByRestaurant = (restaurantId) => Menu.find({ restaurantId }).lean().then(stripMany);
const getAllMenus        = ()             => Menu.find({}).lean().then(stripMany);

const createMenuItem = async (data) => {
  if (!data.restaurantId)     throw new Error('restaurantId is required for menu item');
  if (!data.itemName?.trim()) throw new Error('itemName is required');
  if (data.price === undefined || isNaN(Number(data.price)) || Number(data.price) < 0)
    throw new Error('price must be a non-negative number');

  const restaurant = await getRestaurant(data.restaurantId);
  if (!restaurant) throw new Error(`Restaurant '${data.restaurantId}' not found`);

  const item = new Menu({
    menuId:       data.menuId || await getNextSequence('menu'),
    restaurantId: data.restaurantId,
    itemName:     data.itemName.trim(),
    price:        Number(data.price),
    category:     data.category || '',
    rating:       data.rating || 0,
    isAvailable:  data.isAvailable !== undefined ? data.isAvailable : true,
    description:  data.description || '',
    isVeg:        data.isVeg || false,
    image:        (data.image || data.imageUrl || '').trim() || null,
    imageUrl:     (data.image || data.imageUrl || '').trim() || null
  });
  const saved = await item.save();
  return strip(saved.toObject({ versionKey: false }));
};

const updateMenuItem = (menuId, updates) =>
  Menu.findOneAndUpdate({ menuId }, updates, { new: true }).lean().then(strip);

const deleteMenuItem = (menuId) =>
  Menu.findOneAndDelete({ menuId }).lean().then(strip);

// ─── CART ─────────────────────────────────────────────────────────────────────

const getCart        = (id)     => Cart.findOne({ id }).lean().then(strip);
const getCartByUserId = (userId) => Cart.findOne({ userId }).sort({ createdAt: -1 }).lean().then(strip);
const getAllCarts     = ()       => Cart.find({}).lean().then(stripMany);

const createCart = async (data) => {
  const cart = new Cart({
    id:           data.id || await getNextSequence('cart'),
    userId:       data.userId,
    restaurantId: data.restaurantId || '',
    items:        data.items || [],
    totalAmount:  data.totalAmount || 0,
    createdAt:    data.createdAt || new Date().toISOString(),
    updatedAt:    new Date().toISOString()
  });
  const saved = await cart.save();
  return strip(saved.toObject({ versionKey: false }));
};

const updateCart = (id, updates) => {
  updates.updatedAt = new Date().toISOString();
  return Cart.findOneAndUpdate({ id }, updates, { new: true }).lean().then(strip);
};

const deleteCart = (id) =>
  Cart.findOneAndDelete({ id }).lean().then(strip);

// ─── ORDERS ───────────────────────────────────────────────────────────────────

const getOrder              = (id)          => Order.findOne({ id }).lean().then(strip);
const getOrdersByUserId     = (userId)      => Order.find({ userId }).sort({ createdAt: -1 }).lean().then(stripMany);
const getOrdersByRestaurantId = (restaurantId) => Order.find({ restaurantId }).sort({ createdAt: -1 }).lean().then(stripMany);
const getAllOrders           = ()            => Order.find({}).lean().then(stripMany);

const createOrder = async (data) => {
  const order = new Order({
    id:              data.id || await getNextSequence('ord'),
    userId:          data.userId,
    restaurantId:    data.restaurantId || '',
    items:           data.items || [],
    totalAmount:     data.totalAmount || 0,
    deliveryAddress: data.deliveryAddress || '',
    status:          data.status || 'pending',
    createdAt:       data.createdAt || new Date().toISOString()
  });
  const saved = await order.save();
  return strip(saved.toObject({ versionKey: false }));
};

const updateOrder = (id, updates) =>
  Order.findOneAndUpdate({ id }, updates, { new: true }).lean().then(strip);

const deleteOrder = (id) =>
  Order.findOneAndDelete({ id }).lean().then(strip);

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  getUser, getUserByEmail, getUserByEmailAndRole, getAllUsers, createUser, updateUser, deleteUser,
  getRestaurant, getRestaurantByOwnerId, getAllRestaurants, createRestaurant, updateRestaurant, deleteRestaurant,
  getMenuItem, getMenuByRestaurant, getAllMenus, createMenuItem, updateMenuItem, deleteMenuItem,
  getCart, getCartByUserId, getAllCarts, createCart, updateCart, deleteCart,
  getOrder, getOrdersByUserId, getOrdersByRestaurantId, getAllOrders, createOrder, updateOrder, deleteOrder
};
