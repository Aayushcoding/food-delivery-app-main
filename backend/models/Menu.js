// models/Menu.js
// Exact fields: menuId, restaurantId, itemName, price, category,
//               rating, isAvailable, description, isVeg, imageUrl
// restaurantId is STRING — DO NOT use ObjectId or ref

const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
  {
    menuId:      { type: String, required: true, unique: true, trim: true },
    restaurantId:{ type: String, required: true, trim: true }, // STRING ref to restaurants.restaurantId
    itemName:    { type: String, required: true, trim: true },
    price:       { type: Number, required: true, min: 0 },
    category:    { type: String, trim: true },
    rating:      { type: Number, min: 0, max: 5, default: 0 },
    isAvailable: { type: Boolean, default: true },
    description: { type: String, trim: true },
    isVeg:       { type: Boolean, default: true },
    imageUrl:    { type: String, trim: true }
  },
  { versionKey: false }
);

module.exports = mongoose.model('Menu', menuSchema);
