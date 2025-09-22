# Naly-Specific Hybrid Cache Implementation Guide

## Executive Summary

This implementation guide details how to integrate the hybrid cache system into Naly's existing financial news infrastructure. The solution leverages Naly's current NewsService, ArticleFetchingService, and PostgreSQL database while adding multiple cache layers for optimal performance and offline capabilities.

## Current State Analysis

### Existing Components
- **NewsService**: Web search integration with AI enhancement
- **ArticleFetchingService**: Mozilla Readability-based article extraction
- **useArticleFetching Hook**: Polling-based status tracking
- **PostgreSQL + Drizzle ORM**: Persistent storage
- **AI Enhancement**: GPT-based content generation

### Identified Gaps
- No in-memory caching
- No browser-side persistence
- No offline support
- No ETag/conditional request handling
- No cross-tab synchronization
- High latency for repeated requests

## Implementation Architecture

```
┌─────────────────────────────────────────────────┐
│                 Naly News Reader                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ News Sources │  │   AI Enhancement Layer   │ │
│  ├──────────────┤  ├─────────────────────────┤ │
│  │ • RSS Feeds  │  │ • Content Enhancement   │ │
│  │ • Web Search │  │ • Sentiment Analysis    │ │
│  │ • APIs       │  │ • Entity Extraction     │ │
│  └──────┬───────┘  └────────┬────────────────┘ │
│         │                    │                  │
│  ┌──────▼────────────────────▼────────────────┐ │
│  │        Hybrid Cache Manager                 │ │
│  ├────────────────────────────────────────────┤ │
│  │ L1: SWR Memory Cache (< 1ms)              │ │
│  │ L2: localStorage (< 5ms)                  │ │
│  │ L3: IndexedDB (< 20ms)                    │ │
│  │ L4: PostgreSQL (< 100ms)                  │ │
│  │ L5: HTTP Cache + CDN                      │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Phase 1: Foundation (Week 1)

### 1.1 Install Dependencies

```bash
pnpm add swr dexie idb-keyval workbox-precaching
pnpm add -D @types/node workbox-webpack-plugin
```

### 1.2 Create Cache Infrastructure

```typescript
// src/lib/cache/config.ts
export const CACHE_CONFIG = {
  VERSION: 1,
  STORES: {
    NEWS_ARTICLES: 'news_articles',
    FETCHED_ARTICLES: 'fetched_articles',
    AI_ENHANCEMENTS: 'ai_enhancements',
    MARKET_DATA: 'market_data',
    USER_PREFERENCES: 'user_preferences'
  },
  TTL: {
    BREAKING_NEWS: 5 * 60 * 1000,        // 5 minutes
    REGULAR_NEWS: 30 * 60 * 1000,        // 30 minutes
    AI_ENHANCEMENT: 60 * 60 * 1000,      // 1 hour
    MARKET_DATA: 60 * 1000,              // 1 minute
    STATIC_CONTENT: 24 * 60 * 60 * 1000  // 24 hours
  },
  SIZE_LIMITS: {
    MEMORY_CACHE: 10 * 1024 * 1024,      // 10MB
    LOCAL_STORAGE: 5 * 1024 * 1024,      // 5MB
    INDEXED_DB: 100 * 1024 * 1024,       // 100MB
    TOTAL: 150 * 1024 * 1024              // 150MB
  }
}
```

### 1.3 Implement SWR Cache Provider

```typescript
// src/lib/cache/providers/swrCacheProvider.ts
import { Cache, State } from 'swr'
import { CACHE_CONFIG } from '../config'
import { compressData, decompressData } from '../utils/compression'
import { CacheMetrics } from '../metrics'

export class NalySWRCacheProvider implements Cache<any> {
  private memoryCache: Map<string, State<any, any>>
  private localStorage: Storage | null
  private metrics: CacheMetrics
  private syncTimeout: NodeJS.Timeout | null = null

  constructor() {
    this.memoryCache = new Map()
    this.localStorage = typeof window !== 'undefined' ? window.localStorage : null
    this.metrics = new CacheMetrics('swr')

    if (this.localStorage) {
      this.initializeFromStorage()
      this.setupEventListeners()
    }
  }

