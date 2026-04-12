////authController.js
const bcrypt = require('bcryptjs');
const db = require('../utils/dbManager');

// ================= REGISTER CUSTOMER =================
const registerCustomer = async(req, res) => {
  try {
    const { username, email, password, phoneNo } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "username, email, and password are required" });
    }

    // Check if email already exists
    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = db.createUser({
      username,
      email: email.toLowerCase(),
      password: hashed,
      phoneNo,
      role: "Customer"
    });

    const userObj = { ...user };
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: userObj
    });

  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= REGISTER OWNER =================
const registerOwner = async(req, res) => {
  try {
    const { username, email, password, phoneNo, restaurantName, restaurantAddress, gstinNo } = req.body;

    if (!username || !email || !password || !restaurantName) {
      return res.status(400).json({ success: false, message: "username, email, password, and restaurantName are required" });
    }

    // Check if email already exists
    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = db.createUser({
      username,
      email: email.toLowerCase(),
      password: hashed,
      phoneNo,
      role: "Owner"
    });

    // Create restaurant for owner
    const restaurant = db.createRestaurant({
      ownerId: user.id,
      restaurantName,
      address: restaurantAddress,
      restaurantContactNo: phoneNo,
      email: user.email,
      gstinNo
    });

    const userObj = { ...user };
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: "Owner registered successfully",
      data: {
        user: userObj,
        restaurant
      }
    });

  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= LOGIN =================
const login = async(req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (email.trim().length === 0 || password.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Email and password cannot be empty" });
    }

    // Find user by email
    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Generate simple token (can be extended to JWT)
    const token = `logged-in-${user.id}-${Date.now()}`;

    // Return user without password
    const userObj = { ...user };
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: userObj,
      token: token
    });

  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { registerCustomer, registerOwner, login };