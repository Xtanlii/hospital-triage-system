const { ForbiddenError } = require('./errorMiddleware');

/**
 * Middleware factory requiring one of the specified roles.
 * @param  {...string} allowedRoles 
 */
function requireRole(...allowedRoles) {
  const flattened = allowedRoles.flat().map((r) => r.toUpperCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ForbiddenError('User identity and role not found'));
    }

    const userRole = req.user.role.toUpperCase();
    if (!flattened.includes(userRole)) {
      return next(
        new ForbiddenError(
          `Access forbidden: requires role [${flattened.join(', ')}], but current role is ${userRole}`
        )
      );
    }

    next();
  };
}

module.exports = {
  requireRole
};

