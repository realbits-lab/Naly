/**
 * HTTP Cache with ETag support
 * Provides efficient network caching with conditional requests
 */

import { CacheMetrics } from '../metrics/CacheMetrics'
import { CACHE_CONFIG } from '../config'

interface ETagCacheEntry {
  url: string
  etag: string | null
  lastModified: string | null
  data: any
  timestamp: number
  size: number
  contentType?: string
  maxAge?: number
  staleWhileRevalidate?: boolean
}

class ETagCache {
  private cache: Map<string, ETagCacheEntry>
  private metrics: CacheMetrics
  private pendingRequests: Map<string, Promise<any>>

  constructor() {
    this.cache = new Map()
    this.metrics = new CacheMetrics('etag')
    this.pendingRequests = new Map()

    // Load from sessionStorage if available
    if (typeof window !== 'undefined') {
      this.loadFromStorage()
      this.startCleanupTimer()
    }
  }

  /**
   * Load cache from sessionStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = sessionStorage.getItem('naly_etag_cache')
      if (stored) {
        const entries = JSON.parse(stored)
        entries.forEach((entry: ETagCacheEntry) => {
          if (this.isEntryValid(entry)) {
            this.cache.set(entry.url, entry)
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load ETag cache:', error)
    }
  }

  /**
   * Save cache to sessionStorage
   */
  private saveToStorage(): void {
    try {
      const entries = Array.from(this.cache.values())
        .filter(entry => this.isEntryValid(entry))
        .slice(0, 50) // Limit to 50 entries

      sessionStorage.setItem('naly_etag_cache', JSON.stringify(entries))
    } catch (error) {
      console.warn('Failed to save ETag cache:', error)
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isEntryValid(entry: ETagCacheEntry): boolean {
    const age = Date.now() - entry.timestamp

    // Check max-age if specified
    if (entry.maxAge && age > entry.maxAge) {
      return false
    }

    // Default max age based on content type
    const defaultMaxAge = this.getDefaultMaxAge(entry.url)
    return age < defaultMaxAge
  }

  /**
   * Get default max age based on URL pattern
   */
  private getDefaultMaxAge(url: string): number {
    if (url.includes('/api/market-data')) {
      return CACHE_CONFIG.TTL.MARKET_DATA
    }
    if (url.includes('/api/articles') || url.includes('/api/news')) {
      return CACHE_CONFIG.TTL.REGULAR_NEWS
    }
    return CACHE_CONFIG.TTL.STATIC_CONTENT
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup()
    }, 60000) // Every minute
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    let cleaned = 0

    for (const [url, entry] of this.cache.entries()) {
      if (!this.isEntryValid(entry)) {
        this.cache.delete(url)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.metrics.recordExpiredCleanup(cleaned)
      this.saveToStorage()
    }
  }

  /**
   * Fetch with ETag support and caching
   */
  async fetch<T = any>(url: string, options: RequestInit = {}): Promise<{
    data: T
    fromCache: boolean
    etag?: string
    age?: number
  }> {
    const startTime = performance.now()

    // Check if request is already pending (dedupe)
    const pending = this.pendingRequests.get(url)
    if (pending) {
      return pending
    }

    // Create request promise
    const requestPromise = this.performFetch<T>(url, options)

    // Store as pending
    this.pendingRequests.set(url, requestPromise)

    try {
      const result = await requestPromise
      return result
    } finally {
      // Clear pending request
      this.pendingRequests.delete(url)
    }
  }

  /**
   * Perform the actual fetch with ETag handling
   */
  private async performFetch<T>(url: string, options: RequestInit = {}): Promise<{
    data: T
    fromCache: boolean
    etag?: string
    age?: number
  }> {
    const startTime = performance.now()
    const cached = this.cache.get(url)

    // Build headers with conditional request headers
    const headers = new Headers(options.headers || {})

    if (cached) {
      if (cached.etag) {
        headers.set('If-None-Match', cached.etag)
      }
      if (cached.lastModified) {
        headers.set('If-Modified-Since', cached.lastModified)
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        // Enable cache for GET requests
        cache: options.method === 'GET' || !options.method ? 'default' : 'no-cache'
      })

      // Handle 304 Not Modified
      if (response.status === 304 && cached) {
        const age = Date.now() - cached.timestamp
        this.metrics.recordCacheHit('etag-304', performance.now() - startTime)

        // Update timestamp for fresh cache
        cached.timestamp = Date.now()
        this.cache.set(url, cached)
        this.saveToStorage()

        return {
          data: cached.data,
          fromCache: true,
          etag: cached.etag || undefined,
          age
        }
      }

      // Handle errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Parse response
      const contentType = response.headers.get('Content-Type')
      let data: any

      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else if (contentType?.includes('text/')) {
        data = await response.text()
      } else {
        data = await response.blob()
      }

      // Extract caching headers
      const etag = response.headers.get('ETag')
      const lastModified = response.headers.get('Last-Modified')
      const cacheControl = response.headers.get('Cache-Control')

      // Parse cache control
      const maxAge = this.parseCacheControl(cacheControl)

      // Store in cache
      if (etag || lastModified) {
        const entry: ETagCacheEntry = {
          url,
          etag,
          lastModified,
          data,
          timestamp: Date.now(),
          size: JSON.stringify(data).length,
          contentType: contentType || undefined,
          maxAge,
          staleWhileRevalidate: cacheControl?.includes('stale-while-revalidate') || false
        }

        this.cache.set(url, entry)
        this.saveToStorage()
        this.metrics.recordSet(url, entry.size)
      }

      this.metrics.recordCacheMiss('etag')

      return {
        data,
        fromCache: false,
        etag: etag || undefined
      }

    } catch (error) {
      // Return cached data on network error if available and stale-while-revalidate is enabled
      if (cached && (cached.staleWhileRevalidate || !navigator.onLine)) {
        const age = Date.now() - cached.timestamp
        console.warn('Network error, returning cached data:', error)
        this.metrics.recordCacheHit('etag-stale', performance.now() - startTime)

        return {
          data: cached.data,
          fromCache: true,
          etag: cached.etag || undefined,
          age
        }
      }

      this.metrics.recordError('fetch', error)
      throw error
    }
  }

