/**
 * Redis cache utilities using ioredis
 * Provides server-side caching with TTL support
 */

import Redis from 'ioredis';

// Initialize Redis client singleton
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  // Return null if no Redis URL is configured (graceful degradation)
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not configured - caching will be disabled');
    return null;
  }

  // Create singleton instance
  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          // Exponential backoff: 50ms, 100ms, 200ms, etc.
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        // Disable offline queue to fail fast when Redis is unavailable
        enableOfflineQueue: false,
      });

      redis.on('error', (error) => {
        console.error('Redis connection error:', error);
      });

      redis.on('connect', () => {
        console.log('Redis connected successfully');
      });
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      return null;
    }
  }

  return redis;
}

export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Cache key prefix */
  prefix?: string;
}

/**
 * Default cache TTL values (in seconds)
 */
export const CACHE_TTL = {
  /** 5 minutes - for frequently changing data */
  SHORT: 60 * 5,
  /** 1 hour - for moderately stable data */
  MEDIUM: 60 * 60,
  /** 24 hours - for stable data */
  LONG: 60 * 60 * 24,
  /** 7 days - for very stable data */
  WEEK: 60 * 60 * 24 * 7,
} as const;

/**
 * Generate a cache key with optional prefix
 */
export function getCacheKey(key: string, prefix?: string): string {
  return prefix ? `${prefix}:${key}` : key;
}

/**
 * Get data from cache
 */
export async function getCache<T>(
  key: string,
  options?: CacheOptions
): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const cacheKey = getCacheKey(key, options?.prefix);
    const data = await client.get(cacheKey);

    if (!data) return null;

    return JSON.parse(data) as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set data in cache with TTL
 */
export async function setCache<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const cacheKey = getCacheKey(key, options?.prefix);
    const ttl = options?.ttl ?? CACHE_TTL.MEDIUM;
    const serialized = JSON.stringify(value);

    await client.setex(cacheKey, ttl, serialized);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete data from cache
 */
export async function deleteCache(
  key: string,
  options?: CacheOptions
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const cacheKey = getCacheKey(key, options?.prefix);
    await client.del(cacheKey);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    // Use SCAN instead of KEYS for better performance
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, foundKeys] = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error('Cache pattern delete error:', error);
  }
}

/**
 * Cached function wrapper
 * Caches the result of an async function
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key, options);

  if (cached !== null) {
    return cached;
  }

  // Execute function and cache result
  const result = await fn();
  await setCache(key, result, options);

  return result;
}

/**
 * Invalidate cache by pattern
 * Useful for invalidating related cache entries
 */
export async function invalidateCache(pattern: string): Promise<void> {
  await deleteCachePattern(pattern);
}

/**
 * Check if Redis is available
 */
export async function isCacheAvailable(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Close Redis connection (useful for cleanup in tests or shutdown)
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
