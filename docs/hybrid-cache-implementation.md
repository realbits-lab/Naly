# Hybrid Cache Implementation for News Reading Application

## Executive Summary

This document outlines a comprehensive hybrid caching strategy for news reading applications, combining multiple caching layers to provide optimal performance, offline capabilities, and fresh content delivery. The implementation leverages SWR (Stale-While-Revalidate) for React state management, localStorage for quick persistence, IndexedDB for structured data storage, and HTTP caching with ETags for server-side optimization.

## Architecture Overview

```
┌─────────────────┐
│   Application   │
│      (SWR)      │
└────────┬────────┘
         │
┌────────▼────────┐
│  Memory Cache   │ ◄── Level 1: In-memory (fastest)
└────────┬────────┘
         │
┌────────▼────────┐
│  localStorage   │ ◄── Level 2: Synchronous storage
└────────┬────────┘
         │
┌────────▼────────┐
│   IndexedDB     │ ◄── Level 3: Async structured storage
└────────┬────────┘
         │
┌────────▼────────┐
│  HTTP Cache     │ ◄── Level 4: Browser HTTP cache
│    (ETags)      │
└────────┬────────┘
         │
┌────────▼────────┐
│   CDN/Server    │ ◄── Level 5: Origin server
└─────────────────┘
```

## Implementation Strategy

### 1. SWR Configuration with Custom Cache Provider

```typescript
// lib/cache/swrCacheProvider.ts
import { Cache, State } from 'swr'

const CACHE_KEY = 'naly_swr_cache'
const CACHE_VERSION = 1
const MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface CacheEntry {
  data: any
  timestamp: number
  etag?: string
  ttl?: number
}

export function createHybridCacheProvider(): Cache<any> {
  // Initialize with localStorage data if available
  let map: Map<string, State<any, any>>

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CACHE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.version === CACHE_VERSION) {
          map = new Map(parsed.entries)
        } else {
          map = new Map()
          localStorage.removeItem(CACHE_KEY)
        }
      } else {
        map = new Map()
      }
    } catch {
      map = new Map()
    }
  } else {
    // Server-side rendering
    return new Map()
  }

  // Periodic localStorage sync (debounced)
  let syncTimeout: NodeJS.Timeout | null = null
  const syncToLocalStorage = () => {
    if (syncTimeout) clearTimeout(syncTimeout)

    syncTimeout = setTimeout(() => {
      try {
        const entries = Array.from(map.entries())
        const serialized = JSON.stringify({
          version: CACHE_VERSION,
          entries: entries.slice(-100), // Keep last 100 entries
          timestamp: Date.now()
        })

        if (serialized.length < MAX_CACHE_SIZE) {
          localStorage.setItem(CACHE_KEY, serialized)
        }
      } catch (e) {
        console.warn('Failed to sync cache to localStorage:', e)
      }
    }, 1000)
  }

  // Handle tab close
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      syncToLocalStorage()
    })

    // Cross-tab synchronization
    window.addEventListener('storage', (e) => {
      if (e.key === CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed.version === CACHE_VERSION) {
            map = new Map(parsed.entries)
          }
        } catch {}
      }
    })
  }

  // Return cache with auto-sync
  const cache: Cache<any> = map as any
  const originalSet = cache.set

  cache.set = function(key: string, value: State<any, any>) {
    originalSet.call(this, key, value)
    syncToLocalStorage()
  }

  return cache
}
```

### 2. IndexedDB Integration for Structured Data