  private initializeFromStorage(): void {
    try {
      const stored = this.localStorage?.getItem('naly_swr_cache')
      if (stored) {
        const { version, entries, timestamp } = JSON.parse(stored)

        if (version === CACHE_CONFIG.VERSION) {
          const age = Date.now() - timestamp

          // Only restore if cache is less than 1 hour old
          if (age < 60 * 60 * 1000) {
            entries.forEach(([key, value]: [string, State<any, any>]) => {
              // Decompress financial data
              if (key.includes('market_data') || key.includes('news')) {
                value.data = decompressData(value.data)
              }
              this.memoryCache.set(key, value)
            })

            this.metrics.recordRestore(entries.length)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to restore SWR cache:', error)
      this.metrics.recordError('restore', error)
    }
  }

  private setupEventListeners(): void {
    // Handle tab close
    window.addEventListener('beforeunload', () => {
      this.syncToStorage(true) // Force sync on unload
    })

    // Handle visibility change for background sync
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.syncToStorage()
      }
    })

    // Cross-tab synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === 'naly_swr_cache' && e.newValue) {
        this.handleCrossTabSync(e.newValue)
      }
    })

    // Broadcast channel for real-time sync
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('naly_cache_sync')

      channel.addEventListener('message', (event) => {
        if (event.data.type === 'cache_update') {
          this.handleRealtimeSync(event.data)
        }
      })
    }
  }

  private syncToStorage(immediate = false): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout)
    }

    const sync = () => {
      try {
        const entries = Array.from(this.memoryCache.entries())
          .filter(([key]) => this.shouldPersist(key))
          .map(([key, value]) => {
            // Compress large financial data
            if (key.includes('market_data') || key.includes('news')) {
              return [key, { ...value, data: compressData(value.data) }]
            }
            return [key, value]
          })
          .slice(-100) // Keep last 100 entries

        const serialized = JSON.stringify({
          version: CACHE_CONFIG.VERSION,
          entries,
          timestamp: Date.now()
        })

        if (serialized.length < CACHE_CONFIG.SIZE_LIMITS.LOCAL_STORAGE) {
          this.localStorage?.setItem('naly_swr_cache', serialized)
          this.metrics.recordSync(entries.length, serialized.length)
        }
      } catch (error) {
        console.warn('Failed to sync cache:', error)
        this.metrics.recordError('sync', error)
      }
    }

    if (immediate) {
      sync()
    } else {
      this.syncTimeout = setTimeout(sync, 1000)
    }
  }

  private shouldPersist(key: string): boolean {
    // Persist critical financial data
    const criticalPatterns = [
      '/api/news',
      '/api/market-data',
      '/api/portfolios',
      '/api/analytics'
    ]

    return criticalPatterns.some(pattern => key.includes(pattern))
  }

  private handleCrossTabSync(newValue: string): void {
    try {
      const { entries } = JSON.parse(newValue)
      entries.forEach(([key, value]: [string, State<any, any>]) => {
        if (!this.memoryCache.has(key)) {
          this.memoryCache.set(key, value)
        }
      })
    } catch (error) {
      console.warn('Cross-tab sync failed:', error)
    }
  }

  private handleRealtimeSync(data: any): void {
    if (data.key && data.value) {
      this.memoryCache.set(data.key, data.value)
      this.metrics.recordRealtimeSync()
    }
  }

  // SWR Cache interface implementation
  get(key: string): State<any, any> | undefined {
    const startTime = performance.now()
    const value = this.memoryCache.get(key)

    if (value) {
      this.metrics.recordHit(key, performance.now() - startTime)
    } else {
      this.metrics.recordMiss(key)
    }

    return value
  }

  set(key: string, value: State<any, any>): void {
    this.memoryCache.set(key, value)
    this.syncToStorage()

    // Broadcast to other tabs
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('naly_cache_sync')
      channel.postMessage({ type: 'cache_update', key, value })
    }
  }

  delete(key: string): void {
    this.memoryCache.delete(key)
    this.syncToStorage()
  }

  keys(): IterableIterator<string> {
    return this.memoryCache.keys()
  }
}
```

### 1.4 IndexedDB Integration for Articles

```typescript
// src/lib/cache/db/ArticleDatabase.ts
import Dexie, { Table } from 'dexie'
import { CACHE_CONFIG } from '../config'

