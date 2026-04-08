// controllers/cartController.js
// Fields: id, userId, restaurantId, items[{itemId, quantity, price}], totalAmount
// String query: Cart.findOne({ id: value }) — NO findById(), NO populate()

const Cart       = require('../models/Cart');
const Menu       = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const User       = require('../models/User');

// ── HELPER: Recalculate totalAmount ───────────────────────────────────────────
const calcTotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// ── GET ALL CARTS ──────────────────────────────────────────────────────────────
// GET /api/carts?userId=usr_001&restaurantId=rest_001&page=1&limit=10
const getCarts = async (req, res) => {
  try {
    const { userId, restaurantId, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (userId)       filter.userId       = userId;
    if (restaurantId) filter.restaurantId = restaurantId;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Cart.countDocuments(filter);
    const carts = await Cart.find(filter).skip(skip).limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), data: carts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET SINGLE CART ────────────────────────────────────────────────────────────
// GET /api/carts/:id   (id = "cart_001")
const getCart = async (req, res) => {
  try {
    // String-based query — DO NOT use findById()
    const cart = await Cart.findOne({ id: req.params.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET CART BY USER ───────────────────────────────────────────────────────────
// GET /api/carts/user/:userId
const getCartByUser = async (req, res) => {
  try {
    const carts = await Cart.find({ userId: req.params.userId });
    res.json({ success: true, data: carts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── CREATE CART ────────────────────────────────────────────────────────────────
// POST /api/carts
// Body: { id?, userId, restaurantId, items[{itemId, quantity, price}] }
// If cart exists for user+restaurant, merges items instead of creating new
const createCart = async (req, res) => {
  try {
    const { userId, restaurantId, items } = req.body;

    if (!userId || !restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'userId, restaurantId and items[] are required' });
    }

    // Verify user exists (string query)
    const user = await User.findOne({ id: userId });
    if (!user) return res.status(404).json({ message: `User '${userId}' not found` });

    // Verify restaurant exists (string query)
    const restaurant = await Restaurant.findOne({ restaurantId });
    if (!restaurant) return res.status(404).json({ message: `Restaurant '${restaurantId}' not found` });

    // Check if user already has a cart with different restaurant
    const existingCart = await Cart.findOne({ userId, restaurantId: { $ne: restaurantId } });
    if (existingCart) {
      return res.status(400).json({ message: 'You can only add items from one restaurant at a time. Clear your cart first.' });
    }

    // Check if cart already exists for this user and restaurant
    let cart = await Cart.findOne({ userId, restaurantId });
    if (cart) {
      // Merge items into existing cart
      for (const newItem of items) {
        if (!newItem.itemId || !newItem.quantity || newItem.price === undefined) {
          return res.status(400).json({ message: 'Each item must have itemId, quantity and price' });
        }
        const menuItem = await Menu.findOne({ menuId: newItem.itemId, restaurantId });
        if (!menuItem) {
          return res.status(404).json({
            message: `Menu item '${newItem.itemId}' not found in restaurant '${restaurantId}'`
          });
        }
        const existingIndex = cart.items.findIndex(i => i.itemId === newItem.itemId);
        if (existingIndex !== -1) {
          cart.items[existingIndex].quantity += newItem.quantity;
        } else {
          cart.items.push({ itemId: newItem.itemId, quantity: newItem.quantity, price: newItem.price });
        }
      }
      cart.totalAmount = calcTotal(cart.items);
      const saved = await cart.save();
      return res.status(200).json({ 
        success: true, 
        message: 'Items added to existing cart', 
        data: saved,
        summary: { itemCount: saved.items.length, totalItems: saved.items.reduce((sum, item) => sum + item.quantity, 0) }
      });
    }

    // Validate every item: must exist in menu and belong to this restaurant
    for (const item of items) {
      if (!item.itemId || !item.quantity || item.price === undefined) {
        return res.status(400).json({ message: 'Each item must have itemId, quantity and price' });
      }
      const menuItem = await Menu.findOne({ menuId: item.itemId, restaurantId });
      if (!menuItem) {
        return res.status(404).json({
          message: `Menu item '${item.itemId}' not found in restaurant '${restaurantId}'`
        });
      }
    }

    const totalAmount = calcTotal(items);

    // Generate cart id if not provided
    const count = await Cart.countDocuments();
    const cartId = req.body.id || `cart_${String(count + 1).padStart(3, '0')}`;

    cart  = new Cart({ id: cartId, userId, restaurantId, items, totalAmount });
    const saved = await cart.save();
    res.status(201).json({ 
      success: true, 
      data: saved,
      summary: { itemCount: saved.items.length, totalItems: saved.items.reduce((sum, item) => sum + item.quantity, 0) }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── UPDATE CART ────────────────────────────────────────────────────────────────
// PUT /api/carts/:id
// Recalculates totalAmount automatically when items are updated
const updateCart = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.id; // prevent id override

    // Recalculate totalAmount if items are being updated
    if (Array.isArray(updates.items)) {
      updates.totalAmount = calcTotal(updates.items);
    }

    const updated = await Cart.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Cart not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── ADD ITEM TO CART ───────────────────────────────────────────────────────────
// POST /api/carts/add-item
// Body: { cartId, itemId, quantity }
// Business rule: cart can only have items from ONE restaurant
const addItemToCart = async (req, res) => {
  try {
    const { cartId, itemId, quantity } = req.body;

    if (!cartId || !itemId || !quantity) {
      return res.status(400).json({ message: 'cartId, itemId and quantity are required' });
    }

    const cart = await Cart.findOne({ id: cartId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    // Validate item belongs to cart's restaurant
    const menuItem = await Menu.findOne({ menuId: itemId, restaurantId: cart.restaurantId });
    if (!menuItem) {
      return res.status(404).json({
        message: `Item '${itemId}' not found in restaurant '${cart.restaurantId}'`
      });
    }

    // Check isAvailable
    if (!menuItem.isAvailable) {
      return res.status(400).json({ message: `Item '${menuItem.itemName}' is currently unavailable` });
    }

    const existingIndex = cart.items.findIndex((i) => i.itemId === itemId);
    if (existingIndex !== -1) {
      cart.items[existingIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({ itemId, quantity: parseInt(quantity), price: menuItem.price });
    }

    cart.totalAmount = calcTotal(cart.items);
    await cart.save();

    res.json({ 
      success: true, 
      message: 'Item added to cart', 
      data: cart,
      summary: { itemCount: cart.items.length, totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0) }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── UPDATE ITEM QUANTITY ──────────────────────────────────────────────────────
// PUT /api/carts/update-quantity
// Body: { cartId, itemId, quantityChange }  // quantityChange: positive to add, negative to subtract
const updateItemQuantity = async (req, res) => {
  try {
    const { cartId, itemId, quantityChange } = req.body;

    if (!cartId || !itemId || quantityChange === undefined) {
      return res.status(400).json({ message: 'cartId, itemId and quantityChange are required' });
    }

    const cart = await Cart.findOne({ id: cartId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: `Item '${itemId}' not in cart` });
    }

    cart.items[itemIndex].quantity += parseInt(quantityChange);

    // Remove item if quantity becomes 0 or negative
    if (cart.items[itemIndex].quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    }

    cart.totalAmount = calcTotal(cart.items);
    await cart.save();

    res.json({ 
      success: true, 
      message: 'Item quantity updated', 
      data: cart,
      summary: { itemCount: cart.items.length, totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0) }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── REMOVE ITEM FROM CART ──────────────────────────────────────────────────────
// POST /api/carts/remove-item
// Body: { cartId, itemId, quantity? }  // If quantity provided, subtract it; else remove entire item
const removeItemFromCart = async (req, res) => {
  try {
    const { cartId, itemId, quantity } = req.body;

    if (!cartId || !itemId) {
      return res.status(400).json({ message: 'cartId and itemId are required' });
    }

    const cart = await Cart.findOne({ id: cartId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1) return res.status(404).json({ message: `Item '${itemId}' not in cart` });

    if (quantity && quantity > 0) {
      // Subtract quantity
      cart.items[itemIndex].quantity -= parseInt(quantity);
      if (cart.items[itemIndex].quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      }
    } else {
      // Remove entire item
      cart.items.splice(itemIndex, 1);
    }

    cart.totalAmount = calcTotal(cart.items);
    await cart.save();

    res.json({ 
      success: true, 
      message: quantity ? 'Item quantity reduced' : 'Item removed from cart', 
      data: cart,
      summary: { itemCount: cart.items.length, totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0) }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── DELETE CART ────────────────────────────────────────────────────────────────
// DELETE /api/carts/:id
const deleteCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndDelete({ id: req.params.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    res.json({ success: true, message: 'Cart deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCarts,
  getCart,
  getCartByUser,
  createCart,
  updateCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  deleteCart
};
