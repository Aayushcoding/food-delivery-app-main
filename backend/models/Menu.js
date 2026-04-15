// models/Menu.js
const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  menuId:       { type: String, required: true, unique: true, index: true },
  restaurantId: { type: String, required: true, index: true },
  itemName:     { type: String, required: true, trim: true },
  price:        { type: Number, required: true, min: 0 },
  category:     { type: String, default: '' },
  rating:       { type: Number, default: 0, min: 0, max: 5 },
  isAvailable:  { type: Boolean, default: true },
  description:  { type: String, default: '' },
  isVeg:        { type: Boolean, default: false },
  image:        { type: String, default: null },
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

module.exports = mongoose.model('Menu', menuSchema);
