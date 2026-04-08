const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city:   { type: String, trim: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true // ✅ performance improvement
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },
    phoneNo: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?\d{10,15}$/, 'Phone number must be 10-15 digits']
    },
    password: {
      type: String,
      required: true,
      minlength: 6
      // TODO: Hash password using bcrypt before saving
    },
    address: {
      type: [addressSchema],
      default: []
    },
    role: {
      type: String,
      enum: ['Customer', 'Owner'], // ✅ removed Admin (to match backend/frontend)
      default: 'Customer'
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true // ✅ prevents accidental overwrite
    }
  },
  { versionKey: false }
);

module.exports = mongoose.model('User', userSchema);