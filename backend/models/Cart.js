const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  itemId: String,
  quantity: Number,
  price: Number
});

const cartSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  restaurantId: {
    type: String,
    required: true
  },
  items: [cartItemSchema],
  totalAmount: Number
});

module.exports = mongoose.model('Cart', cartSchema);