/**
 * Unified Hospital Caching Service
 * 
 * Supports:
 * - Redis client caching when available
 * - High-speed In-Memory TTL Fallback Cache when Redis or network is down
 * - Cache pattern clearing (e.g., invalidate all queue:* on new triage)
 */

const { getRedisClient, isRedisConnected } = require('../config/redis');
const logger = require('../utils/logger');

// Local in-memory cache fallback store
const inMemoryStore = new Map();

/**
 * Clean expired keys from in-memory cache periodically.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of inMemoryStore.entries()) {
    if (item.expiresAt && item.expiresAt <= now) {
      inMemoryStore.delete(key);
    }
  }
}, 30000).unref();

/**
 * Get value from cache.
 * @param {string} key 
 * @returns {Promise<any|null>}
 */
async function get(key) {
  try {
    if (isRedisConnected()) {
      const client = getRedisClient();
      const raw = await client.get(key);
      if (raw) {
        return JSON.parse(raw);
      }
      return null;
    }
  } catch (err) {
    logger.warn(`Redis GET failed for key '${key}': ${err.message}. Checking in-memory cache.`);
  }

  // Fallback to in-memory cache
  const item = inMemoryStore.get(key);
  if (!item) return null;

  if (item.expiresAt && item.expiresAt <= Date.now()) {
    inMemoryStore.delete(key);
    return null;
  }

  return item.value;
}

/**
 * Set value in cache with TTL.
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 
 */
async function set(key, value, ttlSeconds = 60) {
  try {
    if (isRedisConnected()) {
      const client = getRedisClient();
      await client.set(key, JSON.stringify(value), {
        EX: ttlSeconds
      });
      return true;
    }
  } catch (err) {
    logger.warn(`Redis SET failed for key '${key}': ${err.message}. Storing in-memory.`);
  }

  // In-memory fallback
  inMemoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });

  return true;
}

/**
 * Delete specific key from cache.
 * @param {string} key 
 */
async function del(key) {
  try {
    if (isRedisConnected()) {
      const client = getRedisClient();
      await client.del(key);
    }
  } catch (err) {
    logger.warn(`Redis DEL failed for key '${key}': ${err.message}`);
  }

  inMemoryStore.delete(key);
  return true;
}

/**
 * Delete all keys matching a prefix or pattern (e.g. 'queue:*').
 * @param {string} pattern 
 */
async function delPattern(pattern) {
  try {
    if (isRedisConnected()) {
      const client = getRedisClient();
      const keys = await client.keys(pattern);
      if (keys && keys.length > 0) {
        await client.del(keys);
      }
    }
  } catch (err) {
    logger.warn(`Redis DEL keys pattern failed for '${pattern}': ${err.message}`);
  }

  // Clear matching keys in-memory
  const regex = new RegExp(`^${pattern.replace('*', '.*')}`);
  for (const key of inMemoryStore.keys()) {
    if (regex.test(key)) {
      inMemoryStore.delete(key);
    }
  }

  return true;
}

/**
 * Flushes all cached data.
 */
async function flush() {
  try {
    if (isRedisConnected()) {
      const client = getRedisClient();
      await client.flushDb();
    }
  } catch (err) {
    logger.warn(`Redis FLUSHDB failed: ${err.message}`);
  }

  inMemoryStore.clear();
  return true;
}

/**
 * Returns cache diagnostics and active storage type.
 */
function getStatus() {
  const connected = isRedisConnected();
  return {
    provider: connected ? 'redis' : 'in-memory',
    isRedisConnected: connected,
    inMemoryKeysCount: inMemoryStore.size
  };
}

module.exports = {
  get,
  set,
  del,
  delPattern,
  flush,
  getStatus
};
