/**
 * Advanced SWR Cache Provider with hybrid storage
 * Implements multi-layer caching with automatic synchronization
 */

import { Cache, State } from 'swr'
import { CACHE_CONFIG, getDynamicTTL } from '../config'
import { compressData, decompressData } from '../utils/compression'
import { CacheMetrics } from '../metrics/CacheMetrics'

interface CachedState<T = any> extends State<T, any> {
  timestamp?: number
  ttl?: number
  compressed?: boolean
  etag?: string
}

export class NalySWRCacheProvider implements Cache<any> {
  private memoryCache: Map<string, CachedState>
  private localStorage: Storage | null
  private metrics: CacheMetrics
  private syncTimeout: NodeJS.Timeout | null = null
  private broadcastChannel: BroadcastChannel | null = null

  constructor() {
    this.memoryCache = new Map()
    this.localStorage = typeof window !== 'undefined' ? window.localStorage : null
    this.metrics = new CacheMetrics('swr')

    if (typeof window !== 'undefined') {
      this.initializeFromStorage()
      this.setupEventListeners()
      this.setupBroadcastChannel()
    }
  }

  /**
   * Initialize cache from localStorage
   */
  private initializeFromStorage(): void {
    try {
      const stored = this.localStorage?.getItem('naly_swr_cache')
      if (!stored) return

      const { version, entries, timestamp } = JSON.parse(stored)

      if (version !== CACHE_CONFIG.VERSION) {
        // Version mismatch, clear old cache
        this.localStorage?.removeItem('naly_swr_cache')
        return
      }

      const age = Date.now() - timestamp

      // Only restore if cache is relatively fresh
      if (age > 60 * 60 * 1000) {
        this.localStorage?.removeItem('naly_swr_cache')
        return
      }

      // Restore entries
      entries.forEach(([key, value]: [string, CachedState]) => {
        // Check if entry is still valid
        if (this.isEntryValid(value)) {
          // Decompress if needed
          if (value.compressed && value.data) {
            value.data = decompressData(value.data)
            value.compressed = false
          }
          this.memoryCache.set(key, value)
        }
      })

      this.metrics.recordRestore(entries.length, age)

    } catch (error) {
      console.warn('Failed to restore SWR cache:', error)
      this.metrics.recordError('restore', error)
      // Clear corrupted cache
      this.localStorage?.removeItem('naly_swr_cache')
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isEntryValid(entry: CachedState): boolean {
    if (!entry.timestamp || !entry.ttl) return true

    const age = Date.now() - entry.timestamp
    return age < entry.ttl
  }

  /**
   * Setup event listeners for cache synchronization
   */
  private setupEventListeners(): void {
    // Handle tab close
    window.addEventListener('beforeunload', () => {
      this.syncToStorage(true) // Force immediate sync
    })

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.syncToStorage()
      } else {
        // Refresh stale data when tab becomes visible
        this.refreshStaleData()
      }
    })

    // Cross-tab synchronization via storage events
    window.addEventListener('storage', (e) => {
      if (e.key === 'naly_swr_cache' && e.newValue) {
        this.handleCrossTabSync(e.newValue)
      }
    })

    // Network status changes
    window.addEventListener('online', () => {
      this.metrics.recordNetworkChange('online')
      this.refreshStaleData()
    })

