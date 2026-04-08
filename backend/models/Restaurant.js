// models/Restaurant.js
// Exact fields: restaurantId, restaurantName, ownerId, contactNo, address, email,
//               cuisine[], isVeg, rating, gstinNo, imageUrl
// All IDs are STRING — DO NOT use ObjectId or ref

const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    restaurantId:   { type: String, required: true, unique: true, trim: true },
    restaurantName: { type: String, required: true, trim: true },
    ownerId:        { type: String, required: true, trim: true }, // STRING ref to users.id
    contactNo:      { type: String, required: true, trim: true, match: [/^\+?\d{10,15}$/, 'Phone number must be 10-15 digits, optionally starting with +'] },
    address:        { type: String, required: true, trim: true },
    email:          { type: String, required: true, trim: true, lowercase: true, match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'] },
    cuisine:        { type: [String], default: [] },
    isVeg:          { type: Boolean, default: false },
    rating:         { type: Number, min: 0, max: 5, default: 0 },
    gstinNo:        { type: String, trim: true },
    imageUrl:       { type: String, trim: true }
  },
  { versionKey: false }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
