//userController.js
const bcrypt = require('bcryptjs');
const db = require('../utils/dbManager');

// ================= GET ALL USERS =================
const getUsers = async(req, res) => {
  try {
    const users = db.getAllUsers();
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET SINGLE USER =================
const getUser = async(req, res) => {
  try {
    const user = db.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const userObj = { ...user };
    delete userObj.password;
    res.json({ success: true, data: userObj });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= CREATE USER =================
const createUser = async(req, res) => {
  try {
    const { username, email, phoneNo, password, role, address } = req.body;

    if (!username || !email || !phoneNo || !password) {
      return res.status(400).json({ success: false, message: 'username, email, phoneNo and password are required' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = db.createUser({
      username,
      email: email.toLowerCase(),
      phoneNo,
      password: hashedPassword,
      address: address || [],
      role: role || 'Customer'
    });

    const userObj = { ...user };
    delete userObj.password;

    res.status(201).json({ success: true, data: userObj });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= UPDATE USER =================
const updateUser = async(req, res) => {
  try {
    let updates = { ...req.body };
    delete updates.id;   // prevent ID mutation
    delete updates.role; // prevent role escalation via this endpoint

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updated = db.updateUser(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userObj = { ...updated };
    delete userObj.password;

    res.json({ success: true, data: userObj });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= DELETE USER =================
const deleteUser = async(req, res) => {
  try {
    const user = db.deleteUser(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted' });
  } catch(error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};