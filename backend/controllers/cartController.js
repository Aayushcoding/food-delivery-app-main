///cartController.js
const db = require('../utils/dbManager');

const calcTotal = (items) =>
  items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

// GET ALL CARTS
const getCarts = async (req, res) => {
  try {
    const { userId, restaurantId } = req.query;
    let carts = db.getAllCarts();
    if (userId) carts = carts.filter(c => c.userId === userId);
    if (restaurantId) carts = carts.filter(c => c.restaurantId === restaurantId);
    res.json({ success: true, data: carts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET CART BY ID
const getCart = async (req, res) => {
  try {
    const cart = db.getCart(req.params.id);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET CART BY USER
const getCartByUser = async (req, res) => {
  try {
    const cart = db.getCartByUserId(req.params.userId);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ADD ITEM TO CART
// POST /api/cart/add-item
// Body: { userId, itemId, quantity }
// Price and name are ALWAYS taken from DB — never trusted from client.
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

    const user = db.getUser(userId);
    if (!user) return res.status(404).json({ success: false, message: `User '${userId}' not found` });

    // Look up menu item in DB — use server-side price and name
    const menuItem = db.getMenuItem(itemId);
    if (!menuItem) return res.status(404).json({ success: false, message: `Menu item '${itemId}' not found` });

    if (!menuItem.isAvailable) {
      return res.status(400).json({ success: false, message: `'${menuItem.itemName}' is currently unavailable` });
    }

    const restaurantId = menuItem.restaurantId;
    let cart = db.getCartByUserId(userId);

    if (!cart) {
      cart = db.createCart({ userId, restaurantId, items: [], totalAmount: 0 });
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
      cart.items.push({
        itemId,
        name: menuItem.itemName,
        price: menuItem.price,
        quantity: qty,
        restaurantId
      });
    }

    cart.totalAmount = calcTotal(cart.items);
    const updated = db.updateCart(cart.id, cart);
    res.json({ success: true, message: 'Item added to cart', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE ITEM QUANTITY
// PUT /api/cart/update-quantity
// Body: { cartId, itemId, quantity }
const updateItemQuantity = async (req, res) => {
  try {
    const { cartId, itemId, quantity } = req.body;
    if (!cartId || !itemId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'cartId, itemId and quantity are required' });
    }

    let cart = db.getCart(cartId);
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
    const updated = db.updateCart(cart.id, cart);
    res.json({ success: true, message: 'Cart updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// REMOVE ITEM FROM CART
// POST /api/cart/remove-item
// Body: { cartId, itemId }
const removeItemFromCart = async (req, res) => {
  try {
    const { cartId, itemId } = req.body;
    if (!cartId || !itemId) {
      return res.status(400).json({ success: false, message: 'cartId and itemId are required' });
    }

    let cart = db.getCart(cartId);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(i => i.itemId !== itemId);
    cart.totalAmount = calcTotal(cart.items);
    const updated = db.updateCart(cart.id, cart);
    res.json({ success: true, message: 'Item removed from cart', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE CART
const deleteCart = async (req, res) => {
  try {
    const deleted = db.deleteCart(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Cart not found' });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCarts, getCart, getCartByUser, addItemToCart, updateItemQuantity, removeItemFromCart, deleteCart };
