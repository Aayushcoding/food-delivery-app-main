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
  city:         { type: String, default: '', lowercase: true, trim: true, index: true },   // always stored lowercase for city-based filtering
  email:        { type: String, default: null },
  cuisine:      { type: [String], default: [] },
  isVeg:        { type: Boolean, default: false },
  rating:       { type: Number, default: 0, min: 0, max: 5 },
  reviewCount:   { type: Number, default: 0 },         // total number of reviews
  gstinNo:      { type: String, default: '' },
  displayImage:  { type: String, default: null },
  imageUrl:      { type: String, default: null },
  totalRevenue:  { type: Number, default: 0 }      // accumulated from delivered orders
}, {
  versionKey: false,
  toJSON: {
    transform(doc, ret) {
      delete ret._id;
      return ret;
    }
  }
});

// Pre-save hook: ensure city is always lowercase + trimmed, regardless of caller
restaurantSchema.pre('save', function (next) {
  if (this.city != null) {
    this.city = String(this.city).trim().toLowerCase();
  }
  next();
});

// Pre-update hooks: normalize city on all update operations (bypasses pre-save)
function normalizeCityInUpdate(next) {
  const update = this.getUpdate();
  if (update && update.city != null) {
    update.city = String(update.city).trim().toLowerCase();
  }
  if (update && update.$set && update.$set.city != null) {
    update.$set.city = String(update.$set.city).trim().toLowerCase();
  }
  next();
}
restaurantSchema.pre('findOneAndUpdate', normalizeCityInUpdate);
restaurantSchema.pre('updateOne',        normalizeCityInUpdate);
restaurantSchema.pre('updateMany',       normalizeCityInUpdate);

module.exports = mongoose.model('Restaurant', restaurantSchema);
