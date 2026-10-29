/**
 * ============================================================================
 * Unified Hospital Caching Service (Redis Primary with In-Memory TTL Fallback)
 * ============================================================================
 * 
 * Architecture:
 * - High-throughput distributed caching using Redis when connected.
 * - Automatic, zero-configuration local in-memory Map fallback with periodic TTL sweeping.
 * - Pattern-based batch invalidation (e.g. `delPattern('queue:*')`) for immediate data sync.
 * - Transparent error handling: Redis downtime never crashes hospital REST requests.
 */

const { getRedisClient, isRedisConnected } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Local in-memory key-value store used whenever Redis is unavailable or disconnected.
 * Format: Map<string, { value: any, expiresAt: number | null }>
 */
const inMemoryStore = new Map();

/**
 * Background Garbage Collector:
 * Periodically sweeps the in-memory fallback store every 30 seconds to evict expired keys.
 * Uses .unref() so the interval does not prevent Node.js process termination during tests/shutdown.
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
 * Retrieves a cached value by key.
 * Attempts Redis first; if Redis is disconnected or errors, seamlessly falls back to the in-memory Map.
 * 
 * @param {string} key - Cache key identifier.
 * @returns {Promise<any|null>} Deserialized cached object, or null if miss/expired.
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

  // Check TTL expiration
  if (item.expiresAt && item.expiresAt <= Date.now()) {
    inMemoryStore.delete(key);
    return null;
  }

  return item.value;
}

/**
 * Stores a value in the cache with a specified time-to-live (TTL).
 * Attempts Redis first; if unavailable, stores in local in-memory Map with future expiration timestamp.
 * 
 * @param {string} key - Cache key identifier.
 * @param {any} value - Serializable data to cache.
 * @param {number} [ttlSeconds=60] - Expiration duration in seconds (defaults to 60s).
 * @returns {Promise<boolean>} True if set successfully.
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
 * Evicts a specific key from both Redis and local in-memory cache.
 * 
 * @param {string} key - Cache key to remove.
 * @returns {Promise<boolean>} True if removal completed.
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
 * Evicts all keys matching a wildcard pattern (e.g. `queue:*` or `admin:*`).
 * Essential when queue positions change or new triage assessments are saved.
 * 
 * @param {string} pattern - Wildcard pattern containing '*' (e.g. 'queue:*').
 * @returns {Promise<boolean>} True if pattern matching keys were cleared.
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

  // Clear matching keys in local in-memory fallback
  const regex = new RegExp(`^${pattern.replace('*', '.*')}`);
  for (const key of inMemoryStore.keys()) {
    if (regex.test(key)) {
      inMemoryStore.delete(key);
    }
  }

  return true;
}

/**
 * Flushes all cached entries across all namespaces.
 * 
 * @returns {Promise<boolean>} True upon completion.
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
 * Returns diagnostic telemetry about the active cache engine and key counts.
 * 
 * @returns {{provider: string, isRedisConnected: boolean, inMemoryKeysCount: number}}
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
