/**
 * Local Storage cache utilities for client-side caching
 * Provides persistent client-side caching with TTL support
 */

export interface LocalCacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Cache key prefix */
  prefix?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Default local cache TTL values (in milliseconds)
 */
export const LOCAL_CACHE_TTL = {
  /** 5 minutes */
  SHORT: 5 * 60 * 1000,
  /** 30 minutes */
  MEDIUM: 30 * 60 * 1000,
  /** 2 hours */
  LONG: 2 * 60 * 60 * 1000,
  /** 24 hours */
  DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * Generate a cache key with optional prefix
 */
function getLocalCacheKey(key: string, prefix?: string): string {
  return prefix ? `${prefix}:${key}` : key;
}

/**
 * Check if cache entry is expired
 */
function isExpired<T>(entry: CacheEntry<T>): boolean {
  const now = Date.now();
  return now - entry.timestamp > entry.ttl;
}

/**
 * Get data from local storage cache
 */
export function getLocalCache<T>(
  key: string,
  options?: LocalCacheOptions
): T | null {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  try {
    const cacheKey = getLocalCacheKey(key, options?.prefix);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);

    // Check if expired
    if (isExpired(entry)) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Local cache get error:', error);
    return null;
  }
}

/**
 * Set data in local storage cache with TTL
 */
export function setLocalCache<T>(
  key: string,
  value: T,
  options?: LocalCacheOptions
): void {
  if (typeof window === 'undefined') {
    return; // Server-side rendering
  }

  try {
    const cacheKey = getLocalCacheKey(key, options?.prefix);
    const ttl = options?.ttl ?? LOCAL_CACHE_TTL.MEDIUM;

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
    };

    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.error('Local cache set error:', error);
    // Handle quota exceeded errors gracefully
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearOldestCacheEntries();
    }
  }
}

/**
 * Delete data from local storage cache
 */
export function deleteLocalCache(key: string, options?: LocalCacheOptions): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const cacheKey = getLocalCacheKey(key, options?.prefix);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Local cache delete error:', error);
  }
}

/**
 * Clear all cache entries matching a prefix
 */
export function clearLocalCacheByPrefix(prefix: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix + ':')) {
        keys.push(key);
      }
    }

    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Local cache clear by prefix error:', error);
  }
}

/**
 * Clear all expired cache entries
 */
export function clearExpiredLocalCache(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }

    keys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const entry: CacheEntry<unknown> = JSON.parse(cached);
          if (entry.timestamp && entry.ttl && isExpired(entry)) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        // Skip invalid entries
      }
    });
  } catch (error) {
    console.error('Clear expired cache error:', error);
  }
}

/**
 * Clear oldest cache entries to free up space
 */
function clearOldestCacheEntries(): void {
  try {
    const entries: Array<{ key: string; timestamp: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry<unknown> = JSON.parse(cached);
            if (entry.timestamp) {
              entries.push({ key, timestamp: entry.timestamp });
            }
          }
        } catch {
          // Skip invalid entries
        }
      }
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest 25% of entries
    const removeCount = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < removeCount; i++) {
      localStorage.removeItem(entries[i].key);
    }
  } catch (error) {
    console.error('Clear oldest cache entries error:', error);
  }
}

/**
 * Get cache statistics
 */
export function getLocalCacheStats(): {
  totalEntries: number;
  expiredEntries: number;
  totalSize: number;
} {
  if (typeof window === 'undefined') {
    return { totalEntries: 0, expiredEntries: 0, totalSize: 0 };
  }

  let totalEntries = 0;
  let expiredEntries = 0;
  let totalSize = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const cached = localStorage.getItem(key);
        if (cached) {
          totalSize += cached.length;
          try {
            const entry: CacheEntry<unknown> = JSON.parse(cached);
            if (entry.timestamp && entry.ttl) {
              totalEntries++;
              if (isExpired(entry)) {
                expiredEntries++;
              }
            }
          } catch {
            // Skip invalid entries
          }
        }
      }
    }
  } catch (error) {
    console.error('Get cache stats error:', error);
  }

  return { totalEntries, expiredEntries, totalSize };
}

/**
 * Initialize cache cleanup on app start
 * Call this in your app's initialization
 */
export function initLocalCache(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Clear expired entries on init
  clearExpiredLocalCache();

  // Set up periodic cleanup (every 5 minutes)
  setInterval(() => {
    clearExpiredLocalCache();
  }, 5 * 60 * 1000);
}
