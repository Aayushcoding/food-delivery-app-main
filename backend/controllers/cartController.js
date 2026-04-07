// const Cart = require('../models/Cart');

// // Get all carts
// const getCarts = async (req, res) => {
//   try {
//     const filters = {};
//     if (req.query.userId) filters.userId = req.query.userId;
//     if (req.query.restaurantId) filters.restaurantId = req.query.restaurantId;
//     const carts = await Cart.find(filters);
//     res.json(carts);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Get single cart
// const getCart = async (req, res) => {
//   try {
//     const cart = await Cart.findOne({ id: req.params.id });
//     if (!cart) return res.status(404).json({ message: 'Cart not found' });
//     res.json(cart);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Create cart
// const createCart = async (req, res) => {
//   try {
//     const { userId, restaurantId, items } = req.body;
//     if (!userId || !restaurantId || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ message: 'Invalid cart data' });
//     }
//     const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//     const cart = new Cart({
//       id: req.body.id || `cart_${Date.now()}`,
//       userId,
//       restaurantId,
//       items,
//       totalAmount
//     });
//     const newCart = await cart.save();
//     res.status(201).json(newCart);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };
// // Update cart
// const updateCart = async (req, res) => {
//   try {
//     const payload = req.body;
//     if (payload.items) {
//       payload.totalAmount = payload.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//     }
//     const updatedCart = await Cart.findOneAndUpdate(
//       { id: req.params.id },
//       payload,
//       { new: true, runValidators: true }
//     );
//     if (!updatedCart) return res.status(404).json({ message: 'Cart not found' });
//     res.json(updatedCart);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// // Delete cart
// const deleteCart = async (req, res) => {
//   try {
//     const cart = await Cart.findOneAndDelete({ id: req.params.id });
//     if (!cart) return res.status(404).json({ message: 'Cart not found' });
//     res.json({ message: 'Cart deleted' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports = {
//   getCarts,
//   getCart,
//   createCart,
//   updateCart,
//   deleteCart
// };


const Cart = require('../models/Cart');

// Get all carts
const getCarts = async (req, res) => {
  try {
    const filters = {};
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.restaurantId) filters.restaurantId = req.query.restaurantId;

    const carts = await Cart.find(filters);
    res.json(carts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single cart
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create cart
const createCart = async (req, res) => {
  try {
    const { userId, restaurantId, items } = req.body;

    if (!userId || !restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid cart data' });
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );

    const cart = new Cart({
      userId,
      restaurantId,
      items,
      totalAmount
    });

    const newCart = await cart.save();
    res.status(201).json(newCart);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update cart
const updateCart = async (req, res) => {
  try {
    const payload = req.body;

    if (payload.items) {
      payload.totalAmount = payload.items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0
      );
    }

    const updatedCart = await Cart.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    if (!updatedCart) return res.status(404).json({ message: 'Cart not found' });

    res.json(updatedCart);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete cart
const deleteCart = async (req, res) => {
  try {
    const cart = await Cart.findByIdAndDelete(req.params.id);

    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    res.json({ message: 'Cart deleted' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCarts,
  getCart,
  createCart,
  updateCart,
  deleteCart
};