```typescript
// lib/cache/indexedDBCache.ts
import Dexie, { Table } from 'dexie'

interface NewsArticle {
  id: string
  title: string
  content: string
  publishedAt: Date
  etag?: string
  cachedAt: number
  category?: string
  author?: string
  imageUrl?: string
  readTime?: number
}

interface CacheMetadata {
  key: string
  size: number
  accessedAt: number
  expiresAt?: number
}

class NewsDatabase extends Dexie {
  articles!: Table<NewsArticle>
  metadata!: Table<CacheMetadata>

  constructor() {
    super('NalyNewsCache')

    this.version(1).stores({
      articles: 'id, category, publishedAt, cachedAt',
      metadata: 'key, accessedAt, expiresAt'
    })
  }

  async cacheArticle(article: NewsArticle): Promise<void> {
    const now = Date.now()
    await this.articles.put({
      ...article,
      cachedAt: now
    })

    await this.metadata.put({
      key: `article:${article.id}`,
      size: new Blob([JSON.stringify(article)]).size,
      accessedAt: now,
      expiresAt: now + (7 * 24 * 60 * 60 * 1000) // 7 days
    })

    // Cleanup old entries
    await this.cleanupOldEntries()
  }

  async getArticle(id: string): Promise<NewsArticle | undefined> {
    const article = await this.articles.get(id)
    if (article) {
      await this.metadata.update(`article:${id}`, {
        accessedAt: Date.now()
      })
    }
    return article
  }

  async cleanupOldEntries(): Promise<void> {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const now = Date.now()

    // Remove expired entries
    const expired = await this.metadata
      .where('expiresAt')
      .below(now)
      .toArray()

    for (const item of expired) {
      const [type, id] = item.key.split(':')
      if (type === 'article') {
        await this.articles.delete(id)
      }
      await this.metadata.delete(item.key)
    }

    // Check total size
    const allMetadata = await this.metadata.toArray()
    const totalSize = allMetadata.reduce((sum, item) => sum + item.size, 0)

    if (totalSize > maxSize) {
      // Remove least recently accessed
      const sorted = allMetadata.sort((a, b) => a.accessedAt - b.accessedAt)
      let currentSize = totalSize

      for (const item of sorted) {
        if (currentSize <= maxSize * 0.8) break

        const [type, id] = item.key.split(':')
        if (type === 'article') {
          await this.articles.delete(id)
        }
        await this.metadata.delete(item.key)
        currentSize -= item.size
      }
    }
  }
}

export const db = new NewsDatabase()
```

### 3. HTTP Cache with ETags Implementation

```typescript
// lib/cache/httpCache.ts
interface ETagCache {
  url: string
  etag: string
  lastModified?: string
  data: any
  timestamp: number
}

const etagStore = new Map<string, ETagCache>()

export async function fetchWithETag<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T; fromCache: boolean }> {
  const cached = etagStore.get(url)

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
      cache: options.method === 'GET' ? 'default' : 'no-cache'
    })

    // Handle 304 Not Modified
    if (response.status === 304 && cached) {
      return {
        data: cached.data,
        fromCache: true
      }
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Store new ETag and data
    const etag = response.headers.get('ETag')
    const lastModified = response.headers.get('Last-Modified')

    if (etag || lastModified) {
      etagStore.set(url, {
        url,
        etag: etag || '',
        lastModified: lastModified || '',
        data,
        timestamp: Date.now()
      })
    }

    return {
      data,
      fromCache: false
    }
  } catch (error) {
    // Return cached data on network error if available
    if (cached) {
      console.warn('Network error, returning cached data:', error)
      return {
        data: cached.data,
        fromCache: true
      }
    }
    throw error
  }
}

// Cleanup old entries periodically
setInterval(() => {
  const maxAge = 60 * 60 * 1000 // 1 hour
  const now = Date.now()

  for (const [url, cache] of etagStore.entries()) {
    if (now - cache.timestamp > maxAge) {
      etagStore.delete(url)
    }
  }
}, 5 * 60 * 1000) // Every 5 minutes
```

### 4. SWR Hooks with Hybrid Cache

