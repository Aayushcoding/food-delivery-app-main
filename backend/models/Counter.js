// models/Counter.js
// Atomic counter collection for sequential ID generation.
// Uses MongoDB's findOneAndUpdate + $inc to guarantee no duplicates.
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id:  { type: String, required: true }, // e.g. "usr", "rest", "menu"
  seq:  { type: Number, default: 0 }
}, { versionKey: false });

module.exports = mongoose.model('Counter', counterSchema);