export interface CachedArticle {
  id: string
  url: string
  title: string
  content: string
  textContent?: string
  summary?: string

  // Financial metadata
  tickers?: string[]
  sentiment?: 'bullish' | 'bearish' | 'neutral'
  marketImpact?: 'high' | 'medium' | 'low'

  // AI enhancements
  aiEnhanced?: boolean
  aiContent?: string
  entities?: any[]
  keywords?: string[]

  // Cache metadata
  cachedAt: number
  accessedAt: number
  accessCount: number
  ttl: number
  etag?: string
  size: number

  // Source metadata
  source: string
  publishedAt: string
  author?: string
  category: string

  // User metadata
  userId?: string
  portfolioId?: string
  read?: boolean
  bookmarked?: boolean
}

export class ArticleDatabase extends Dexie {
  articles!: Table<CachedArticle>
  marketData!: Table<any>
  userPreferences!: Table<any>

  constructor() {
    super('NalyArticleCache')

    this.version(CACHE_CONFIG.VERSION).stores({
      articles: 'id, url, [category+publishedAt], [userId+read], cachedAt, accessedAt, *tickers',
      marketData: 'symbol, timestamp',
      userPreferences: 'userId, key'
    })

    // Hooks for automatic cache management
    this.articles.hook('creating', (primKey, obj) => {
      obj.cachedAt = Date.now()
      obj.accessedAt = Date.now()
      obj.accessCount = 1
      obj.size = new Blob([JSON.stringify(obj)]).size

      if (!obj.ttl) {
        obj.ttl = this.determineTTL(obj)
      }
    })

    this.articles.hook('updating', (modifications, primKey, obj) => {
      modifications.accessedAt = Date.now()

      if (obj.accessCount !== undefined) {
        modifications.accessCount = obj.accessCount + 1
      }

      return modifications
    })
  }

  private determineTTL(article: CachedArticle): number {
    // Breaking news gets shorter TTL
    if (article.marketImpact === 'high') {
      return CACHE_CONFIG.TTL.BREAKING_NEWS
    }

    // AI-enhanced content gets longer TTL
    if (article.aiEnhanced) {
      return CACHE_CONFIG.TTL.AI_ENHANCEMENT
    }

    return CACHE_CONFIG.TTL.REGULAR_NEWS
  }

  async cacheArticle(article: CachedArticle): Promise<void> {
    const transaction = this.transaction('rw', this.articles, async () => {
      // Check cache size limit
      await this.enforceStorageLimit()

      // Store article
      await this.articles.put(article)

      // Update metrics
      await this.updateCacheMetrics('article_cached', article.size)
    })

    await transaction
  }

  async getCachedArticle(idOrUrl: string): Promise<CachedArticle | undefined> {
    let article = await this.articles.get(idOrUrl)

    if (!article) {
      article = await this.articles.where('url').equals(idOrUrl).first()
    }

    if (article) {
      const now = Date.now()
      const age = now - article.cachedAt

      // Check if cache is still valid
      if (age > article.ttl) {
        await this.articles.delete(article.id)
        return undefined
      }

      // Update access metadata
      await this.articles.update(article.id, {
        accessedAt: now,
        accessCount: (article.accessCount || 0) + 1
      })
    }

    return article
  }

  async enforceStorageLimit(): Promise<void> {
    const usage = await this.getStorageUsage()

    if (usage.total > CACHE_CONFIG.SIZE_LIMITS.INDEXED_DB) {
      // Remove least recently accessed articles
      const toDelete = await this.articles
        .orderBy('accessedAt')
        .limit(20)
        .toArray()

      await this.articles.bulkDelete(toDelete.map(a => a.id))
    }
  }

