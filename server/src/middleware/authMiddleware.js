const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AuthError } = require('./errorMiddleware');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthError('Authentication token is missing or malformed'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      userId: decoded.userId || decoded.user_id,
      username: decoded.username,
      role: decoded.role,
      department: decoded.department || null,
      isOnDuty: decoded.isOnDuty ?? false
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AuthError('Authentication token has expired. Please log in again.'));
    }
    return next(new AuthError('Invalid authentication token'));
  }
}

module.exports = {
  authenticateToken
};

