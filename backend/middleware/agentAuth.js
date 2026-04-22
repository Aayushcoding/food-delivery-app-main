// middleware/agentAuth.js
// Authenticates delivery agents.
// Supports TWO identity stores:
//   1. DeliveryAgent collection (legacy seeded agents)
//   2. User collection with role = 'DeliveryAgent' (agents registered via /api/auth)
// Both use the same token format: "logged-in-<id>-<timestamp>"
const DeliveryAgent = require('../models/DeliveryAgent');
const User          = require('../models/User');

const parseIdFromToken = (token) => {
  if (!token || !token.startsWith('logged-in-')) return null;
  const withoutPrefix = token.slice('logged-in-'.length);
  const lastDash = withoutPrefix.lastIndexOf('-');
  if (lastDash === -1) return null;
  return withoutPrefix.substring(0, lastDash);
};

const agentAuth = async (req, res, next) => {
  const token = req.headers['authorization'] || req.headers['x-auth-token'];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token. Please log in as a delivery agent.' });
  }

  const id = parseIdFromToken(token);
  if (!id) {
    return res.status(401).json({ success: false, message: 'Invalid token format.' });
  }

  try {
    // ── Try DeliveryAgent collection first (legacy seeded agents) ──────────
    const daAgent = await DeliveryAgent.findOne({ id }).lean();
    if (daAgent) {
      req.agent = { id, name: daAgent.name, source: 'DeliveryAgent' };
      console.log(`[agentAuth] Authenticated DeliveryAgent: ${id}`);
      return next();
    }

    // ── Fall back to User collection (agents registered via /api/auth) ──────
    const user = await User.findOne({ id }).lean();
    if (user && (user.role === 'DeliveryAgent' || user.role === 'Delivery')) {
      req.agent = { id, name: user.username, source: 'User' };
      console.log(`[agentAuth] Authenticated User-role agent: ${id}`);
      return next();
    }

    return res.status(401).json({ success: false, message: 'Delivery agent not found. Ensure you are logged in with a DeliveryAgent account.' });
  } catch (err) {
    console.error('[agentAuth] Error:', err.message);
    res.status(500).json({ success: false, message: 'Agent auth error: ' + err.message });
  }
};

module.exports = { agentAuth };
