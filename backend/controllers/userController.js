// controllers/userController.js
// Fields: id, username, email, phoneNo, password, address[{street,city}], role, createdAt
// String query: User.findOne({ id: value }) — NO findById(), NO populate()

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User   = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { isValidEmail, isValidPhone, validateRequiredFields } = require('../utils/validators');

// ── GET ALL USERS ──────────────────────────────────────────────────────────────
// GET /api/users?role=Customer&search=amit&page=1&limit=10
const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (role)   filter.role = role;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } }
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), data: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET SINGLE USER ────────────────────────────────────────────────────────────
// GET /api/users/:id  (id = "usr_001")
const getUser = async (req, res) => {
  try {
    // String-based query — DO NOT use findById()
    const user = await User.findOne({ id: req.params.id }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── REGISTER / CREATE USER ─────────────────────────────────────────────────────
// POST /api/users/register
// Body: { id?, username, email, phoneNo, password, role, address[{street,city}] }
const createUser = async (req, res) => {
  try {
    const { id, username, email, phoneNo, password, role, address } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, ['username', 'email', 'phoneNo', 'password']);
    if (!validation.isValid) {
      return errorResponse(res, validation.errors, 400);
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return errorResponse(res, 'Invalid email format', 400);
    }

    // Validate phone number
    if (!isValidPhone(phoneNo)) {
      return errorResponse(res, 'Phone number must be 10-15 digits', 400);
    }

    // Duplicate email check
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      id:       id || `usr_${uuidv4().slice(0, 8)}`,
      username,
      email,
      phoneNo,
      password: hashedPassword,
      address:  address || [],
      role:     role || 'Customer'
    });

    const saved = await user.save();
    const result = saved.toObject();
    delete result.password;

    // TODO: Generate JWT token here for future auth implementation
    // const token = jwt.sign(
    //   { userId: saved.id, role: saved.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: '24h' }
    // );

    successResponse(res, result, 'User registered successfully', 201);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── LOGIN USER ─────────────────────────────────────────────────────────────────
// POST /api/users/login
// Body: { email, password, role }
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    // Find user by email — string query
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Optional role check — only enforce if role is provided in body
    if (role && user.role !== role) {
      return res.status(403).json({ message: `Access denied. This account has role: ${user.role}` });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // TODO: Generate JWT token here for future auth implementation
    // const token = jwt.sign(
    //   { id: user.id, role: user.role },
    //   process.env.JWT_SECRET || 'fooddelivery_secret',
    //   { expiresIn: '24h' }
    // );

    res.json({
      success: true,
      // token,
      user: {
        id:       user.id,
        username: user.username,
        email:    user.email,
        role:     user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── UPDATE USER ────────────────────────────────────────────────────────────────
// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Never allow id override
    delete updates.id;

    // Hash new password if provided
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updated = await User.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ── DELETE USER ────────────────────────────────────────────────────────────────
// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, getUser, createUser, loginUser, updateUser, deleteUser };
