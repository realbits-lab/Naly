/**
 * Redis cache utilities using Vercel KV
 * Provides server-side caching with TTL support
 */

import { kv } from '@vercel/kv';

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
  try {
    const cacheKey = getCacheKey(key, options?.prefix);
    const data = await kv.get<T>(cacheKey);
    return data;
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
  try {
    const cacheKey = getCacheKey(key, options?.prefix);
    const ttl = options?.ttl ?? CACHE_TTL.MEDIUM;

    await kv.set(cacheKey, value, {
      ex: ttl, // Expiration in seconds
    });
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
  try {
    const cacheKey = getCacheKey(key, options?.prefix);
    await kv.del(cacheKey);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await kv.keys(pattern);
    if (keys.length > 0) {
      await kv.del(...keys);
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
 * Check if Redis/KV is available
 */
export async function isCacheAvailable(): Promise<boolean> {
  try {
    await kv.ping();
    return true;
  } catch {
    return false;
  }
}