  /**
   * Parse Cache-Control header for max-age
   */
  private parseCacheControl(cacheControl: string | null): number | undefined {
    if (!cacheControl) return undefined

    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/)
    if (maxAgeMatch) {
      return parseInt(maxAgeMatch[1]) * 1000 // Convert to milliseconds
    }

    return undefined
  }

  /**
   * Invalidate cache entry
   */
  invalidate(url: string): void {
    this.cache.delete(url)
    this.saveToStorage()
    this.metrics.recordInvalidation(url)
  }

  /**
   * Invalidate entries matching pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    let count = 0

    for (const url of this.cache.keys()) {
      if (regex.test(url)) {
        this.cache.delete(url)
        count++
      }
    }

    if (count > 0) {
      this.saveToStorage()
      this.metrics.recordEviction(count)
    }
  }

  /**
   * Prefetch URL for later use
   */
  async prefetch(url: string, options: RequestInit = {}): Promise<void> {
    try {
      await this.fetch(url, options)
    } catch (error) {
      console.warn('Prefetch failed:', url, error)
    }
  }

  /**
   * Batch prefetch multiple URLs
   */
  async batchPrefetch(urls: string[], options: RequestInit = {}): Promise<void> {
    const promises = urls.map(url => this.prefetch(url, options))
    await Promise.allSettled(promises)
  }

  /**
   * Get cache statistics
   */
  getStats(): object {
    const entries = Array.from(this.cache.values())
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
    const avgAge = entries.reduce((sum, entry) => {
      return sum + (Date.now() - entry.timestamp)
    }, 0) / entries.length || 0

    return {
      entryCount: this.cache.size,
      totalSize,
      avgAge: Math.floor(avgAge / 1000), // In seconds
      ...this.metrics.getStats()
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('naly_etag_cache')
    }

    this.metrics.recordClear()
  }
}

// Export singleton instance
export const etagCache = new ETagCache()

// Export convenience function
export async function fetchWithETag<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ data: T; fromCache: boolean; etag?: string; age?: number }> {
  return etagCache.fetch<T>(url, options)
}