//deliveryController.js
const db = require('../utils/dbManager');

// ── GET ALL DELIVERY AGENTS ────────────────────────────────────────────────────
// GET /api/delivery?search=name
const getDeliveryAgents = async(req, res) => {
  try {
    const { search } = req.query;
    let agents = db.getAllDeliveryAgents();
    
    if (search) {
      agents = agents.filter(a => 
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.phone.includes(search)
      );
    }
    
    res.json({ success: true, data: agents });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET SINGLE DELIVERY AGENT ──────────────────────────────────────────────────
// GET /api/delivery/:id
const getDeliveryAgent = async(req, res) => {
  try {
    const agent = db.getDeliveryAgent(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }
    res.json({ success: true, data: agent });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE DELIVERY AGENT ──────────────────────────────────────────────────────
// POST /api/delivery
const createDeliveryAgent = async(req, res) => {
  try {
    const { name, phone, status } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'name and phone are required' 
      });
    }

    const agent = db.createDeliveryAgent({
      name,
      phone,
      status: status || 'available'
    });

    res.status(201).json({ success: true, data: agent });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE DELIVERY AGENT ──────────────────────────────────────────────────────
// PUT /api/delivery/:id
const updateDeliveryAgent = async(req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.id;

    const updated = db.updateDeliveryAgent(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }

    res.json({ success: true, data: updated });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE DELIVERY AGENT ──────────────────────────────────────────────────────
// DELETE /api/delivery/:id
const deleteDeliveryAgent = async(req, res) => {
  try {
    const agent = db.deleteDeliveryAgent(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Delivery agent not found' });
    }
    res.json({ success: true, message: 'Delivery agent deleted' });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDeliveryAgents,
  getDeliveryAgent,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent
};