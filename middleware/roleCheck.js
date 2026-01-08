const { errorResponse } = require("../utils/response");

// Role check middleware as a named function
function roleCheck(allowedRoles = []) {
  return function(req, res, next) {
    if (!req.user || !req.user.role) {
      return res.status(401).json(errorResponse("Unauthorized: No user role found"));
    }

    // Check if user's role is in allowedRoles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(errorResponse("Forbidden: Insufficient permissions"));
    }

    next();
  };
}

module.exports = roleCheck;