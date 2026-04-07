const DeliveryAgent = require('../models/DeliveryAgent');

// Get all delivery agents
const getDeliveryAgents = async (req, res) => {
  try {
    const agents = await DeliveryAgent.find();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single delivery agent
const getDeliveryAgent = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findOne({ id: req.params.id });
    if (!agent) return res.status(404).json({ message: 'Delivery agent not found' });
    res.json(agent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create delivery agent
const createDeliveryAgent = async (req, res) => {
  const agent = new DeliveryAgent(req.body);
  try {
    const newAgent = await agent.save();
    res.status(201).json(newAgent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update delivery agent
const updateDeliveryAgent = async (req, res) => {
  try {
    const updatedAgent = await DeliveryAgent.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!updatedAgent) return res.status(404).json({ message: 'Delivery agent not found' });
    res.json(updatedAgent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete delivery agent
const deleteDeliveryAgent = async (req, res) => {
  try {
    const agent = await DeliveryAgent.findOneAndDelete({ id: req.params.id });
    if (!agent) return res.status(404).json({ message: 'Delivery agent not found' });
    res.json({ message: 'Delivery agent deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDeliveryAgents,
  getDeliveryAgent,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent
};