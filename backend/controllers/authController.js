// controllers/authController.js
const bcrypt = require('bcryptjs');
const User   = require('../models/User');
const { getNextSequence } = require('../utils/counter');

const PHONE_REGEX = /^\d{10}$/;

// POST /api/auth/register/customer
const registerCustomer = async (req, res) => {
  try {
    const { username, email, password, phoneNo, addresses } = req.body;
    if (!username?.trim()) return res.status(400).json({ success: false, message: 'username is required' });
    if (!email?.trim())    return res.status(400).json({ success: false, message: 'email is required' });
    if (!password)         return res.status(400).json({ success: false, message: 'password is required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (!phoneNo?.trim())  return res.status(400).json({ success: false, message: 'Phone number is required' });
    if (!PHONE_REGEX.test(phoneNo.trim()))
      return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });

    const existing = await User.findOne({ email: email.toLowerCase().trim(), role: 'Customer' });
    if (existing) return res.status(400).json({ success: false, message: 'Customer account with this email already exists' });

    const takenUsername = await User.findOne({ username: username.trim() });
    if (takenUsername) return res.status(400).json({ success: false, message: 'Username already taken — please choose another' });

    // Normalize city in addresses
    const cleanAddresses = Array.isArray(addresses)
      ? addresses.map(a => ({ ...a, city: (a.city || '').toLowerCase().trim() }))
      : [];

    const user = await new User({
      id:        await getNextSequence('usr'),
      username:  username.trim(),
      email:     email.toLowerCase().trim(),
      password:  await bcrypt.hash(password, 10),
      phoneNo:   phoneNo?.trim() || '',
      role:      'Customer',
      addresses: cleanAddresses
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
    if (!phoneNo?.trim())  return res.status(400).json({ success: false, message: 'Phone number is required' });
    if (!PHONE_REGEX.test(phoneNo.trim()))
      return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });

    const existing = await User.findOne({ email: email.toLowerCase().trim(), role: 'Owner' });
    if (existing) return res.status(400).json({ success: false, message: 'Owner account with this email already exists' });

    const takenUsername = await User.findOne({ username: username.trim() });
    if (takenUsername) return res.status(400).json({ success: false, message: 'Username already taken — please choose another' });

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
    const { email: identifier, password, role } = req.body;
    if (!identifier?.trim()) return res.status(400).json({ success: false, message: 'Email or username is required' });
    if (!password)           return res.status(400).json({ success: false, message: 'Password is required' });
    if (!role)               return res.status(400).json({ success: false, message: 'Role is required' });

    const id = identifier.trim();

    // Try email first; if no '@' treat as username
    let user = null;
    if (id.includes('@')) {
      user = await User.findOne({ email: id.toLowerCase(), role });
    } else {
      user = await User.findOne({ username: id, role });
      // fallback: maybe they typed email without @?
      if (!user) user = await User.findOne({ email: id.toLowerCase(), role });
    }

    if (!user) return res.status(401).json({ success: false, message: `No ${role} account found with these credentials` });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = `logged-in-${user.id}-${Date.now()}`;
    const { password: _, ...safe } = user.toJSON();
    res.json({ success: true, message: 'Login successful', data: safe, token, role: user.role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/register/delivery
const registerDeliveryAgent = async (req, res) => {
  try {
    const { username, email, password, phoneNo, addresses } = req.body;
    if (!username?.trim()) return res.status(400).json({ success: false, message: 'username is required' });
    if (!email?.trim())    return res.status(400).json({ success: false, message: 'email is required' });
    if (!password)         return res.status(400).json({ success: false, message: 'password is required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (!phoneNo?.trim())  return res.status(400).json({ success: false, message: 'Phone number is required' });
    if (!PHONE_REGEX.test(phoneNo.trim()))
      return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });

    const existing = await User.findOne({ email: email.toLowerCase().trim(), role: 'DeliveryAgent' });
    if (existing) return res.status(400).json({ success: false, message: 'Delivery agent account with this email already exists' });

    const takenUsername = await User.findOne({ username: username.trim() });
    if (takenUsername) return res.status(400).json({ success: false, message: 'Username already taken — please choose another' });

    // Normalize city in addresses
    const cleanAddresses = Array.isArray(addresses)
      ? addresses.map(a => ({ ...a, city: (a.city || '').toLowerCase().trim() }))
      : [];

    const user = await new User({
      id:        await getNextSequence('usr'),
      username:  username.trim(),
      email:     email.toLowerCase().trim(),
      password:  await bcrypt.hash(password, 10),
      phoneNo:   phoneNo?.trim() || '',
      role:      'DeliveryAgent',
      addresses: cleanAddresses
    }).save();

    const { password: _, ...safe } = user.toJSON();
    res.status(201).json({ success: true, message: 'Delivery agent registered', data: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { registerCustomer, registerOwner, registerDeliveryAgent, login };