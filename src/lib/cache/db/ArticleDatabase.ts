/**
 * IndexedDB implementation for article caching
 * Provides offline storage with automatic cleanup and optimization
 */

import Dexie, { Table } from 'dexie'
import { CACHE_CONFIG, getDynamicTTL } from '../config'
import { compressData, decompressData } from '../utils/compression'
import { CacheMetrics } from '../metrics/CacheMetrics'

export interface CachedArticle {
  id: string
  url?: string
  title: string
  content?: string
  textContent?: string
  summary?: string

  // Financial content
  marketAnalysis?: string
  investmentImplications?: string
  keyPoints?: string

  // Financial metadata
  tickers?: string[]
  sentiment?: 'bullish' | 'bearish' | 'neutral' | 'positive' | 'negative'
  marketImpact?: 'high' | 'medium' | 'low'
  sourceCategory?: string
  sourcePublisher?: string
  sourceTitle?: string

  // AI enhancements
  aiEnhanced?: boolean
  aiContent?: string
  aiModel?: string
  entities?: any[]
  keywords?: string[]
  topics?: string[]
  wordCount?: number

  // Cache metadata
  cachedAt: number
  accessedAt: number
  accessCount: number
  ttl: number
  etag?: string
  lastModified?: string
  size: number
  compressed?: boolean

  // Source metadata
  publishedAt: string
  author?: string
  featuredImage?: string
  images?: string[]

  // User metadata
  userId?: string
  portfolioId?: string
  read?: boolean
  bookmarked?: boolean
  readingTime?: number

  // Search optimization
  searchText?: string
  createdAt: string
}

export interface CacheMetadata {
  key: string
  type: string
  size: number
  accessedAt: number
  expiresAt?: number
  priority: number
}

class ArticleDatabase extends Dexie {
  articles!: Table<CachedArticle>
  metadata!: Table<CacheMetadata>

  private metrics: CacheMetrics

  constructor() {
    super('NalyArticleCache')

    this.version(CACHE_CONFIG.VERSION).stores({
      // Composite indexes for efficient queries
      articles: `
        id,
        url,
        title,
        [sourceCategory+publishedAt],
        [userId+read],
        [userId+bookmarked],
        cachedAt,
        accessedAt,
        *tickers,
        *keywords,
        sentiment,
        marketImpact,
        sourceCategory,
        sourcePublisher,
        sourceTitle,
        aiModel,
        createdAt
      `.replace(/\s+/g, ' ').trim(),

      metadata: 'key, type, accessedAt, expiresAt, priority'
    })

    this.metrics = new CacheMetrics('indexeddb')

    // Hooks for automatic management
    this.setupHooks()
  }

  /**
   * Setup database hooks for automatic management
   */
  private setupHooks(): void {
    // Creating hook - enhance new articles
    this.articles.hook('creating', (primKey, obj, trans) => {
      const now = Date.now()

      // Set cache metadata
      obj.cachedAt = now
      obj.accessedAt = now
      obj.accessCount = 1

      // Calculate size before compression
      const originalSize = new Blob([JSON.stringify(obj)]).size
      obj.size = originalSize

      // Compress large content
      if (originalSize > CACHE_CONFIG.COMPRESSION.THRESHOLD && obj.content) {
        obj.content = compressData(obj.content)
        obj.compressed = true
        obj.size = new Blob([JSON.stringify(obj)]).size
        this.metrics.recordCompression(originalSize, obj.size)
      }

      // Set dynamic TTL
      if (!obj.ttl) {
        obj.ttl = this.determineTTL(obj)
      }

      // Create search text for full-text search
      obj.searchText = this.createSearchText(obj)

      // Ensure we have createdAt for consistency
      if (!obj.createdAt) {
        obj.createdAt = new Date().toISOString()
      }
    })

    // Updating hook - track access patterns
    this.articles.hook('updating', (modifications, primKey, obj, trans) => {
      modifications.accessedAt = Date.now()

      if (typeof obj.accessCount === 'number') {
        modifications.accessCount = obj.accessCount + 1
      }

      return modifications
    })

    // Reading hook - decompress on read
    this.articles.hook('reading', (obj) => {
      if (obj?.compressed && obj.content) {
        obj.content = decompressData(obj.content)
        obj.compressed = false
      }
      return obj
    })
  }

