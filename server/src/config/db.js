const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const env = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: env.DATABASE_URL
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' }
  ]
});

prisma.$on('error', (e) => {
  logger.error('Database query error', { meta: { message: e.message } });
});

/**
 * Verifies PostgreSQL database connection.
 */
async function testConnection() {
  try {
    await pool.query('SELECT 1');
    logger.info('Connected successfully to PostgreSQL database pool');
    return true;
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL database pool', { meta: { error: error.message } });
    return false;
  }
}

module.exports = prisma;
module.exports.pool = pool;
module.exports.testConnection = testConnection;

