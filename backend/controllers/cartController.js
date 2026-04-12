///cartController.js
const db = require('../utils/dbManager');

const calcTotal = (items) =>
  items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

// ── GET ALL CARTS ──────────────────────────────────────────────────────────────
const getCarts = async(req, res) => {
  try {
    const { userId, restaurantId } = req.query;
    let carts = db.getAllCarts();
    
    if (userId) carts = carts.filter(c => c.userId === userId);
    if (restaurantId) carts = carts.filter(c => c.restaurantId === restaurantId);
    
    res.json({ success: true, data: carts });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET CART BY ID ──────────────────────────────────────────────────────────────
const getCart = async(req, res) => {
  try {
    const cart = db.getCart(req.params.id);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    res.json({ success: true, data: cart });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET CART BY USER ───────────────────────────────────────────────────────────
const getCartByUser = async(req, res) => {
  try {
    const cart = db.getCartByUserId(req.params.userId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    res.json({ success: true, data: cart });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE/MERGE CART ──────────────────────────────────────────────────────────
// POST /api/cart
// Body: { userId, restaurantId, items[{itemId, quantity, price}] }
const createCart = async(req, res) => {
  try {
    const { userId, restaurantId, items } = req.body;

    // Validation
    if (!userId || userId.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    
    if (!restaurantId || restaurantId.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'restaurantId is required' });
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items array must not be empty' });
    }

    // Verify user exists
    const user = db.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: `User '${userId}' not found` });
    }

    // Verify restaurant exists
    const restaurant = db.getRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: `Restaurant '${restaurantId}' not found` });
    }

    // Check if user has cart with different restaurant
    const allCarts = db.getAllCarts();
    const differentRestCart = allCarts.find(c => c.userId === userId && c.restaurantId !== restaurantId);
    if (differentRestCart) {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only add items from one restaurant at a time. Clear your cart first.' 
      });
    }

    // Check if cart already exists for this user and restaurant
    let cart = db.getCartByUserId(userId);
    
    if (cart && cart.restaurantId === restaurantId) {
      // Merge items into existing cart
      for (const newItem of items) {
        if (!newItem.itemId || !newItem.quantity || newItem.price === undefined) {
          return res.status(400).json({ 
            success: false, 
            message: 'Each item must have menuId, quantity and price' 
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
      const updated = db.updateCart(cart.id, cart);
      
      return res.status(200).json({
        success: true,
        message: 'Items added to existing cart',
        data: updated
      });
    }

    // Validate all items
    for (const item of items) {
      if (!item.itemId || !item.quantity || item.price === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'Each item must have itemId, quantity and price' 
        });
      }
    }

    // Create new cart
    const totalAmount = calcTotal(items);
    cart = db.createCart({
      userId,
      restaurantId,
      items,
      totalAmount
    });

    res.status(201).json({
      success: true,
      data: cart
    });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE CART ────────────────────────────────────────────────────────────────
const updateCart = async(req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.id;

    if (Array.isArray(updates.items)) {
      updates.totalAmount = calcTotal(updates.items);
    }

    const updated = db.updateCart(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    res.json({ success: true, data: updated });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADD ITEM TO CART ───────────────────────────────────────────────────────────
const addItemToCart = async(req, res) => {
  try {
    const { userId, itemId, quantity, price } = req.body;

    if (!userId || !itemId || !quantity || price === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId, itemId, quantity and price are required' 
      });
    }

    // Verify user exists
    const user = db.getUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: `User '${userId}' not found` });
    }

    // Verify menu item exists
    const menuItem = db.getMenuItem(itemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: `Item '${itemId}' not found` });
    }

    if (!menuItem.isAvailable) {
      return res.status(400).json({ 
        success: false, 
        message: `Item '${menuItem.itemName}' is currently unavailable` 
      });
    }

    const restaurantId = menuItem.restaurantId;

    // Get or create cart for this user and restaurant
    let cart = db.getCartByUserId(userId);
    
    if (!cart) {
      // Create new cart
      cart = db.createCart({
        userId,
        restaurantId,
        items: [],
        totalAmount: 0
      });
    } else if (cart.restaurantId !== restaurantId) {
      // User has cart with different restaurant
      return res.status(400).json({ 
        success: false, 
        message: 'You can only add items from one restaurant at a time. Clear your cart first.' 
      });
    }

    // Add or update item
    const existingIndex = cart.items.findIndex(i => i.itemId === itemId);
    if (existingIndex !== -1) {
      cart.items[existingIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({ itemId, quantity: parseInt(quantity), price });
    }

    cart.totalAmount = calcTotal(cart.items);
    const updated = db.updateCart(cart.id, cart);

    res.json({
      success: true,
      message: 'Item added to cart',
      data: updated
    });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE ITEM QUANTITY ──────────────────────────────────────────────────────
const updateItemQuantity = async(req, res) => {
  try {
    const { cartId, itemId, quantity } = req.body;

    if (!cartId || !itemId || quantity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'cartId, itemId and quantity are required' 
      });
    }

    let cart = db.getCart(cartId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: `Item '${itemId}' not in cart` });
    }

    cart.items[itemIndex].quantity = parseInt(quantity);
    
    if (cart.items[itemIndex].quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    }

    cart.totalAmount = calcTotal(cart.items);
    const updated = db.updateCart(cart.id, cart);

    res.json({
      success: true,
      message: 'Item quantity updated',
      data: updated
    });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── REMOVE ITEM FROM CART ──────────────────────────────────────────────────────
const removeItemFromCart = async(req, res) => {
  try {
    const { cartId, itemId } = req.body;

    if (!cartId || !itemId) {
      return res.status(400).json({ 
        success: false, 
        message: 'cartId and itemId are required' 
      });
    }

    let cart = db.getCart(cartId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(i => i.itemId !== itemId);
    cart.totalAmount = calcTotal(cart.items);
    
    const updated = db.updateCart(cart.id, cart);

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: updated
    });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE CART ────────────────────────────────────────────────────────────────
const deleteCart = async(req, res) => {
  try {
    const deleted = db.deleteCart(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    res.json({ success: true, message: 'Cart deleted' });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
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