  /**
   * Determine TTL based on article properties
   */
  private determineTTL(article: CachedArticle): number {
    // Breaking news or high market impact
    if (article.marketImpact === 'high' || article.sourceCategory === 'breaking') {
      return getDynamicTTL('BREAKING_NEWS')
    }

    // AI-enhanced content gets longer TTL
    if (article.aiEnhanced) {
      return getDynamicTTL('AI_ENHANCEMENT')
    }

    // Regular news
    return getDynamicTTL('REGULAR_NEWS')
  }

  /**
   * Create searchable text from article
   */
  private createSearchText(article: CachedArticle): string {
    const parts = [
      article.title,
      article.summary,
      article.sourcePublisher,
      article.sourceCategory,
      article.tickers?.join(' '),
      article.keywords?.join(' '),
      article.sentiment
    ].filter(Boolean)

    return parts.join(' ').toLowerCase()
  }

  /**
   * Cache an article with automatic optimization
   */
  async cacheArticle(article: Partial<CachedArticle>): Promise<string> {
    const startTime = performance.now()

    try {
      // Ensure storage limits
      await this.enforceStorageLimit()

      // Add or update article
      const id = await this.articles.put(article as CachedArticle)

      // Update metadata
      await this.updateMetadata('article', id.toString(), article.size || 0)

      this.metrics.recordCacheOperation('put', performance.now() - startTime, article.size || 0)

      return id.toString()

    } catch (error) {
      this.metrics.recordError('cache-article', error)
      throw error
    }
  }

  /**
   * Get cached article with freshness check
   */
  async getCachedArticle(idOrUrl: string): Promise<CachedArticle | undefined> {
    const startTime = performance.now()

    try {
      let article = await this.articles.get(idOrUrl)

      // Try by URL if not found by ID
      if (!article && idOrUrl.startsWith('http')) {
        article = await this.articles.where('url').equals(idOrUrl).first()
      }

      if (article) {
        const now = Date.now()
        const age = now - article.cachedAt

        // Check if cache is still valid
        if (age > article.ttl) {
          // Cache expired, delete it
          await this.articles.delete(article.id)
          this.metrics.recordCacheExpiry(article.id)
          return undefined
        }

        // Update access metadata (don't await to keep it fast)
        this.articles.update(article.id, {
          accessedAt: now,
          accessCount: (article.accessCount || 0) + 1
        })

        this.metrics.recordCacheHit('article', performance.now() - startTime)
        return article
      }

      this.metrics.recordCacheMiss('article')
      return undefined

    } catch (error) {
      this.metrics.recordError('get-article', error)
      return undefined
    }
  }

  /**
   * Get multiple articles efficiently
   */
  async getArticles(options: {
    category?: string
    ticker?: string
    userId?: string
    sentiment?: string
    limit?: number
    offset?: number
  } = {}): Promise<CachedArticle[]> {
    const { category, ticker, userId, sentiment, limit = 20, offset = 0 } = options
    const startTime = performance.now()

    try {
      let query = this.articles.toCollection()

      // Apply filters
      if (category) {
        query = this.articles.where('sourceCategory').equals(category)
      } else if (ticker) {
        query = this.articles.where('tickers').equals(ticker)
      } else if (userId) {
        query = this.articles.where('userId').equals(userId)
      } else if (sentiment) {
        query = this.articles.where('sentiment').equals(sentiment)
      }

      // Get results with pagination
      const results = await query
        .reverse() // Most recent first
        .offset(offset)
        .limit(limit)
        .toArray()

      // Filter out expired articles
      const now = Date.now()
      const validArticles = results.filter(article => {
        const age = now - article.cachedAt
        return age <= article.ttl
      })

      this.metrics.recordBatchOperation('get', validArticles.length, performance.now() - startTime)
      return validArticles

    } catch (error) {
      this.metrics.recordError('get-articles', error)
      return []
    }
  }

  /**
   * Search articles with full-text search
   */
  async searchArticles(query: string, limit = 20): Promise<CachedArticle[]> {
    const startTime = performance.now()
    const searchTerms = query.toLowerCase().split(/\s+/)

    try {
      const results = await this.articles
        .filter(article => {
          const searchText = article.searchText || ''
          return searchTerms.every(term => searchText.includes(term))
        })
        .limit(limit)
        .toArray()

      this.metrics.recordSearch(query, results.length, performance.now() - startTime)
      return results

    } catch (error) {
      this.metrics.recordError('search', error)
      return []
    }
  }

