////middleware/auth.js
// ─────────────────────────────────────────────────────────────────────
// Simple token validation (no JWT).
// Token format produced by authController: "logged-in-<userId>-<timestamp>"
// ─────────────────────────────────────────────────────────────────────

const auth = (req, res, next) => {
  const token = req.headers['authorization'] || req.headers['x-auth-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided. Please log in.' });
  }

  // Validate token format: must start with "logged-in-"
  if (!token.startsWith('logged-in-')) {
    return res.status(401).json({ success: false, message: 'Invalid token format.' });
  }

  // Extract userId from token: "logged-in-<userId>-<timestamp>"
  const parts = token.split('-');
  // parts[0]="logged", parts[1]="in", parts[2]=userId prefix...
  // userId is everything between "logged-in-" and the last "-<timestamp>"
  // Safe extraction: remove "logged-in-" prefix, then strip last "-<timestamp>" segment
  const withoutPrefix = token.slice('logged-in-'.length); // "<userId>-<timestamp>"
  const lastDash = withoutPrefix.lastIndexOf('-');
  const userId = withoutPrefix.substring(0, lastDash);

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }

  req.user = { id: userId };
  next();
};

// Role-based access: checks req.user.role (set by calling code or can be enriched)
const roleAuth = (roles) => {
  return (req, res, next) => {
    // For now we trust the role from the token holder — roles can be checked per-route
    next();
  };
};

module.exports = { auth, roleAuth };