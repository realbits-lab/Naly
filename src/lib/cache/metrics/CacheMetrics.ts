/**
 * Cache metrics collection and monitoring
 * Tracks performance, hit rates, and usage patterns
 */

export interface MetricData {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
  compressions: number
  evictions: number
  syncs: number
  searches: number
  avgHitLatency: number
  avgMissLatency: number
  bytesCompressed: number
  bytesOriginal: number
  cacheSize: number
  lastUpdated: number
}

export class CacheMetrics {
  private storeName: string
  private metrics: MetricData
  private latencyBuffer: number[] = []
  private readonly MAX_LATENCY_SAMPLES = 100

  constructor(storeName: string) {
    this.storeName = storeName
    this.metrics = this.loadMetrics()
    this.startPeriodicSave()
  }

  /**
   * Load metrics from localStorage
   */
  private loadMetrics(): MetricData {
    if (typeof window === 'undefined') {
      return this.getEmptyMetrics()
    }

    try {
      const stored = localStorage.getItem(`naly_cache_metrics_${this.storeName}`)
      if (stored) {
        return { ...this.getEmptyMetrics(), ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('Failed to load metrics:', error)
    }

    return this.getEmptyMetrics()
  }

  /**
   * Get empty metrics object
   */
  private getEmptyMetrics(): MetricData {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      compressions: 0,
      evictions: 0,
      syncs: 0,
      searches: 0,
      avgHitLatency: 0,
      avgMissLatency: 0,
      bytesCompressed: 0,
      bytesOriginal: 0,
      cacheSize: 0,
      lastUpdated: Date.now()
    }
  }

  /**
   * Save metrics periodically
   */
  private startPeriodicSave(): void {
    if (typeof window === 'undefined') return

    setInterval(() => {
      this.saveMetrics()
    }, 10000) // Save every 10 seconds
  }

  /**
   * Save metrics to localStorage
   */
  private saveMetrics(): void {
    if (typeof window === 'undefined') return

    try {
      this.metrics.lastUpdated = Date.now()
      localStorage.setItem(
        `naly_cache_metrics_${this.storeName}`,
        JSON.stringify(this.metrics)
      )
    } catch (error) {
      console.warn('Failed to save metrics:', error)
    }
  }

  /**
   * Record cache hit
   */
  recordHit(key: string, latency: number): void {
    this.metrics.hits++
    this.updateLatency('hit', latency)
    this.emitEvent('cache_hit', { key, latency })
  }

  /**
   * Record cache miss
   */
  recordMiss(key: string): void {
    this.metrics.misses++
    this.emitEvent('cache_miss', { key })
  }

  /**
   * Record cache set operation
   */
  recordSet(key: string, size: number): void {
    this.metrics.sets++
    this.metrics.cacheSize += size
    this.emitEvent('cache_set', { key, size })
  }

  /**
   * Record cache delete
   */
  recordDelete(key: string): void {
    this.metrics.deletes++
    this.emitEvent('cache_delete', { key })
  }

  /**
   * Record error
   */
  recordError(operation: string, error: any): void {
    this.metrics.errors++
    this.emitEvent('cache_error', { operation, error: error?.message })
  }

  /**
   * Record compression
   */
  recordCompression(originalSize: number, compressedSize: number): void {
    this.metrics.compressions++
    this.metrics.bytesOriginal += originalSize
    this.metrics.bytesCompressed += compressedSize

    const ratio = ((originalSize - compressedSize) / originalSize) * 100
    this.emitEvent('cache_compression', { originalSize, compressedSize, ratio })
  }

  /**
   * Record eviction
   */
  recordEviction(count: number): void {
    this.metrics.evictions += count
    this.emitEvent('cache_eviction', { count })
  }

  /**
   * Record sync operation
   */
  recordSync(itemCount: number, size: number): void {
    this.metrics.syncs++
    this.emitEvent('cache_sync', { itemCount, size })
  }

  /**
   * Record search operation
   */
  recordSearch(query: string, resultCount: number, latency: number): void {
    this.metrics.searches++
    this.updateLatency('search', latency)
    this.emitEvent('cache_search', { query, resultCount, latency })
  }

  /**
   * Record cache restore from storage
   */
  recordRestore(itemCount: number, age: number): void {
    this.emitEvent('cache_restore', { itemCount, age })
  }

  /**
   * Record cache clear
   */
  recordClear(): void {
    this.metrics = this.getEmptyMetrics()
    this.saveMetrics()
    this.emitEvent('cache_clear', {})
  }

  /**
   * Record network change
   */
  recordNetworkChange(status: 'online' | 'offline'): void {
    this.emitEvent('network_change', { status })
  }

  /**
   * Record cross-tab sync
   */
  recordCrossTabSync(itemCount: number): void {
    this.emitEvent('cross_tab_sync', { itemCount })
  }

  /**
   * Record real-time sync
   */
  recordRealtimeSync(): void {
    this.emitEvent('realtime_sync', {})
  }

  /**
   * Record invalidation
   */
  recordInvalidation(key: string): void {
    this.emitEvent('cache_invalidation', { key })
  }

  /**
   * Record stale refresh
   */
  recordStaleRefresh(count: number): void {
    this.emitEvent('stale_refresh', { count })
  }

  /**
   * Record cache expiry
   */
  recordCacheExpiry(key: string): void {
    this.emitEvent('cache_expiry', { key })
  }

  /**
   * Record cache hit for specific type
   */
  recordCacheHit(type: string, latency: number): void {
    this.recordHit(type, latency)
  }

  /**
   * Record cache miss for specific type
   */
  recordCacheMiss(type: string): void {
    this.recordMiss(type)
  }

  /**
   * Record batch operation
   */
  recordBatchOperation(operation: string, count: number, latency: number): void {
    this.emitEvent('batch_operation', { operation, count, latency })
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(operation: string, latency: number, size: number): void {
    this.emitEvent('cache_operation', { operation, latency, size })
  }

  /**
   * Record expired cleanup
   */
  recordExpiredCleanup(count: number): void {
    this.emitEvent('expired_cleanup', { count })
  }

  /**
   * Update latency statistics
   */
  private updateLatency(type: 'hit' | 'miss' | 'search', latency: number): void {
    this.latencyBuffer.push(latency)

    if (this.latencyBuffer.length > this.MAX_LATENCY_SAMPLES) {
      this.latencyBuffer.shift()
    }

    const avg = this.latencyBuffer.reduce((a, b) => a + b, 0) / this.latencyBuffer.length

    if (type === 'hit') {
      this.metrics.avgHitLatency = avg
    } else if (type === 'miss') {
      this.metrics.avgMissLatency = avg
    }
  }

  /**
   * Emit analytics event
   */
  private emitEvent(eventName: string, data: any): void {
    if (typeof window === 'undefined') return

    // Custom event for monitoring
    window.dispatchEvent(new CustomEvent(`cache:${eventName}`, {
      detail: {
        store: this.storeName,
        ...data,
        timestamp: Date.now()
      }
    }))

    // Send to analytics if available
    if (window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'cache',
        event_label: this.storeName,
        ...data
      })
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Cache ${this.storeName}] ${eventName}:`, data)
    }
  }

  /**
   * Get current statistics
   */
  getStats(): object {
    const hitRate = this.metrics.hits + this.metrics.misses > 0
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100
      : 0

    const compressionRatio = this.metrics.bytesOriginal > 0
      ? ((this.metrics.bytesOriginal - this.metrics.bytesCompressed) / this.metrics.bytesOriginal) * 100
      : 0

    return {
      ...this.metrics,
      hitRate: `${hitRate.toFixed(2)}%`,
      compressionRatio: `${compressionRatio.toFixed(2)}%`,
      cacheEfficiency: this.calculateEfficiency(),
      healthScore: this.calculateHealthScore()
    }
  }

  /**
   * Calculate cache efficiency
   */
  private calculateEfficiency(): number {
    const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses || 1)
    const errorRate = this.metrics.errors / (this.metrics.sets + this.metrics.hits + this.metrics.misses || 1)

    return (hitRate * 100) - (errorRate * 50)
  }

  /**
   * Calculate cache health score
   */
  private calculateHealthScore(): number {
    let score = 100

    // Deduct for poor hit rate
    const hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses || 1)
    if (hitRate < 0.5) score -= 30

    // Deduct for errors
    if (this.metrics.errors > 10) score -= 20

    // Deduct for excessive evictions
    if (this.metrics.evictions > this.metrics.sets * 0.3) score -= 15

    // Bonus for good compression
    const compressionRatio = this.metrics.bytesOriginal > 0
      ? (this.metrics.bytesOriginal - this.metrics.bytesCompressed) / this.metrics.bytesOriginal
      : 0
    if (compressionRatio > 0.5) score += 10

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = this.getEmptyMetrics()
    this.latencyBuffer = []
    this.saveMetrics()
  }

  /**
   * Export metrics for analysis
   */
  export(): string {
    return JSON.stringify({
      store: this.storeName,
      metrics: this.metrics,
      exported: new Date().toISOString()
    }, null, 2)
  }
}