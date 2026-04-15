// controllers/cartController.js
const User = require('../models/User');
const Menu = require('../models/Menu');
const Cart = require('../models/Cart');
const { getNextSequence } = require('../utils/counter');

const calcTotal = (items) =>
  items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

// GET ALL CARTS
const getCarts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId)       filter.userId       = req.query.userId;
    if (req.query.restaurantId) filter.restaurantId = req.query.restaurantId;
    const carts = await Cart.find(filter).lean();
    res.json({ success: true, data: carts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET CART BY ID
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ id: req.params.id }).lean();
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET CART BY USER
const getCartByUser = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId }).sort({ createdAt: -1 }).lean();
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADD ITEM TO CART
const addItemToCart = async (req, res) => {
  try {
    const { userId, itemId, quantity } = req.body;

    if (!userId || !itemId) {
      return res.status(400).json({ success: false, message: 'userId and itemId are required' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive integer' });
    }

    const user = await User.findOne({ id: userId }).lean();
    if (!user) return res.status(404).json({ success: false, message: `User '${userId}' not found` });

    const menuItem = await Menu.findOne({ menuId: itemId }).lean();
    if (!menuItem) return res.status(404).json({ success: false, message: `Menu item '${itemId}' not found` });

    if (!menuItem.isAvailable) {
      return res.status(400).json({ success: false, message: `'${menuItem.itemName}' is currently unavailable` });
    }

    const restaurantId = menuItem.restaurantId;
    let cart = await Cart.findOne({ userId }).sort({ createdAt: -1 });

    if (!cart) {
      cart = new Cart({
        id:           await getNextSequence('cart'),
        userId,
        restaurantId,
        items:        [],
        totalAmount:  0,
        createdAt:    new Date().toISOString(),
        updatedAt:    new Date().toISOString()
      });
    } else if (cart.restaurantId !== restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Your cart has items from another restaurant. Clear your cart first.'
      });
    }

    const existingIndex = cart.items.findIndex(i => i.itemId === itemId);
    if (existingIndex !== -1) {
      cart.items[existingIndex].quantity += qty;
    } else {
      cart.items.push({ itemId, name: menuItem.itemName, price: menuItem.price, quantity: qty, restaurantId });
    }

    cart.totalAmount = calcTotal(cart.items);
    cart.updatedAt   = new Date().toISOString();
    await cart.save();

    res.json({ success: true, message: 'Item added to cart', data: cart.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE ITEM QUANTITY
const updateItemQuantity = async (req, res) => {
  try {
    const { cartId, itemId, quantity } = req.body;
    if (!cartId || !itemId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'cartId, itemId and quantity are required' });
    }

    const cart = await Cart.findOne({ id: cartId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: `Item '${itemId}' not in cart` });

    const newQty = parseInt(quantity);
    if (newQty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = newQty;
    }

    cart.totalAmount = calcTotal(cart.items);
    cart.updatedAt   = new Date().toISOString();
    await cart.save();

    res.json({ success: true, message: 'Cart updated', data: cart.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// REMOVE ITEM FROM CART
const removeItemFromCart = async (req, res) => {
  try {
    const { cartId, itemId } = req.body;
    if (!cartId || !itemId) {
      return res.status(400).json({ success: false, message: 'cartId and itemId are required' });
    }

    const cart = await Cart.findOne({ id: cartId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(i => i.itemId !== itemId);
    cart.totalAmount = calcTotal(cart.items);
    cart.updatedAt   = new Date().toISOString();
    await cart.save();

    res.json({ success: true, message: 'Item removed from cart', data: cart.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE CART
const deleteCart = async (req, res) => {
  try {
    const deleted = await Cart.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Cart not found' });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCarts, getCart, getCartByUser, addItemToCart, updateItemQuantity, removeItemFromCart, deleteCart };