  async getStorageUsage(): Promise<{ used: number; total: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage || 0,
        total: estimate.quota || CACHE_CONFIG.SIZE_LIMITS.INDEXED_DB
      }
    }

    // Fallback calculation
    const articles = await this.articles.toArray()
    const used = articles.reduce((sum, article) => sum + (article.size || 0), 0)

    return {
      used,
      total: CACHE_CONFIG.SIZE_LIMITS.INDEXED_DB
    }
  }

  async updateCacheMetrics(event: string, size?: number): Promise<void> {
    // Implementation for metrics tracking
    if (window.analytics) {
      window.analytics.track('cache_event', {
        event,
        size,
        timestamp: Date.now()
      })
    }
  }

  async clearExpiredCache(): Promise<void> {
    const now = Date.now()

    await this.transaction('rw', this.articles, async () => {
      const expired = await this.articles
        .filter(article => (now - article.cachedAt) > article.ttl)
        .toArray()

      if (expired.length > 0) {
        await this.articles.bulkDelete(expired.map(a => a.id))
        console.log(`Cleared ${expired.length} expired articles from cache`)
      }
    })
  }

  async getArticlesByCategory(category: string, limit = 20): Promise<CachedArticle[]> {
    return this.articles
      .where('[category+publishedAt]')
      .between([category, Dexie.minKey], [category, Dexie.maxKey])
      .reverse()
      .limit(limit)
      .toArray()
  }

  async getArticlesByTicker(ticker: string): Promise<CachedArticle[]> {
    return this.articles
      .where('tickers')
      .equals(ticker)
      .reverse()
      .sortBy('publishedAt')
  }

  async getUserReadArticles(userId: string): Promise<CachedArticle[]> {
    return this.articles
      .where('[userId+read]')
      .equals([userId, true])
      .reverse()
      .sortBy('accessedAt')
  }
}

export const articleDb = new ArticleDatabase()
```

## Phase 2: Enhanced Fetching (Week 2)

### 2.1 Update NewsService with Cache Integration

```typescript
// src/lib/news-service-cached.ts
import { NewsService } from './news-service'
import { articleDb } from './cache/db/ArticleDatabase'
import { fetchWithETag } from './cache/http/etagFetcher'

export class CachedNewsService extends NewsService {
  private cacheFirst = false
  private maxStale = 5 * 60 * 1000 // 5 minutes

  async fetchLatestNews(options: {
    forceRefresh?: boolean
    category?: string
    cacheFirst?: boolean
  } = {}): Promise<NewsArticle[]> {
    const { forceRefresh = false, category, cacheFirst = this.cacheFirst } = options

    // Try cache first if enabled and not forcing refresh
    if (cacheFirst && !forceRefresh) {
      const cached = await this.getCachedNews(category)

      if (cached.length > 0) {
        // Check if cache is fresh enough
        const oldestAge = Math.min(...cached.map(a => Date.now() - a.cachedAt))

        if (oldestAge < this.maxStale) {
          console.log(`📦 Returning ${cached.length} cached articles`)
          return cached
        }
      }
    }

    // Fetch fresh news
    try {
      const freshNews = await super.fetchLatestNews()

      // Cache the fresh news
      await this.cacheNews(freshNews)

      return freshNews
    } catch (error) {
      console.error('Failed to fetch fresh news:', error)

      // Fall back to cache on error
      const cached = await this.getCachedNews(category)
      if (cached.length > 0) {
        console.log(`📦 Network error, returning ${cached.length} cached articles`)
        return cached
      }

      throw error
    }
  }

  private async getCachedNews(category?: string): Promise<NewsArticle[]> {
    try {
      const cached = category
        ? await articleDb.getArticlesByCategory(category)
        : await articleDb.articles
            .orderBy('publishedAt')
            .reverse()
            .limit(20)
            .toArray()

      return cached.map(this.convertCachedToNewsArticle)
    } catch (error) {
      console.error('Cache read error:', error)
      return []
    }
  }

  private async cacheNews(articles: NewsArticle[]): Promise<void> {
    try {
      const cachePromises = articles.map(article =>
        articleDb.cacheArticle({
          id: this.generateArticleId(article),
          url: article.url,
          title: article.title,
          content: article.content,
          summary: article.summary,
          source: article.source,
          publishedAt: article.publishedAt,
          category: article.category,
          cachedAt: Date.now(),
          accessedAt: Date.now(),
          accessCount: 0,
          ttl: this.determineTTL(article),
          size: new Blob([JSON.stringify(article)]).size
        })
      )

      await Promise.all(cachePromises)
      console.log(`✅ Cached ${articles.length} articles`)
    } catch (error) {
      console.error('Cache write error:', error)
    }
  }

