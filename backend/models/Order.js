// models/Order.js
// Exact fields: orderId, userId, restaurantId, items[{itemId,quantity,price}],
//               totalAmount, status, date, deliveryAgentId
// All IDs are STRING — DO NOT use ObjectId or ref

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    itemId:   { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price:    { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId:         { type: String, required: true, unique: true, trim: true },
    userId:          { type: String, required: true, trim: true },
    restaurantId:    { type: String, required: true, trim: true },
    items:           { type: [orderItemSchema], default: [] },
    totalAmount:     { type: Number, required: true, min: 0 },
    status:          {
      type: String,
      enum: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    date:            { type: Date, default: Date.now },
    deliveryAgentId: { type: String, default: null, trim: true } // STRING ref to deliveryAgents.id
  },
  { versionKey: false }
);

module.exports = mongoose.model('Order', orderSchema);