  /**
   * Update metadata for cache management
   */
  private async updateMetadata(type: string, key: string, size: number): Promise<void> {
    await this.metadata.put({
      key,
      type,
      size,
      accessedAt: Date.now(),
      expiresAt: Date.now() + getDynamicTTL('REGULAR_NEWS'),
      priority: this.calculatePriority(type)
    })
  }

  /**
   * Calculate cache priority
   */
  private calculatePriority(type: string): number {
    const priorities: Record<string, number> = {
      'breaking': 10,
      'market-data': 9,
      'article': 5,
      'static': 1
    }
    return priorities[type] || 3
  }

  /**
   * Enforce storage limits with intelligent eviction
   */
  async enforceStorageLimit(): Promise<void> {
    const usage = await this.getStorageUsage()

    if (usage.used > CACHE_CONFIG.SIZE_LIMITS.INDEXED_DB * 0.9) {
      // Need to free up space
      const toDelete = await this.selectArticlesForEviction()

      if (toDelete.length > 0) {
        await this.articles.bulkDelete(toDelete.map(a => a.id))
        this.metrics.recordEviction(toDelete.length)
      }
    }
  }

  /**
   * Select articles for eviction using scoring algorithm
   */
  private async selectArticlesForEviction(): Promise<CachedArticle[]> {
    const articles = await this.articles.toArray()
    const now = Date.now()

    // Score each article (lower score = more likely to evict)
    const scored = articles.map(article => ({
      article,
      score: this.calculateEvictionScore(article, now)
    }))

    // Sort by score and select lowest scoring
    scored.sort((a, b) => a.score - b.score)

    // Evict bottom 20% or at least 10 articles
    const evictCount = Math.max(10, Math.floor(articles.length * 0.2))
    return scored.slice(0, evictCount).map(s => s.article)
  }

  /**
   * Calculate eviction score for an article
   */
  private calculateEvictionScore(article: CachedArticle, now: number): number {
    const age = (now - article.cachedAt) / 1000 // Age in seconds
    const accessRecency = (now - article.accessedAt) / 1000
    const accessFrequency = article.accessCount || 0

    let score = 0

    // Frequency (higher is better)
    score += accessFrequency * 100

    // Recency (lower is better)
    score -= accessRecency

    // Age penalty
    score -= age / 10

    // Size penalty (larger files scored lower)
    score -= (article.size || 0) / 10000

    // Importance bonuses
    if (article.bookmarked) score += 1000
    if (article.marketImpact === 'high') score += 500
    if (article.sentiment !== 'neutral') score += 200
    if (article.aiEnhanced) score += 300

    return score
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(): Promise<{ used: number; total: number; percentage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const used = estimate.usage || 0
      const total = estimate.quota || CACHE_CONFIG.SIZE_LIMITS.INDEXED_DB

      return {
        used,
        total,
        percentage: (used / total) * 100
      }
    }

    // Fallback calculation
    const articles = await this.articles.toArray()
    const used = articles.reduce((sum, article) => sum + (article.size || 0), 0)
    const total = CACHE_CONFIG.SIZE_LIMITS.INDEXED_DB

    return {
      used,
      total,
      percentage: (used / total) * 100
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    const now = Date.now()

    const expired = await this.articles
      .filter(article => (now - article.cachedAt) > article.ttl)
      .toArray()

    if (expired.length > 0) {
      await this.articles.bulkDelete(expired.map(a => a.id))
      this.metrics.recordExpiredCleanup(expired.length)
    }

    return expired.length
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<object> {
    const articleCount = await this.articles.count()
    const usage = await this.getStorageUsage()

    return {
      articleCount,
      storageUsed: usage.used,
      storageTotal: usage.total,
      storagePercentage: usage.percentage,
      ...this.metrics.getStats()
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    await this.articles.clear()
    await this.metadata.clear()
    this.metrics.recordClear()
  }
}

// Export singleton instance
export const articleDb = new ArticleDatabase()

// Auto cleanup expired cache periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    articleDb.clearExpiredCache()
  }, 5 * 60 * 1000) // Every 5 minutes
}