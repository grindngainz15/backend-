const jwt = require("jsonwebtoken");
const { errorResponse } = require("../utils/response");

// Auth middleware as a named function
function auth(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json(errorResponse("Access denied. No token provided."));
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = decoded; // contains userId and role
    next();
  } catch (err) {
    return res.status(400).json(errorResponse("Invalid token."));
  }
}

module.exports = auth;