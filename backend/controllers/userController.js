// controllers/userController.js
const bcrypt = require('bcryptjs');
const User   = require('../models/User');
const { getNextSequence } = require('../utils/counter');

const PHONE_REGEX = /^\d{10}$/;

// GET ALL USERS
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).lean();
    const safe  = users.map(u => { const o = { ...u }; delete o._id; delete o.password; return o; });
    res.json({ success: true, count: safe.length, data: safe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET SINGLE USER
const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { password, _id, ...safe } = user;
    res.json({ success: true, data: safe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE USER (admin / legacy endpoint)
const createUser = async (req, res) => {
  try {
    const { username, email, phoneNo, password, role, address } = req.body;

    if (!username || !username.trim()) return res.status(400).json({ success: false, message: 'username is required' });
    if (!email    || !email.trim())    return res.status(400).json({ success: false, message: 'email is required' });
    if (!password)                     return res.status(400).json({ success: false, message: 'password is required' });

    if (phoneNo && phoneNo.trim() && !PHONE_REGEX.test(phoneNo.trim())) {
      return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });
    }

    const assignedRole = role || 'Customer';
    const existing = await User.findOne({ email: email.toLowerCase().trim(), role: assignedRole }).lean();
    if (existing) return res.status(400).json({ success: false, message: 'An account with this email and role already exists' });

    const user = await new User({
      id:       await getNextSequence('usr'),
      username: username.trim(),
      email:    email.toLowerCase().trim(),
      phoneNo:  phoneNo ? phoneNo.trim() : '',
      password: await bcrypt.hash(password, 10),
      address:  address || [],
      role:     assignedRole
    }).save();

    const { password: _, ...safe } = user.toJSON();
    res.status(201).json({ success: true, data: safe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE USER
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'You can only update your own profile.' });
    }

    const updates = { ...req.body };
    delete updates.id;
    delete updates.role;
    delete updates.email;
    delete updates.password;

    if (updates.username !== undefined) {
      if (!updates.username || !updates.username.trim()) {
        return res.status(400).json({ success: false, message: 'Username cannot be empty.' });
      }
      updates.username = updates.username.trim();
    }

    if (updates.phoneNo !== undefined) {
      updates.phoneNo = String(updates.phoneNo).trim();
      if (updates.phoneNo && !PHONE_REGEX.test(updates.phoneNo)) {
        return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });
      }
    }

    const updated = await User.findOneAndUpdate({ id }, updates, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });

    const { password, _id, ...safe } = updated;
    res.json({ success: true, data: safe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE USER
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own account.' });
    }
    const user = await User.findOneAndDelete({ id });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };