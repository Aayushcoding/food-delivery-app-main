// controllers/deliveryController.js
// Using MongoDB with Mongoose ONLY

const DeliveryAgent = require('../models/DeliveryAgent');

// ── GET ALL DELIVERY AGENTS ────────────────────────────────────────────────────
// GET /api/delivery?isAvailable=true&search=nisha
const getDeliveryAgents = async (req, res) => {
  try {
    const { isAvailable, search } = req.query;

    let query = {};

    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    if (search) {
      query.$or = [
        { agentName: new RegExp(search, 'i') },
        { vehicleNo: new RegExp(search, 'i') },
        { contactNo: new RegExp(search, 'i') }
      ];
    }

    const agents = await DeliveryAgent.find(query);

    res.status(200).json({ success: true, total: agents.length, data: agents });
  } catch (error) {
    console.error('Error in getDeliveryAgents:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET SINGLE DELIVERY AGENT ──────────────────────────────────────────────────
// GET /api/delivery/:id
const getDeliveryAgent = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }
    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    console.error('Error in getDeliveryAgent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE DELIVERY AGENT ──────────────────────────────────────────────────────
// POST /api/delivery
const createDeliveryAgent = async (req, res) => {
  try {
    const { agentName, contactNo, vehicleNo, isAvailable } = req.body;

    if (!agentName) {
      return res.status(400).json({ success: false, message: 'agentName is required' });
    }

    const newAgent = new DeliveryAgent({
      agentName,
      contactNo: contactNo || '',
      vehicleNo: vehicleNo || '',
      isAvailable: isAvailable !== false
    });

    await newAgent.save();

    res.status(201).json({ success: true, data: newAgent });
  } catch (error) {
    console.error('Error in createDeliveryAgent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE DELIVERY AGENT ──────────────────────────────────────────────────────
// PUT /api/delivery/:id
const updateDeliveryAgent = async (req, res) => {
  try {
    const { agentName, contactNo, vehicleNo, isAvailable } = req.body;

    const updated = await DeliveryAgent.findByIdAndUpdate(
      req.params.id,
      { agentName, contactNo, vehicleNo, isAvailable },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error in updateDeliveryAgent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE DELIVERY AGENT ──────────────────────────────────────────────────────
// DELETE /api/delivery/:id
const deleteDeliveryAgent = async (req, res) => {
  try {
    const deleted = await DeliveryAgent.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }

    res.status(200).json({ success: true, message: 'Delivery agent deleted' });
  } catch (error) {
    console.error('Error in deleteDeliveryAgent:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDeliveryAgents, getDeliveryAgent, createDeliveryAgent, updateDeliveryAgent, deleteDeliveryAgent };
