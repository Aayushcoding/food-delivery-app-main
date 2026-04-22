// models/User.js
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street:   { type: String, default: '' },
  city:     { type: String, default: '', lowercase: true, trim: true },
  pincode:  { type: String, default: '' },
  landmark: { type: String, default: '' }
  // _id is enabled (Mongoose default) so each address has a unique id usable as addressId
});

const userSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, trim: true, unique: true, index: true },
  // email uniqueness is enforced per role via compound index below
  email: {
    type:      String,
    required:  true,
    lowercase: true,
    trim:      true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message:   'Invalid email format'
    }
  },
  phoneNo: {
    type:    String,
    default: '',
    validate: {
      validator: (v) => !v || v === '' || /^\d{10}$/.test(v),
      message:   'Phone number must be exactly 10 digits'
    }
  },
  password:  { type: String, required: true },
  addresses: { type: [addressSchema], default: [] },   // multiple saved addresses; each has an _id
  role:      { type: String, enum: ['Customer', 'Owner', 'DeliveryAgent', 'Admin'], default: 'Customer' },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, {
  versionKey: false,
  toJSON: {
    transform(doc, ret) {
      delete ret._id;
      return ret;
    }
  }
});

// Same email can exist for different roles
userSchema.index({ email: 1, role: 1 }, { unique: true });
// Username must be globally unique (used as login identifier)
userSchema.index({ username: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
