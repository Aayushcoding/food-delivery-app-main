const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  restaurantId: {
    type: String,
    required: true,
    unique: true
  },
  restaurantName: {
    type: String,
    required: true
  },
  ownerId: {
    type: String,
    required: true
  },
  contactNo: String,
  address: String,
  email: String,
  cuisine: [String],
  isVeg: Boolean,
  rating: {
    type: Number,
    default: 0
  },
  gstinNo: String,
  imageUrl: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);