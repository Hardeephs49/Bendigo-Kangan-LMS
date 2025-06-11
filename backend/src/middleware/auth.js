// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model to fetch user data

module.exports = async (req, res, next) => {
  try {
    // Log headers for debugging
    console.log('Auth Middleware: Headers:', req.headers);
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('Auth Middleware: No token found.');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Log decoded token for debugging
    console.log('Auth Middleware: Decoded Token:', decoded);

    // Extract userId from decoded token (support both userId and id fields)
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      console.log('Auth Middleware: Invalid token payload - no userId or id.');
      return res.status(401).json({ message: 'Invalid token payload: userId or id required' });
    }

    // Fetch user from database to ensure they exist
    const user = await User.findById(userId);
    // Log user for debugging
    console.log('Auth Middleware: User found from DB:', user ? { _id: user._id, role: user.role } : 'None');
    if (!user) {
      return res.status(401).json({ message: 'User not found, authorization denied' });
    }

    // Attach user data to req.user
    req.user = {
      id: user._id.toString(), // Add id for compatibility
      userId: user._id.toString(), // Keep userId for backward compatibility
      role: user.role,
      iat: decoded.iat,
      exp: decoded.exp
    };
    console.log('Auth Middleware: req.user attached:', req.user);

    // Validate role
    if (!req.user.role) {
      console.log('Auth Middleware: User role not found after attachment.');
      return res.status(401).json({ message: 'User role not found in token or database' });
    }

    next();
  } catch (error) {
    console.error('Auth Middleware: Authentication error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check user role
module.exports.checkRole = (roles) => {
  return (req, res, next) => {
    console.log('CheckRole Middleware: Checking role for user:', req.user?.role, 'against required roles:', roles);
    if (!req.user || !req.user.role) {
      console.log('CheckRole Middleware: User or user role missing.');
      return res.status(401).json({ message: 'User role not found in token' });
    }
    if (roles && roles.length > 0) {
      console.log('CheckRole Middleware: Checking role for user:', req.user.role, 'against required roles:', roles);
      if (!roles.includes(req.user.role)) {
        console.log('CheckRole Middleware: Role check failed for user:', req.user.role);
        return res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
      }
    }
    console.log('CheckRole Middleware: Role check passed.');
    next();
  };
};