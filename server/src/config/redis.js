/**
 * Redis Client Configuration & Connection Manager
 * 
 * Provides resilient connection handling:
 * - Attempts connection to Redis instance at REDIS_URL.
 * - Handles offline / network disconnection gracefully with auto-reconnect.
 * - Emits status events so cacheService can dynamically failover.
 */

const env = require('./env');
const logger = require('../utils/logger');

let redisClient = null;
let isConnected = false;

function initRedisClient() {
  if (!env.ENABLE_REDIS) {
    logger.info('Redis caching is disabled by configuration (ENABLE_REDIS=false). Using In-Memory cache engine.');
    return null;
  }

  try {
    let redisPackage;
    try {
      redisPackage = require('redis');
    } catch (e) {
      logger.warn('Redis package not found in node_modules. Using In-Memory cache engine.');
      return null;
    }

    const client = redisPackage.createClient({
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.warn('Redis reconnect limit exceeded. Retrying in 10s.');
            return 10000;
          }
          return Math.min(retries * 500, 3000);
        },
        connectTimeout: 4000
      }
    });

    client.on('connect', () => {
      isConnected = true;
      logger.info(`Connected to Redis at ${env.REDIS_URL}`);
    });

    client.on('ready', () => {
      isConnected = true;
      logger.info('Redis client is ready to accept commands');
    });

    client.on('error', (err) => {
      isConnected = false;
      logger.warn(`Redis connection warning: ${err.message}. Operating in fallback mode.`);
    });

    client.on('end', () => {
      isConnected = false;
      logger.info('Redis connection closed.');
    });

    // Asynchronously initiate connection
    client.connect().catch((err) => {
      isConnected = false;
      logger.warn(`Initial Redis connection failed: ${err.message}. Fallback in-memory cache active.`);
    });

    redisClient = client;
    return client;
  } catch (err) {
    logger.warn(`Failed to initialize Redis client: ${err.message}. Fallback in-memory cache active.`);
    return null;
  }
}

// Initialize on module load
initRedisClient();

module.exports = {
  getRedisClient: () => redisClient,
  isRedisConnected: () => isConnected && redisClient !== null
};