  private convertCachedToNewsArticle(cached: CachedArticle): NewsArticle {
    return {
      title: cached.title,
      content: cached.aiContent || cached.content,
      url: cached.url,
      source: cached.source,
      publishedAt: cached.publishedAt,
      category: cached.category,
      imageUrl: cached.featuredImage,
      summary: cached.summary
    }
  }

  private generateArticleId(article: NewsArticle): string {
    return btoa(article.url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)
  }

  private determineTTL(article: NewsArticle): number {
    // Breaking news categories get shorter TTL
    if (['breaking', 'alerts', 'urgent'].includes(article.category)) {
      return 5 * 60 * 1000 // 5 minutes
    }

    // Market data gets very short TTL
    if (article.category === 'market-data') {
      return 60 * 1000 // 1 minute
    }

    // Regular news
    return 30 * 60 * 1000 // 30 minutes
  }
}
```

### 2.2 Enhanced Article Fetching Hook with SWR

```typescript
// src/lib/hooks/useCachedArticles.ts
import useSWR, { SWRConfiguration, mutate } from 'swr'
import { articleDb } from '../cache/db/ArticleDatabase'
import { fetchWithETag } from '../cache/http/etagFetcher'
import { useAuth } from './useAuth'

interface UseArticlesOptions {
  category?: string
  ticker?: string
  limit?: number
  cacheFirst?: boolean
  refreshInterval?: number
}

export function useCachedArticles(options: UseArticlesOptions = {}) {
  const { user } = useAuth()
  const {
    category,
    ticker,
    limit = 20,
    cacheFirst = true,
    refreshInterval = 5 * 60 * 1000
  } = options

  // Build cache key
  const key = [
    '/api/articles',
    category && `category=${category}`,
    ticker && `ticker=${ticker}`,
    limit && `limit=${limit}`,
    user?.id && `userId=${user.id}`
  ].filter(Boolean).join('&')

  const fetcher = async (url: string) => {
    // Check offline status
    if (!navigator.onLine && cacheFirst) {
      console.log('📱 Offline mode - using cached articles')

      if (ticker) {
        return articleDb.getArticlesByTicker(ticker)
      } else if (category) {
        return articleDb.getArticlesByCategory(category, limit)
      } else {
        return articleDb.articles
          .orderBy('publishedAt')
          .reverse()
          .limit(limit)
          .toArray()
      }
    }

    // Fetch with ETag support
    try {
      const { data, fromCache } = await fetchWithETag<any[]>(url, {
        headers: user ? { Authorization: `Bearer ${user.token}` } : {}
      })

      // Cache articles if not from HTTP cache
      if (!fromCache && data) {
        await Promise.all(
          data.map(article => articleDb.cacheArticle({
            ...article,
            userId: user?.id
          }))
        )
      }

      return data
    } catch (error) {
      // Fallback to cache on error
      console.error('Fetch error, falling back to cache:', error)

      if (ticker) {
        return articleDb.getArticlesByTicker(ticker)
      } else if (category) {
        return articleDb.getArticlesByCategory(category, limit)
      } else {
        return articleDb.articles
          .orderBy('publishedAt')
          .reverse()
          .limit(limit)
          .toArray()
      }
    }
  }

  const config: SWRConfiguration = {
    fetcher,
    refreshInterval,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    keepPreviousData: true,

    // Offline fallback
    fallback: {
      [key]: async () => {
        const cached = category
          ? await articleDb.getArticlesByCategory(category, limit)
          : await articleDb.articles
              .orderBy('publishedAt')
              .reverse()
              .limit(limit)
              .toArray()

        return cached.length > 0 ? cached : undefined
      }
    },

    // Custom online check
    isOnline: () => navigator.onLine,

    // Error retry with exponential backoff
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Don't retry if offline
      if (!navigator.onLine) return

      // Don't retry on 404s
      if (error.status === 404) return

      // Exponential backoff
      if (retryCount >= 3) return

      setTimeout(
        () => revalidate({ retryCount }),
        Math.min(1000 * Math.pow(2, retryCount), 30000)
      )
    },

    // Success callback for metrics
    onSuccess: (data) => {
      if (window.analytics) {
        window.analytics.track('articles_loaded', {
          count: data?.length || 0,
          category,
          ticker
        })
      }
    }
  }

  const { data, error, isValidating, mutate: revalidate } = useSWR(key, config)

  // Prefetch next page
  const prefetchNext = async () => {
    const nextKey = key.replace(`limit=${limit}`, `limit=${limit + 20}`)
    await mutate(nextKey, fetcher(nextKey), { revalidate: false })
  }

  // Mark article as read
  const markAsRead = async (articleId: string) => {
    if (user) {
      await articleDb.articles.update(articleId, {
        userId: user.id,
        read: true,
        accessedAt: Date.now()
      })

      // Optimistically update SWR cache
      await mutate(key, (current: any[]) =>
        current?.map(a => a.id === articleId ? { ...a, read: true } : a),
        { revalidate: false }
      )
    }
  }

  // Bookmark article
  const bookmarkArticle = async (articleId: string) => {
    if (user) {
      await articleDb.articles.update(articleId, {
        userId: user.id,
        bookmarked: true
      })

      // Optimistically update SWR cache
      await mutate(key, (current: any[]) =>
        current?.map(a => a.id === articleId ? { ...a, bookmarked: true } : a),
        { revalidate: false }
      )
    }
  }

  return {
    articles: data,
    isLoading: !data && !error,
    isValidating,
    error,
    revalidate,
    prefetchNext,
    markAsRead,
    bookmarkArticle,

    // Cache stats
    cacheStats: {
      isOffline: !navigator.onLine,
      fromCache: !isValidating && data?.fromCache
    }
  }
}
```

## Phase 3: Service Worker & PWA (Week 3)

### 3.1 Advanced Service Worker

```typescript
// public/sw.ts
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { BackgroundSyncPlugin } from 'workbox-background-sync'