    window.addEventListener('offline', () => {
      this.metrics.recordNetworkChange('offline')
    })
  }

  /**
   * Setup BroadcastChannel for real-time cross-tab sync
   */
  private setupBroadcastChannel(): void {
    if ('BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('naly_cache_sync')

      this.broadcastChannel.addEventListener('message', (event) => {
        switch (event.data.type) {
          case 'cache_update':
            this.handleRealtimeUpdate(event.data)
            break
          case 'cache_invalidate':
            this.handleInvalidation(event.data.key)
            break
          case 'cache_clear':
            this.memoryCache.clear()
            break
        }
      })
    }
  }

  /**
   * Sync memory cache to localStorage
   */
  private syncToStorage(immediate = false): void {
    if (!this.localStorage) return

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout)
    }

    const sync = () => {
      try {
        const entries: Array<[string, CachedState]> = []
        let totalSize = 0

        // Filter and prepare entries for storage
        for (const [key, value] of this.memoryCache.entries()) {
          if (!this.shouldPersist(key)) continue

          let entry = { ...value }

          // Compress large data
          if (entry.data && !entry.compressed) {
            const dataSize = JSON.stringify(entry.data).length
            if (dataSize > CACHE_CONFIG.COMPRESSION.THRESHOLD) {
              entry.data = compressData(entry.data)
              entry.compressed = true
              this.metrics.recordCompression(dataSize, entry.data.length)
            }
          }

          entries.push([key, entry])
          totalSize += JSON.stringify(entry).length

          // Stop if we exceed storage limit
          if (totalSize > CACHE_CONFIG.SIZE_LIMITS.LOCAL_STORAGE * 0.9) {
            break
          }
        }

        // Sort by access time and keep most recent
        entries.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0))
        const limitedEntries = entries.slice(0, 100)

        const serialized = JSON.stringify({
          version: CACHE_CONFIG.VERSION,
          entries: limitedEntries,
          timestamp: Date.now()
        })

        this.localStorage.setItem('naly_swr_cache', serialized)
        this.metrics.recordSync(limitedEntries.length, serialized.length)

      } catch (error) {
        console.warn('Failed to sync cache to storage:', error)
        this.metrics.recordError('sync', error)

        // Try to clear if quota exceeded
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          this.localStorage?.removeItem('naly_swr_cache')
        }
      }
    }

    if (immediate) {
      sync()
    } else {
      this.syncTimeout = setTimeout(sync, 1000)
    }
  }

  /**
   * Determine if a cache key should be persisted
   */
  private shouldPersist(key: string): boolean {
    // Critical patterns that should always be persisted
    const criticalPatterns = [
      '/api/articles',
      '/api/news',
      '/api/market-data',
      '/api/portfolios',
      '/api/analytics',
      '/api/user'
    ]

    return criticalPatterns.some(pattern => key.includes(pattern))
  }

  /**
   * Handle cross-tab synchronization
   */
  private handleCrossTabSync(newValue: string): void {
    try {
      const { entries } = JSON.parse(newValue)

      entries.forEach(([key, value]: [string, CachedState]) => {
        const existing = this.memoryCache.get(key)

        // Only update if newer
        if (!existing || (value.timestamp || 0) > (existing.timestamp || 0)) {
          if (value.compressed && value.data) {
            value.data = decompressData(value.data)
            value.compressed = false
          }
          this.memoryCache.set(key, value)
        }
      })

      this.metrics.recordCrossTabSync(entries.length)

    } catch (error) {
      console.warn('Cross-tab sync failed:', error)
      this.metrics.recordError('cross-tab-sync', error)
    }
  }

  /**
   * Handle real-time updates via BroadcastChannel
   */
  private handleRealtimeUpdate(data: any): void {
    if (data.key && data.value) {
      const existing = this.memoryCache.get(data.key)

      // Only update if newer
      if (!existing || (data.value.timestamp || 0) > (existing.timestamp || 0)) {
        this.memoryCache.set(data.key, data.value)
        this.metrics.recordRealtimeSync()
      }
    }
  }

  /**
   * Handle cache invalidation
   */
  private handleInvalidation(key: string): void {
    this.memoryCache.delete(key)
    this.metrics.recordInvalidation(key)
  }

  /**
   * Refresh stale data when tab becomes active
   */
  private refreshStaleData(): void {
    const now = Date.now()
    const staleKeys: string[] = []

    for (const [key, value] of this.memoryCache.entries()) {
      if (value.timestamp && value.ttl) {
        const age = now - value.timestamp
        if (age > value.ttl) {
          staleKeys.push(key)
        }
      }
    }

    // Mark stale entries for revalidation
    staleKeys.forEach(key => {
      const entry = this.memoryCache.get(key)
      if (entry) {
        entry.isValidating = true
        this.memoryCache.set(key, entry)
      }
    })

    this.metrics.recordStaleRefresh(staleKeys.length)
  }

  /**
   * Broadcast cache update to other tabs
   */
  private broadcastUpdate(key: string, value: CachedState): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'cache_update',
        key,
        value,
        timestamp: Date.now()
      })
    }
  }

  // SWR Cache Interface Implementation

  get(key: string): CachedState | undefined {
    const startTime = performance.now()
    const value = this.memoryCache.get(key)

    if (value) {
      // Check if entry is still valid
      if (!this.isEntryValid(value)) {
        this.memoryCache.delete(key)
        this.metrics.recordMiss(key)
        return undefined
      }

      this.metrics.recordHit(key, performance.now() - startTime)
      return value
    }

    this.metrics.recordMiss(key)
    return undefined
  }

  set(key: string, value: State<any, any>): void {
    // Enhance with metadata
    const enhancedValue: CachedState = {
      ...value,
      timestamp: Date.now(),
      ttl: this.determineTTL(key)
    }

    this.memoryCache.set(key, enhancedValue)

    // Sync to storage (debounced)
    this.syncToStorage()

    // Broadcast to other tabs
    this.broadcastUpdate(key, enhancedValue)

    this.metrics.recordSet(key, JSON.stringify(enhancedValue).length)
  }

  delete(key: string): void {
    this.memoryCache.delete(key)
    this.syncToStorage()

    // Broadcast invalidation
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'cache_invalidate',
        key,
        timestamp: Date.now()
      })
    }

    this.metrics.recordDelete(key)
  }

  keys(): IterableIterator<string> {
    return this.memoryCache.keys()
  }

  /**
   * Determine TTL based on cache key pattern
   */
  private determineTTL(key: string): number {
    if (key.includes('/api/market-data')) {
      return getDynamicTTL('MARKET_DATA')
    }
    if (key.includes('/api/articles') || key.includes('/api/news')) {
      if (key.includes('breaking')) {
        return getDynamicTTL('BREAKING_NEWS')
      }
      return getDynamicTTL('REGULAR_NEWS')
    }
    if (key.includes('/api/ai') || key.includes('enhancement')) {
      return getDynamicTTL('AI_ENHANCEMENT')
    }
    if (key.includes('/api/user') || key.includes('preferences')) {
      return getDynamicTTL('USER_PREFERENCES')
    }

    // Default TTL
    return getDynamicTTL('REGULAR_NEWS')
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear()
    this.localStorage?.removeItem('naly_swr_cache')

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'cache_clear',
        timestamp: Date.now()
      })
    }

    this.metrics.recordClear()
  }

  /**
   * Get cache statistics
   */
  getStats(): object {
    return this.metrics.getStats()
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout)
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close()
    }

    // Final sync before disposal
    this.syncToStorage(true)
  }
}

// Export singleton instance
export const swrCacheProvider = new NalySWRCacheProvider()