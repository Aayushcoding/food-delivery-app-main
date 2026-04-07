const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId: String,
  quantity: Number,
  price: Number
});

const orderSchema = new mongoose.Schema({
  orderId: {
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
  items: [orderItemSchema],
  totalAmount: Number,
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'Out for Delivery', 'Delivered'],
    default: 'Pending'
  },
  date: {
    type: Date,
    default: Date.now
  },
  deliveryAgentId: String
});

module.exports = mongoose.model('Order', orderSchema);