declare const self: ServiceWorkerGlobalScope

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST)

// API caching strategies
const apiCacheName = 'naly-api-v1'
const imageCacheName = 'naly-images-v1'

// Financial news API - Network first with quick timeout
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/news'),
  new NetworkFirst({
    cacheName: apiCacheName,
    networkTimeoutSeconds: 3, // Quick fallback to cache
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes for news
        purgeOnQuotaError: true
      })
    ]
  })
)

// Market data - Network only (too time-sensitive for caching)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/market-data'),
  new NetworkFirst({
    cacheName: 'market-data',
    networkTimeoutSeconds: 1, // Very quick timeout
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 // 1 minute max
      })
    ]
  })
)

// Article content - Stale while revalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/articles'),
  new StaleWhileRevalidate({
    cacheName: apiCacheName,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
        headers: {
          'X-Cache-Status': 'hit'
        }
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 60 // 30 minutes
      })
    ]
  })
)

// Images - Cache first
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: imageCacheName,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
      })
    ]
  })
)

// Background sync for offline actions
const bgSyncPlugin = new BackgroundSyncPlugin('naly-queue', {
  maxRetentionTime: 24 * 60 // Retry for 24 hours
})

// Handle offline article saves
registerRoute(
  /\/api\/articles\/save/,
  async ({ event }) => {
    try {
      const response = await fetch(event.request.clone())
      return response
    } catch (error) {
      // Queue for background sync
      await bgSyncPlugin.fetchDidFail({
        originalRequest: event.request,
        request: event.request.clone(),
        error: error as Error,
        event
      })

      // Return success to the app
      return new Response(
        JSON.stringify({
          queued: true,
          message: 'Article will be saved when online'
        }),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  },
  'POST'
)

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data?.type === 'CACHE_ARTICLES') {
    // Pre-cache articles for offline reading
    cacheArticles(event.data.articles)
  }

  if (event.data?.type === 'CLEAR_OLD_CACHE') {
    clearOldCache()
  }
})

// Pre-cache articles for offline
async function cacheArticles(articles: any[]) {
  const cache = await caches.open(apiCacheName)

  for (const article of articles) {
    const request = new Request(`/api/articles/${article.id}`)
    const response = new Response(JSON.stringify(article), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cached-At': new Date().toISOString()
      }
    })

    await cache.put(request, response)
  }
}

