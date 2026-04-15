const User = require('../models/User');

// Parse userId from token: "logged-in-<userId>-<timestamp>"
const parseUserIdFromToken = (token) => {
  if (!token || !token.startsWith('logged-in-')) return null;
  const withoutPrefix = token.slice('logged-in-'.length);
  const lastDash = withoutPrefix.lastIndexOf('-');
  if (lastDash === -1) return null;
  return withoutPrefix.substring(0, lastDash);
};

const auth = async (req, res, next) => {
  const token = req.headers['authorization'] || req.headers['x-auth-token'];
  if (!token) return res.status(401).json({ success: false, message: 'No token. Please log in.' });

  const userId = parseUserIdFromToken(token);
  if (!userId) return res.status(401).json({ success: false, message: 'Invalid token.' });

  try {
    const user = await User.findOne({ id: userId }).lean();
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    req.user = { id: userId, role: user.role };
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Auth error: ' + err.message });
  }
};

const roleAuth = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Access denied. Required role: ${roles.join(' or ')}` });
  }
  next();
};

module.exports = { auth, roleAuth };