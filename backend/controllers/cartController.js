const Cart = require('../models/Cart');

// ── HELPER: Recalculate totalAmount ───────────────────────────────────────────
const calcTotal = (items) =>
  items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);

// ── GET ALL CARTS ──────────────────────────────────────────────────────────────
// GET /api/cart?userId=usr_001&restaurantId=rest_001
const getCarts = async (req, res) => {
  try {
    const { userId, restaurantId } = req.query;
    
    let query = {};

    if (userId) {
      query.userId = userId;
    }

    if (restaurantId) {
      query.restaurantId = restaurantId;
    }

    const carts = await Cart.find(query);

    res.status(200).json({ success: true, total: carts.length, data: carts });
  } catch (error) {
    console.error('Error in getCarts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET SINGLE CART ────────────────────────────────────────────────────────────
// GET /api/cart/:id
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id);
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    console.error('Error in getCart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET CART BY USER ───────────────────────────────────────────────────────────
// GET /api/cart/user/:userId
const getCartByUser = async (req, res) => {
  try {
    const carts = await Cart.find({ userId: req.params.userId });
    res.status(200).json({ success: true, data: carts });
  } catch (error) {
    console.error('Error in getCartByUser:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE CART ────────────────────────────────────────────────────────────────
// POST /api/cart
const createCart = async (req, res) => {
  try {
    const { userId, restaurantId, items } = req.body;

    if (!userId || !restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'userId, restaurantId and items[] are required' });
    }

    // Check if cart already exists for this user and restaurant
    let cart = await Cart.findOne({ userId, restaurantId });
    
    if (cart) {
      // Merge items into existing cart
      for (const newItem of items) {
        if (!newItem.itemId || !newItem.quantity || newItem.price === undefined) {
          return res.status(400).json({ success: false, message: 'Each item must have itemId, quantity and price' });
        }

        const existingIndex = cart.items.findIndex(i => String(i.itemId) === String(newItem.itemId));
        if (existingIndex !== -1) {
          cart.items[existingIndex].quantity += newItem.quantity;
        } else {
          cart.items.push({ itemId: newItem.itemId, quantity: newItem.quantity, price: newItem.price });
        }
      }
      cart.totalAmount = calcTotal(cart.items);
      await cart.save();
      
      return res.status(200).json({
        success: true,
        message: 'Items added to existing cart',
        data: cart,
        summary: { itemCount: cart.items.length, totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0) }
      });
    }

    // Validate every item
    for (const item of items) {
      if (!item.itemId || !item.quantity || item.price === undefined) {
        return res.status(400).json({ success: false, message: 'Each item must have itemId, quantity and price' });
      }
    }

    const totalAmount = calcTotal(items);

    const newCart = new Cart({
      userId,
      restaurantId,
      items,
      totalAmount
    });

    await newCart.save();

    res.status(201).json({
      success: true,
      data: newCart,
      summary: { itemCount: newCart.items.length, totalItems: newCart.items.reduce((sum, item) => sum + item.quantity, 0) }
    });
  } catch (error) {
    console.error('Error in createCart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE CART ────────────────────────────────────────────────────────────────
// PUT /api/cart/:id
const updateCart = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;

    if (Array.isArray(updates.items)) {
      updates.totalAmount = calcTotal(updates.items);
    }

    const updated = await Cart.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in updateCart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ADD ITEM TO CART ───────────────────────────────────────────────────────────
// POST /api/cart/add-item
const addItemToCart = async (req, res) => {
  try {
    const { cartId, itemId, quantity, price } = req.body;

    if (!cartId || !itemId || !quantity) {
      return res.status(400).json({ success: false, message: 'cartId, itemId and quantity are required' });
    }

    let cart = await Cart.findById(cartId);
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const existingIndex = cart.items.findIndex(i => String(i.itemId) === String(itemId));
    if (existingIndex !== -1) {
      cart.items[existingIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({ itemId, quantity: parseInt(quantity), price: price || 0 });
    }

    cart.totalAmount = calcTotal(cart.items);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart,
      summary: { itemCount: cart.items.length, totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0) }
    });
  } catch (error) {
    console.error('Error in addItemToCart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE ITEM QUANTITY ──────────────────────────────────────────────────────
// PUT /api/cart/update-quantity
const updateItemQuantity = async (req, res) => {
  try {
    const { cartId, itemId, quantityChange } = req.body;

    if (!cartId || !itemId || quantityChange === undefined) {
      return res.status(400).json({ success: false, message: 'cartId, itemId and quantityChange are required' });
    }

    let cart = await Cart.findById(cartId);
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(i => String(i.itemId) === String(itemId));
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: `Item '${itemId}' not in cart` });
    }

    cart.items[itemIndex].quantity += parseInt(quantityChange);

    if (cart.items[itemIndex].quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    }

    cart.totalAmount = calcTotal(cart.items);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item quantity updated',
      data: cart,
      summary: { itemCount: cart.items.length, totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0) }
    });
  } catch (error) {
    console.error('Error in updateItemQuantity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── REMOVE ITEM FROM CART ──────────────────────────────────────────────────────
// POST /api/cart/remove-item
const removeItemFromCart = async (req, res) => {
  try {
    const { cartId, itemId, quantity } = req.body;

    if (!cartId || !itemId) {
      return res.status(400).json({ success: false, message: 'cartId and itemId are required' });
    }

    let cart = await Cart.findById(cartId);
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(i => String(i.itemId) === String(itemId));
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: `Item '${itemId}' not in cart` });
    }

    if (quantity && quantity > 0) {
      cart.items[itemIndex].quantity -= parseInt(quantity);
      if (cart.items[itemIndex].quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      }
    } else {
      cart.items.splice(itemIndex, 1);
    }

    cart.totalAmount = calcTotal(cart.items);
    await cart.save();

    res.status(200).json({
      success: true,
      message: quantity ? 'Item quantity reduced' : 'Item removed from cart',
      data: cart,
      summary: { itemCount: cart.items.length, totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0) }
    });
  } catch (error) {
    console.error('Error in removeItemFromCart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE CART ────────────────────────────────────────────────────────────────
// DELETE /api/cart/:id
const deleteCart = async (req, res) => {
  try {
    const deleted = await Cart.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    res.status(200).json({ success: true, message: 'Cart deleted' });
  } catch (error) {
    console.error('Error in deleteCart:', error);
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