// Clear old cache entries
async function clearOldCache() {
  const cacheNames = await caches.keys()
  const oldCaches = cacheNames.filter(name =>
    name.startsWith('naly-') && !name.includes('-v1')
  )

  await Promise.all(oldCaches.map(name => caches.delete(name)))
}

// Listen for sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-articles') {
    event.waitUntil(syncArticles())
  }
})

async function syncArticles() {
  // Get queued actions from IndexedDB
  const db = await openDB('NalySync', 1)
  const tx = db.transaction('queue', 'readonly')
  const queue = await tx.objectStore('queue').getAll()

  for (const item of queue) {
    try {
      await fetch(item.request)

      // Remove from queue on success
      const deleteTx = db.transaction('queue', 'readwrite')
      await deleteTx.objectStore('queue').delete(item.id)
    } catch (error) {
      console.error('Sync failed for:', item, error)
    }
  }
}
```

### 3.2 Register Service Worker

```typescript
// src/app/layout.tsx
import { useEffect } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration)

          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000) // Every hour
        })
        .catch((error) => {
          console.error('SW registration failed:', error)
        })
    }
  }, [])

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

## Phase 4: Performance Optimization (Week 4)

### 4.1 Compression Utilities

```typescript
// src/lib/cache/utils/compression.ts
import { compress, decompress } from 'lz-string'

export function compressData(data: any): string {
  if (typeof data === 'string') {
    return compress(data)
  }
  return compress(JSON.stringify(data))
}

export function decompressData(compressed: string): any {
  const decompressed = decompress(compressed)

  try {
    return JSON.parse(decompressed)
  } catch {
    return decompressed
  }
}

// Size-aware compression
export function smartCompress(data: any, threshold = 1024): any {
  const str = typeof data === 'string' ? data : JSON.stringify(data)

  if (str.length < threshold) {
    return data // Don't compress small data
  }

  return {
    _compressed: true,
    data: compress(str)
  }
}

export function smartDecompress(data: any): any {
  if (data?._compressed) {
    const decompressed = decompress(data.data)

    try {
      return JSON.parse(decompressed)
    } catch {
      return decompressed
    }
  }

  return data
}
```

### 4.2 Cache Metrics Dashboard

```typescript
// src/components/CacheMetrics.tsx
'use client'

import { useEffect, useState } from 'react'
import { articleDb } from '@/lib/cache/db/ArticleDatabase'

export function CacheMetrics() {
  const [metrics, setMetrics] = useState({
    articleCount: 0,
    totalSize: 0,
    hitRate: 0,
    storageUsage: { used: 0, total: 0 }
  })

  useEffect(() => {
    const updateMetrics = async () => {
      const articles = await articleDb.articles.count()
      const usage = await articleDb.getStorageUsage()

      // Get hit rate from localStorage metrics
      const storedMetrics = localStorage.getItem('naly_cache_metrics')
      const { hits = 0, misses = 0 } = storedMetrics
        ? JSON.parse(storedMetrics)
        : {}

      const hitRate = hits + misses > 0
        ? (hits / (hits + misses)) * 100
        : 0

      setMetrics({
        articleCount: articles,
        totalSize: usage.used,
        hitRate,
        storageUsage: usage
      })
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)

    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (process.env.NODE_ENV !== 'development') {
    return null // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm">
      <h3 className="font-bold mb-2">Cache Metrics</h3>
      <div className="space-y-1">
        <div>Articles: {metrics.articleCount}</div>
        <div>Size: {formatBytes(metrics.totalSize)}</div>
        <div>Hit Rate: {metrics.hitRate.toFixed(1)}%</div>
        <div>
          Storage: {formatBytes(metrics.storageUsage.used)} /
          {formatBytes(metrics.storageUsage.total)}
        </div>
        <div>Status: {navigator.onLine ? '🟢 Online' : '🔴 Offline'}</div>
      </div>

      <button
        onClick={async () => {
          await articleDb.clearExpiredCache()
          alert('Expired cache cleared')
        }}
        className="mt-2 px-2 py-1 bg-red-600 rounded text-xs"
      >
        Clear Expired
      </button>
    </div>
  )
}
```

## Implementation Checklist

