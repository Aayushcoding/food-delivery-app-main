// ========================================================================
// TEMPORARILY DISABLED FOR TESTING - Bypass all JWT authentication
// To re-enable: Replace this file with production-ready auth logic
// ========================================================================

const jwt = require('jsonwebtoken');

// BYPASS: auth middleware now allows all requests without token validation
const auth = (req, res, next) => {
  // TESTING MODE: Attach a dummy user to req.user so controllers work
  req.user = {
    id: 'test-user',
    role: 'Customer', // Default role for testing
  };
  
  // Allow all requests to proceed
  next();
};

// BYPASS: roleAuth middleware now allows all requests without role checking
const roleAuth = (roles) => {
  return (req, res, next) => {
    // TESTING MODE: Skip role validation, allow all requests
    next();
  };
};

module.exports = { auth, roleAuth };