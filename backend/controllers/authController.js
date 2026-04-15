// controllers/authController.js
const bcrypt = require('bcryptjs');
const User   = require('../models/User');
const { getNextSequence } = require('../utils/counter');

const PHONE_REGEX = /^\d{10}$/;

// POST /api/auth/register/customer
const registerCustomer = async (req, res) => {
  try {
    const { username, email, password, phoneNo } = req.body;
    if (!username?.trim()) return res.status(400).json({ success: false, message: 'username is required' });
    if (!email?.trim())    return res.status(400).json({ success: false, message: 'email is required' });
    if (!password)         return res.status(400).json({ success: false, message: 'password is required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (phoneNo?.trim() && !PHONE_REGEX.test(phoneNo.trim()))
      return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });

    const existing = await User.findOne({ email: email.toLowerCase().trim(), role: 'Customer' });
    if (existing) return res.status(400).json({ success: false, message: 'Customer account with this email already exists' });

    const user = await new User({
      id:       await getNextSequence('usr'),
      username: username.trim(),
      email:    email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 10),
      phoneNo:  phoneNo?.trim() || '',
      role:     'Customer'
    }).save();

    const { password: _, ...safe } = user.toJSON();
    res.status(201).json({ success: true, message: 'Customer registered', data: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/register/owner
const registerOwner = async (req, res) => {
  try {
    const { username, email, password, phoneNo } = req.body;
    if (!username?.trim()) return res.status(400).json({ success: false, message: 'username is required' });
    if (!email?.trim())    return res.status(400).json({ success: false, message: 'email is required' });
    if (!password)         return res.status(400).json({ success: false, message: 'password is required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (phoneNo?.trim() && !PHONE_REGEX.test(phoneNo.trim()))
      return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });

    const existing = await User.findOne({ email: email.toLowerCase().trim(), role: 'Owner' });
    if (existing) return res.status(400).json({ success: false, message: 'Owner account with this email already exists' });

    const user = await new User({
      id:       await getNextSequence('usr'),
      username: username.trim(),
      email:    email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 10),
      phoneNo:  phoneNo?.trim() || '',
      role:     'Owner'
    }).save();

    const { password: _, ...safe } = user.toJSON();
    res.status(201).json({ success: true, message: 'Owner registered', data: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email?.trim()) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!password)      return res.status(400).json({ success: false, message: 'Password is required' });
    if (!role)          return res.status(400).json({ success: false, message: 'Role is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim(), role });
    if (!user) return res.status(401).json({ success: false, message: `No ${role} account found with this email` });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = `logged-in-${user.id}-${Date.now()}`;
    const { password: _, ...safe } = user.toJSON();
    res.json({ success: true, message: 'Login successful', data: safe, token, role: user.role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { registerCustomer, registerOwner, login };