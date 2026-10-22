const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: (process.env.NODE_ENV || 'development').trim(),
  DATABASE_URL: (process.env.DATABASE_URL || '').trim(),
  JWT_SECRET: (process.env.JWT_SECRET || 'default_jwt_secret').trim(),
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '1d').trim(),
  ML_SERVICE_URL: (process.env.ML_SERVICE_URL || 'http://localhost:8000').trim(),
  ML_SERVICE_TIMEOUT_MS: parseInt(process.env.ML_SERVICE_TIMEOUT_MS, 10) || 5000,
  ENABLE_ML_OFFLINE_FALLBACK: process.env.ENABLE_ML_OFFLINE_FALLBACK !== 'false',
  REDIS_URL: (process.env.REDIS_URL || 'redis://localhost:6379').trim(),
  ENABLE_REDIS: process.env.ENABLE_REDIS === 'true',
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:5173').trim()
};

module.exports = env;
