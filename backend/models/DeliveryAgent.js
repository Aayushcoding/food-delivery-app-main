// models/DeliveryAgent.js
// Exact fields: id, agentName, contactNo, isAvailable, vehicleNo
// id is STRING — DO NOT use ObjectId

const mongoose = require('mongoose');

const deliveryAgentSchema = new mongoose.Schema(
  {
    id:          { type: String, required: true, unique: true, trim: true },
    agentName:   { type: String, required: true, trim: true },
    contactNo:   { type: String, required: true, trim: true, match: [/^\+?\d{10,15}$/, 'Phone number must be 10-15 digits, optionally starting with +'] },
    isAvailable: { type: Boolean, default: true },
    vehicleNo:   { type: String, required: true, trim: true }
  },
  { versionKey: false }
);

module.exports = mongoose.model('DeliveryAgent', deliveryAgentSchema);
