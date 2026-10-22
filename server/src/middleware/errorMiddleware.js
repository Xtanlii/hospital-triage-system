const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, errors);
  }
}

class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden: insufficient permissions') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

class MLServiceUnavailableError extends AppError {
  constructor(message = 'ML Inference Service is currently unavailable') {
    super(message, 503);
  }
}

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Handle Prisma-specific database errors
  if (err.code === 'P2002') {
    statusCode = 409;
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target || 'field';
    message = `Duplicate value: A record with this ${target} already exists.`;
    errors = [{ field: target, message }];
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested record was not found in the database.';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Foreign key constraint failed. Related record does not exist.';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${message}`, {
      meta: {
        statusCode,
        stack: err.stack,
        ip: req.ip
      }
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${message}`, {
      meta: {
        statusCode,
        errors,
        ip: req.ip
      }
    });
  }

  // Consistent API error response
  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
}

// 404 handler
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    errors: []
  });
}

module.exports = {
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  MLServiceUnavailableError,
  errorHandler,
  notFoundHandler
};