```typescript
// hooks/useNewsArticles.ts
import useSWR, { SWRConfiguration } from 'swr'
import { db } from '@/lib/cache/indexedDBCache'
import { fetchWithETag } from '@/lib/cache/httpCache'

interface NewsListParams {
  category?: string
  page?: number
  limit?: number
}

export function useNewsArticles(params: NewsListParams = {}) {
  const key = `/api/news?${new URLSearchParams(params as any).toString()}`

  const fetcher = async (url: string) => {
    // Try IndexedDB first for offline support
    if (!navigator.onLine) {
      const cached = await db.articles
        .where('category')
        .equals(params.category || 'all')
        .reverse()
        .sortBy('publishedAt')

      if (cached.length > 0) {
        return { articles: cached, fromCache: true }
      }
    }

    // Fetch with ETag support
    const { data, fromCache } = await fetchWithETag<{
      articles: any[]
      totalCount: number
    }>(url)

    // Cache articles in IndexedDB for offline access
    if (!fromCache && data.articles) {
      await Promise.all(
        data.articles.map(article =>
          db.cacheArticle({
            ...article,
            category: params.category || 'all'
          })
        )
      )
    }

    return data
  }

  const config: SWRConfiguration = {
    fetcher,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    dedupingInterval: 2000,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    // Keep previous data while revalidating
    keepPreviousData: true,
    // Fallback to cached data
    fallbackData: undefined,
    // Revalidate even if stale
    revalidateIfStale: true,
    // Revalidate on mount
    revalidateOnMount: true,
    // Custom isOnline check
    isOnline: () => {
      // Custom online detection
      return navigator.onLine
    },
    // Custom isVisible check
    isVisible: () => {
      return document.visibilityState === 'visible'
    },
    // Error retry with exponential backoff
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      if (retryCount >= 3) return

      // Exponential backoff
      setTimeout(() => revalidate({ retryCount }),
        Math.min(1000 * Math.pow(2, retryCount), 30000)
      )
    },
    // Success callback
    onSuccess: (data) => {
      console.log('Articles loaded:', data.articles?.length)
    },
    // Loading slow callback
    onLoadingSlow: (key, config) => {
      console.warn('Loading is slow for:', key)
    }
  }

  return useSWR(key, config)
}

export function useNewsArticle(id: string) {
  const fetcher = async () => {
    // Check IndexedDB first
    const cached = await db.getArticle(id)
    if (cached && !navigator.onLine) {
      return cached
    }

    // Fetch with ETag
    const { data, fromCache } = await fetchWithETag<any>(
      `/api/news/${id}`
    )

    // Update cache if not from cache
    if (!fromCache) {
      await db.cacheArticle(data)
    }

    return data
  }

  return useSWR(`/api/news/${id}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    // Use cached data as fallback
    fallback: {
      [`/api/news/${id}`]: async () => {
        const cached = await db.getArticle(id)
        return cached
      }
    }
  })
}
```

### 5. Service Worker for Offline Support

```typescript
// public/service-worker.js
const CACHE_NAME = 'naly-news-v1'
const urlsToCache = [
  '/',
  '/offline',
  '/manifest.json'
]

// Network-first strategy for API calls
const API_CACHE_NAME = 'naly-api-v1'
const API_CACHE_MAX_AGE = 5 * 60 * 1000 // 5 minutes

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API calls - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone()

          caches.open(API_CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache)
            })

          return response
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then(response => {
              if (response) {
                // Check if cache is still fresh
                const cachedAt = response.headers.get('sw-cached-at')
                if (cachedAt) {
                  const age = Date.now() - parseInt(cachedAt)
                  if (age < API_CACHE_MAX_AGE) {
                    return response
                  }
                }
                return response // Return stale cache if no alternative
              }

              // Return offline response
              return new Response(JSON.stringify({
                error: 'Offline',
                message: 'No cached data available'
              }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              })
            })
        })
    )
    return
  }

  // Static assets - Cache first
  event.respondWith(
    caches.match(request)
      .then(response => response || fetch(request))
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-news') {
    event.waitUntil(syncNews())
  }
})