### Week 1: Foundation ✅
- [ ] Install dependencies
- [ ] Set up cache configuration
- [ ] Implement SWR cache provider
- [ ] Create IndexedDB schema
- [ ] Basic cache operations

### Week 2: Enhanced Fetching ✅
- [ ] Update NewsService with caching
- [ ] Implement ETag support
- [ ] Create cached hooks
- [ ] Add prefetching logic
- [ ] Offline fallback

### Week 3: Service Worker ✅
- [ ] Implement service worker
- [ ] Configure caching strategies
- [ ] Add background sync
- [ ] PWA manifest
- [ ] Offline page

### Week 4: Optimization ✅
- [ ] Add compression
- [ ] Implement metrics
- [ ] Performance monitoring
- [ ] Cache cleanup strategies
- [ ] Testing & debugging

## Performance Targets

| Metric | Current | Target | Achieved |
|--------|---------|--------|----------|
| First Load | 3-5s | <2s | ⏳ |
| Subsequent Load | 2-3s | <500ms | ⏳ |
| Offline Load | N/A | <1s | ⏳ |
| Cache Hit Rate | 0% | >80% | ⏳ |
| Storage Usage | N/A | <100MB | ⏳ |

## Testing Strategy

### Unit Tests
```typescript
// __tests__/cache/articleDb.test.ts
import { articleDb } from '@/lib/cache/db/ArticleDatabase'

describe('ArticleDatabase', () => {
  beforeEach(async () => {
    await articleDb.articles.clear()
  })

  test('should cache and retrieve article', async () => {
    const article = {
      id: 'test-1',
      url: 'https://example.com/article',
      title: 'Test Article',
      content: 'Content',
      // ... other fields
    }

    await articleDb.cacheArticle(article)
    const retrieved = await articleDb.getCachedArticle('test-1')

    expect(retrieved?.title).toBe('Test Article')
  })

  test('should expire old articles', async () => {
    const article = {
      id: 'test-2',
      ttl: 100, // 100ms TTL
      // ... other fields
    }

    await articleDb.cacheArticle(article)
    await new Promise(resolve => setTimeout(resolve, 150))

    const retrieved = await articleDb.getCachedArticle('test-2')
    expect(retrieved).toBeUndefined()
  })
})
```

### E2E Tests
```typescript
// e2e/offline.spec.ts
import { test, expect } from '@playwright/test'

test('should work offline', async ({ page, context }) => {
  // Load page online
  await page.goto('/news')
  await expect(page.locator('.article')).toHaveCount(10)

  // Go offline
  await context.setOffline(true)

  // Reload page
  await page.reload()

  // Should still show articles from cache
  await expect(page.locator('.article')).toHaveCount(10)
  await expect(page.locator('.offline-indicator')).toBeVisible()
})
```

## Monitoring & Analytics

```typescript
// src/lib/cache/analytics.ts
export class CacheAnalytics {
  private events: any[] = []

  track(event: string, data: any) {
    this.events.push({
      event,
      data,
      timestamp: Date.now()
    })

    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', event, data)
    }

    // Store locally for offline
    this.storeOffline()
  }

  private storeOffline() {
    localStorage.setItem(
      'naly_cache_analytics',
      JSON.stringify(this.events.slice(-100))
    )
  }

  async flush() {
    // Send stored events when online
    if (navigator.onLine && this.events.length > 0) {
      await fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify(this.events)
      })

      this.events = []
    }
  }
}
```

## Migration Path

### Step 1: Deploy cache infrastructure (No breaking changes)
### Step 2: Update components to use cached hooks
### Step 3: Enable service worker in production
### Step 4: Monitor and optimize based on metrics
### Step 5: Gradual rollout with feature flags

## Rollback Plan

1. Disable service worker: Remove registration
2. Fallback to direct API: Use original hooks
3. Clear IndexedDB: Run cleanup script
4. Restore original NewsService

## Success Metrics

- 50% reduction in API calls
- 80% cache hit rate for returning users
- <1s load time for cached content
- 100% offline availability for recent articles
- <100MB average storage usage

## Support & Maintenance

- Weekly cache metrics review
- Monthly performance audits
- Automated cache cleanup (daily)
- User feedback monitoring
- A/B testing cache strategies