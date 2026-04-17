// models/Order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId:       { type: String, required: true },
  name:         { type: String, default: '' },
  itemName:     { type: String, default: '' },
  price:        { type: Number, default: 0 },
  quantity:     { type: Number, default: 1 },
  restaurantId: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  id:              { type: String, required: true, unique: true, index: true },
  userId:          { type: String, required: true, index: true },
  restaurantId:    { type: String, default: '' },
  items:           { type: [orderItemSchema], default: [] },
  totalAmount:     { type: Number, default: 0 },
  deliveryAddress: { type: String, default: '' },
  status:          {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'out_for_delivery',
      'picked_up',
      'on_the_way',
      'arriving',
      'delivered',
      'cancelled'
    ],
    default: 'pending'
  },
  // Delivery agent assignment
  deliveryAgentId:      { type: String, default: null },
  acceptedAt:           { type: String, default: null },   // ISO string (Part 1 compat)
  deliveryAcceptedAt:   { type: Date,   default: null },   // Date object for timeout math
  deliveredAt:          { type: Date,   default: null },   // Timestamp on completion

  transactionId:    { type: String, default: '' },
  invoiceGenerated: { type: Boolean, default: false },
  createdAt:        { type: String, default: () => new Date().toISOString() }
}, {
  versionKey: false,
  toJSON: {
    transform(doc, ret) {
      delete ret._id;
      return ret;
    }
  }
});

module.exports = mongoose.model('Order', orderSchema);
