// controllers/deliveryAgentController.js
// Fields: id, agentName, contactNo, isAvailable, vehicleNo
// String query: DeliveryAgent.findOne({ id: value }) — NO findById(), NO populate()

const DeliveryAgent = require('../models/DeliveryAgent');

// ── GET ALL DELIVERY AGENTS ────────────────────────────────────────────────────
// GET /api/agents?isAvailable=true&search=nisha&page=1&limit=10
const getDeliveryAgents = async (req, res) => {
  try {
    const { isAvailable, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
    if (search) {
      filter.$or = [
        { agentName: { $regex: search, $options: 'i' } },
        { vehicleNo: { $regex: search, $options: 'i' } }
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await DeliveryAgent.countDocuments(filter);
    const agents = await DeliveryAgent.find(filter)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), data: agents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET SINGLE DELIVERY AGENT ──────────────────────────────────────────────────
// GET /api/agents/:id   (id = "agent_001")
const getDeliveryAgent = async (req, res) => {
  try {
    // String-based query — DO NOT use findById()
    const agent = await DeliveryAgent.findOne({ id: req.params.id });
    if (!agent) return res.status(404).json({ message: 'Delivery agent not found' });
    res.json(agent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── CREATE DELIVERY AGENT ──────────────────────────────────────────────────────
// POST /api/agents
const createDeliveryAgent = async (req, res) => {
  try {
    const { id, agentName, contactNo, vehicleNo } = req.body;

    if (!id || !agentName || !contactNo || !vehicleNo) {
      return res.status(400).json({ message: 'id, agentName, contactNo and vehicleNo are required' });
    }

    const existing = await DeliveryAgent.findOne({ id });
    if (existing) return res.status(409).json({ message: `Agent '${id}' already exists` });

    const agent = new DeliveryAgent(req.body);
    const saved = await agent.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── UPDATE DELIVERY AGENT ──────────────────────────────────────────────────────
// PUT /api/agents/:id
const updateDeliveryAgent = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.id; // prevent id override

    const updated = await DeliveryAgent.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Delivery agent not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── DELETE DELIVERY AGENT ──────────────────────────────────────────────────────
// DELETE /api/agents/:id
const deleteDeliveryAgent = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findOneAndDelete({ id: req.params.id });
    if (!agent) return res.status(404).json({ message: 'Delivery agent not found' });
    res.json({ success: true, message: 'Delivery agent deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDeliveryAgents, getDeliveryAgent, createDeliveryAgent, updateDeliveryAgent, deleteDeliveryAgent };
