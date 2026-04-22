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
  deliveryFee:     { type: Number, default: 40 },                          // flat delivery fee; zeroed by FREEDEL offer
  deliveryAddress: {                                                         // full address object, REQUIRED
    type:     mongoose.Schema.Types.Mixed,
    required: [true, 'Delivery address is required'],
    default:  undefined
  },

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

  // Offer / discount
  offerApplied:     { type: String,  default: null },   // e.g. 'SAVE10'
  discountAmount:   { type: Number,  default: 0 },       // rupees discounted
  finalAmount:      { type: Number,  default: 0 },       // totalAmount - discountAmount

  transactionId:    { type: String, default: '' },
  invoiceGenerated: { type: Boolean, default: false },
  // Idempotency key from frontend — prevents duplicate orders from retries/double-taps
  clientOrderId:    { type: String, default: null, sparse: true },
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
