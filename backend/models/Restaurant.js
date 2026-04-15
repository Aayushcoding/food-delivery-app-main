// models/Restaurant.js
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  restaurantId:        { type: String, required: true, unique: true, index: true },
  restaurantName:      { type: String, required: true, trim: true },
  ownerId:             { type: String, required: true, index: true },
  restaurantContactNo: {
    type:    String,
    default: '',
    validate: {
      validator: (v) => !v || v === '' || /^\d{10}$/.test(v),
      message:   'Contact must be exactly 10 digits'
    }
  },
  address:      { type: String, default: '' },
  email:        { type: String, default: null },
  cuisine:      { type: [String], default: [] },
  isVeg:        { type: Boolean, default: false },
  rating:       { type: Number, default: 0, min: 0, max: 5 },
  gstinNo:      { type: String, default: '' },
  displayImage: { type: String, default: null },
  imageUrl:     { type: String, default: null }
}, {
  versionKey: false,
  toJSON: {
    transform(doc, ret) {
      delete ret._id;
      return ret;
    }
  }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
