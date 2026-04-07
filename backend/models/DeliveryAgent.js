const mongoose = require('mongoose');

const deliveryAgentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  agentName: {
    type: String,
    required: true
  },
  contactNo: String,
  isAvailable: {
    type: Boolean,
    default: true
  },
  vehicleNo: String
});

module.exports = mongoose.model('DeliveryAgent', deliveryAgentSchema);