async function syncNews() {
  // Sync offline actions when back online
  const cache = await caches.open('offline-queue')
  const requests = await cache.keys()

  for (const request of requests) {
    try {
      const response = await fetch(request)
      if (response.ok) {
        await cache.delete(request)
      }
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }
}
```

### 6. Next.js App Configuration

```typescript
// app/providers.tsx
'use client'

import { SWRConfig } from 'swr'
import { createHybridCacheProvider } from '@/lib/cache/swrCacheProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: createHybridCacheProvider,
        // Global error handler
        onError: (error, key) => {
          console.error(`Error for ${key}:`, error)
          // Send to error tracking service
        },
        // Global success handler
        onSuccess: (data, key) => {
          // Track successful data fetches
        },
        // Offline detector
        isOnline: () => {
          if (typeof window !== 'undefined') {
            return window.navigator.onLine
          }
          return true
        },
        // Visibility detector
        isVisible: () => {
          if (typeof document !== 'undefined') {
            return document.visibilityState === 'visible'
          }
          return true
        },
        // Default options
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: true,
        dedupingInterval: 2000,
        focusThrottleInterval: 5000,
        errorRetryInterval: 5000,
        errorRetryCount: 3
      }}
    >
      {children}
    </SWRConfig>
  )
}
```

### 7. API Route with ETag Support

```typescript
// app/api/news/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ifNoneMatch = request.headers.get('If-None-Match')
  const ifModifiedSince = request.headers.get('If-Modified-Since')

  // Fetch article from database
  const article = await getArticleFromDatabase(params.id)

  if (!article) {
    return NextResponse.json(
      { error: 'Article not found' },
      { status: 404 }
    )
  }

  // Generate ETag
  const etag = crypto
    .createHash('md5')
    .update(JSON.stringify(article))
    .digest('hex')

  const etagValue = `"${etag}"`

  // Check if client has current version
  if (ifNoneMatch === etagValue) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        'ETag': etagValue,
        'Cache-Control': 'private, must-revalidate, max-age=300'
      }
    })
  }

  // Check if-modified-since
  if (ifModifiedSince && article.updatedAt) {
    const modifiedSince = new Date(ifModifiedSince)
    const lastModified = new Date(article.updatedAt)

    if (lastModified <= modifiedSince) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Last-Modified': lastModified.toUTCString(),
          'Cache-Control': 'private, must-revalidate, max-age=300'
        }
      })
    }
  }

  // Return article with cache headers
  return NextResponse.json(article, {
    headers: {
      'ETag': etagValue,
      'Last-Modified': new Date(article.updatedAt).toUTCString(),
      'Cache-Control': 'private, must-revalidate, max-age=300',
      // CORS headers if needed
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'ETag, Last-Modified'
    }
  })
}
```

## Performance Optimizations

### 1. Lazy Loading and Code Splitting

```typescript
// components/NewsArticle.tsx
import { lazy, Suspense } from 'react'

const ArticleContent = lazy(() => import('./ArticleContent'))

export function NewsArticle({ id }: { id: string }) {
  const { data, error, isValidating } = useNewsArticle(id)

  if (error) return <ErrorDisplay error={error} />
  if (!data && isValidating) return <ArticleSkeleton />

  return (
    <Suspense fallback={<ContentLoader />}>
      <ArticleContent article={data} />
    </Suspense>
  )
}
```

### 2. Prefetching

```typescript
// hooks/usePrefetchNews.ts
import { mutate } from 'swr'
import { fetchWithETag } from '@/lib/cache/httpCache'

export function usePrefetchNews() {
  const prefetch = async (category: string) => {
    const url = `/api/news?category=${category}`
    const { data } = await fetchWithETag(url)

    // Populate SWR cache
    mutate(url, data, {
      revalidate: false
    })
  }

  return { prefetch }
}
```

### 3. Optimistic Updates

```typescript
// hooks/useMarkAsRead.ts
import useSWRMutation from 'swr/mutation'
import { db } from '@/lib/cache/indexedDBCache'

export function useMarkAsRead(articleId: string) {
  return useSWRMutation(
    `/api/news/${articleId}/read`,
    async (url) => {
      // Optimistic update in IndexedDB
      const article = await db.getArticle(articleId)
      if (article) {
        article.read = true
        await db.cacheArticle(article)
      }

      // Send to server
      const response = await fetch(url, {
        method: 'POST'
      })

      if (!response.ok) {
        // Rollback on error
        if (article) {
          article.read = false
          await db.cacheArticle(article)
        }
        throw new Error('Failed to mark as read')
      }

      return response.json()
    },
    {
      optimisticData: (current) => ({
        ...current,
        read: true
      }),
      rollbackOnError: true
    }
  )
}
```

## Monitoring and Analytics

```typescript
// lib/cache/cacheMetrics.ts
interface CacheMetrics {
  hits: number
  misses: number
  errors: number
  size: number
  latency: number[]
}

class CacheMonitor {
  private metrics: Map<string, CacheMetrics> = new Map()

  recordHit(key: string, latency: number) {
    const metric = this.getOrCreate(key)
    metric.hits++
    metric.latency.push(latency)
    this.trim(metric)
  }

  recordMiss(key: string) {
    const metric = this.getOrCreate(key)
    metric.misses++
  }

