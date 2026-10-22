const winston = require('winston');
const env = require('../config/env');

// Sensitive keys to scrub from logs
const SENSITIVE_KEYS = [
  'password',
  'password_hash',
  'passwordHash',
  'token',
  'authorization',
  'jwt_secret',
  'secret'
];

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitize(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

const sanitizeFormat = winston.format((info) => {
  if (info.meta && typeof info.meta === 'object') {
    info.meta = sanitize(info.meta);
  }
  return info;
});

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    sanitizeFormat(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'patient-triage-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        sanitizeFormat(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] [${level}]: ${message}${metaStr}`;
        })
      )
    })
  ]
});

module.exports = logger;

