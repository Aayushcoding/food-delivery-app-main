// controllers/authController.js
const bcrypt = require('bcryptjs');
const User   = require('../models/User');
const { getNextSequence } = require('../utils/counter');

const PHONE_REGEX = /^\d{10}$/;

/** Generate a safe username from name + random suffix */
function makeUsername(name, id) {
  const base = (name || 'user').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  return `${base || 'user'}_${id}`;
}

// POST /api/auth/register/customer
const registerCustomer = async (req, res) => {
  try {
    const { name, email, password, phoneNo, addresses } = req.body;
    if (!name?.trim())     return res.status(400).json({ success: false, message: 'Full name is required' });
    if (!email?.trim())    return res.status(400).json({ success: false, message: 'Email is required' });
    if (!password)         return res.status(400).json({ success: false, message: 'Password is required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (!phoneNo?.trim())  return res.status(400).json({ success: false, message: 'Phone number is required' });
    if (!PHONE_REGEX.test(phoneNo.trim()))
      return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });

    const existing = await User.findOne({ email: email.toLowerCase().trim(), role: 'Customer' });
    if (existing) return res.status(400).json({ success: false, message: 'Customer account with this email already exists' });

    const phoneExists = await User.findOne({ phoneNo: phoneNo.trim(), role: 'Customer' });
    if (phoneExists) return res.status(400).json({ success: false, message: 'Customer account with this phone already exists' });

    // Normalize city in addresses
    const cleanAddresses = Array.isArray(addresses)
      ? addresses.map(a => ({ ...a, city: (a.city || '').toLowerCase().trim() }))
      : [];

    const newId = await getNextSequence('usr');
    const user = await new User({
      id:        newId,
      name:      name.trim(),
      username:  makeUsername(name, newId),
      email:     email.toLowerCase().trim(),
      password:  await bcrypt.hash(password, 10),
      phoneNo:   phoneNo.trim(),
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
    const { name, email, password, phoneNo } = req.body;
    if (!name?.trim())     return res.status(400).json({ success: false, message: 'Full name is required' });
    if (!email?.trim())    return res.status(400).json({ success: false, message: 'Email is required' });
    if (!password)         return res.status(400).json({ success: false, message: 'Password is required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (!phoneNo?.trim())  return res.status(400).json({ success: false, message: 'Phone number is required' });
    if (!PHONE_REGEX.test(phoneNo.trim()))
      return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });

    const existing = await User.findOne({ email: email.toLowerCase().trim(), role: 'Owner' });
    if (existing) return res.status(400).json({ success: false, message: 'Owner account with this email already exists' });

    const phoneExists = await User.findOne({ phoneNo: phoneNo.trim(), role: 'Owner' });
    if (phoneExists) return res.status(400).json({ success: false, message: 'Owner account with this phone already exists' });

    const newId = await getNextSequence('usr');
    const user = await new User({
      id:       newId,
      name:     name.trim(),
      username: makeUsername(name, newId),
      email:    email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 10),
      phoneNo:  phoneNo.trim(),
      role:     'Owner'
    }).save();

    const { password: _, ...safe } = user.toJSON();
    res.status(201).json({ success: true, message: 'Owner registered', data: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
// Accepts email OR 10-digit phone number — NO username login
const login = async (req, res) => {
  try {
    const { email: identifier, password, role } = req.body;
    if (!identifier?.trim()) return res.status(400).json({ success: false, message: 'Email or phone number is required' });
    if (!password)           return res.status(400).json({ success: false, message: 'Password is required' });
    if (!role)               return res.status(400).json({ success: false, message: 'Role is required' });

    const id = identifier.trim();
    let user = null;

    // 10-digit → phone login; anything with @ → email; else try email anyway
    if (PHONE_REGEX.test(id)) {
      user = await User.findOne({ phoneNo: id, role });
    } else {
      user = await User.findOne({ email: id.toLowerCase(), role });
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
    const { name, email, password, phoneNo, addresses } = req.body;
    if (!name?.trim())     return res.status(400).json({ success: false, message: 'Full name is required' });
    if (!email?.trim())    return res.status(400).json({ success: false, message: 'Email is required' });
    if (!password)         return res.status(400).json({ success: false, message: 'Password is required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    if (!phoneNo?.trim())  return res.status(400).json({ success: false, message: 'Phone number is required' });
    if (!PHONE_REGEX.test(phoneNo.trim()))
      return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits' });

    const existing = await User.findOne({ email: email.toLowerCase().trim(), role: 'DeliveryAgent' });
    if (existing) return res.status(400).json({ success: false, message: 'Delivery agent account with this email already exists' });

    const phoneExists = await User.findOne({ phoneNo: phoneNo.trim(), role: 'DeliveryAgent' });
    if (phoneExists) return res.status(400).json({ success: false, message: 'Delivery agent account with this phone already exists' });

    const cleanAddresses = Array.isArray(addresses)
      ? addresses.map(a => ({ ...a, city: (a.city || '').toLowerCase().trim() }))
      : [];

    const newId = await getNextSequence('usr');
    const user = await new User({
      id:        newId,
      name:      name.trim(),
      username:  makeUsername(name, newId),
      email:     email.toLowerCase().trim(),
      password:  await bcrypt.hash(password, 10),
      phoneNo:   phoneNo.trim(),
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