  recordError(key: string) {
    const metric = this.getOrCreate(key)
    metric.errors++
  }

  private getOrCreate(key: string): CacheMetrics {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        hits: 0,
        misses: 0,
        errors: 0,
        size: 0,
        latency: []
      })
    }
    return this.metrics.get(key)!
  }

  private trim(metric: CacheMetrics) {
    // Keep last 100 latency measurements
    if (metric.latency.length > 100) {
      metric.latency = metric.latency.slice(-100)
    }
  }

  getStats() {
    const stats: Record<string, any> = {}

    for (const [key, metric] of this.metrics) {
      const hitRate = metric.hits / (metric.hits + metric.misses) || 0
      const avgLatency = metric.latency.reduce((a, b) => a + b, 0) /
                        metric.latency.length || 0

      stats[key] = {
        hitRate: `${(hitRate * 100).toFixed(2)}%`,
        avgLatency: `${avgLatency.toFixed(2)}ms`,
        errors: metric.errors
      }
    }

    return stats
  }
}

export const cacheMonitor = new CacheMonitor()
```

## Testing Strategy

```typescript
// __tests__/cache.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { useNewsArticles } from '@/hooks/useNewsArticles'

describe('Hybrid Cache', () => {
  test('should return cached data while revalidating', async () => {
    const wrapper = ({ children }) => (
      <SWRConfig
        value={{
          provider: () => new Map([
            ['/api/news', { data: { articles: [] } }]
          ])
        }}
      >
        {children}
      </SWRConfig>
    )

    const { result } = renderHook(() => useNewsArticles(), { wrapper })

    // Should return cached data immediately
    expect(result.current.data).toEqual({ articles: [] })
    expect(result.current.isValidating).toBe(true)

    // Wait for revalidation
    await waitFor(() => {
      expect(result.current.isValidating).toBe(false)
    })
  })

  test('should handle offline mode', async () => {
    // Mock offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    })

    const { result } = renderHook(() => useNewsArticles())

    await waitFor(() => {
      expect(result.current.data?.fromCache).toBe(true)
    })
  })
})
```

## Migration Guide

### Step 1: Install Dependencies
```bash
pnpm add swr dexie
pnpm add -D @types/node
```

### Step 2: Setup Cache Provider
1. Create the cache provider files in `lib/cache/`
2. Wrap your app with the SWR provider
3. Register the service worker

### Step 3: Migrate API Routes
1. Add ETag headers to API responses
2. Handle conditional requests (304 responses)
3. Set appropriate Cache-Control headers

### Step 4: Update Components
1. Replace fetch calls with SWR hooks
2. Add loading and error states
3. Implement offline UI feedback

### Step 5: Monitor and Optimize
1. Set up cache metrics collection
2. Monitor cache hit rates
3. Adjust TTL and cache sizes based on usage

## Best Practices

1. **Cache Invalidation**: Use SWR's mutate for precise cache updates
2. **Storage Limits**: Implement cleanup strategies for IndexedDB
3. **Security**: Never cache sensitive data in localStorage
4. **Performance**: Use Web Workers for heavy cache operations
5. **Monitoring**: Track cache performance metrics
6. **Testing**: Test offline scenarios and cache invalidation
7. **Documentation**: Document cache TTLs and strategies

## Troubleshooting

### Common Issues

1. **localStorage Quota Exceeded**
   - Solution: Implement size limits and cleanup
   - Use IndexedDB for larger datasets

2. **Stale Data After Updates**
   - Solution: Implement proper cache invalidation
   - Use mutate after mutations

3. **Memory Leaks**
   - Solution: Clean up event listeners
   - Implement proper cache eviction

4. **Cross-Tab Sync Issues**
   - Solution: Use BroadcastChannel API
   - Implement storage event handlers

## Conclusion

This hybrid caching implementation provides:
- ✅ Instant data access from memory cache
- ✅ Persistent storage across sessions
- ✅ Offline support with IndexedDB
- ✅ Bandwidth optimization with ETags
- ✅ Automatic revalidation with SWR
- ✅ Cross-tab synchronization
- ✅ Progressive enhancement

The strategy ensures optimal performance while maintaining data freshness, providing an excellent user experience for news reading applications even in challenging network conditions.