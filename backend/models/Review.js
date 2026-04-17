// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true, index: true },
  userId:       { type: String, required: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  orderId:      { type: String, default: '', index: true },
  username:     { type: String, default: 'Anonymous' },
  rating:       { type: Number, required: true, min: 1, max: 5 },
  comment:      { type: String, default: '' },
  createdAt:    { type: String, default: () => new Date().toISOString() }
}, {
  versionKey: false,
  toJSON: {
    transform(doc, ret) {
      delete ret._id;
      return ret;
    }
  }
});

module.exports = mongoose.model('Review', reviewSchema);
