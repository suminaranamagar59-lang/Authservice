// middleware/auth.js
// JWT middleware to protect routes that require login

const jwt = require("jsonwebtoken");

/**
 * Middleware: verifyToken
 * Checks if a valid JWT token is present in the Authorization header or cookie.
 * If valid, attaches the decoded user info to req.user and calls next().
 * If invalid or missing, responds with 401 Unauthorized.
 */
const verifyToken = (req, res, next) => {
  // Token can come from Authorization header: "Bearer <token>"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded payload { userId, email } to request
    next();
  } catch (err) {
    // Token is expired or tampered with
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
};

module.exports = { verifyToken };
