/**
 * Main hook for cached articles with hybrid cache strategy
 * Integrates SWR, IndexedDB, and HTTP caching
 */

import useSWR, { SWRConfiguration, mutate } from 'swr'
import { articleDb, CachedArticle } from '../db/ArticleDatabase'
import { fetchWithETag } from '../http/etagCache'
import { CACHE_CONFIG, getCacheStrategy, isMarketOpen } from '../config'
import { useState, useCallback, useEffect, useRef } from 'react'

interface Article {
  id: string
  title: string
  summary?: string
  content?: string
  createdAt: string
  sourcePublisher?: string
  sourceCategory?: string
  sentiment?: string
  readingTime?: number
  tickers?: string[]
  marketImpact?: string
}

interface UseCachedArticlesOptions {
  category?: string
  ticker?: string
  sentiment?: string
  limit?: number
  offset?: number
  cacheFirst?: boolean
  refreshInterval?: number | false
  prefetchNext?: boolean
  enableOffline?: boolean
}

interface UseCachedArticlesReturn {
  articles: Article[] | undefined
  isLoading: boolean
  isValidating: boolean
  error: any
  mutate: () => Promise<void>

  // Cache state
  isOffline: boolean
  fromCache: boolean
  cacheAge?: number

  // Actions
  refresh: () => Promise<void>
  prefetchMore: () => Promise<void>
  markAsRead: (articleId: string) => Promise<void>
  bookmarkArticle: (articleId: string) => Promise<void>
  searchArticles: (query: string) => Promise<Article[]>

  // Metrics
  cacheStats: {
    hitRate: number
    storageUsed: number
    articlesCount: number
  }
}

export function useCachedArticles(options: UseCachedArticlesOptions = {}): UseCachedArticlesReturn {
  const {
    category,
    ticker,
    sentiment,
    limit = 100,
    offset = 0,
    cacheFirst = true,
    refreshInterval = isMarketOpen() ? 60000 : 300000, // 1min market hours, 5min otherwise
    prefetchNext = true,
    enableOffline = true
  } = options

  // State
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [fromCache, setFromCache] = useState(false)
  const [cacheAge, setCacheAge] = useState<number>()
  const [cacheStats, setCacheStats] = useState({
    hitRate: 0,
    storageUsed: 0,
    articlesCount: 0
  })

  const abortControllerRef = useRef<AbortController>()

  // Build cache key
  const key = [
    '/api/articles',
    `limit=${limit}`,
    `offset=${offset}`,
    category && `category=${category}`,
    ticker && `ticker=${ticker}`,
    sentiment && `sentiment=${sentiment}`
  ].filter(Boolean).join('&')

  // Fetcher with hybrid cache strategy
  const fetcher = async (url: string): Promise<Article[]> => {
    const strategy = getCacheStrategy(category || 'regular')

    // Check offline status
    if (!navigator.onLine && enableOffline) {
      console.log('📱 Offline mode - using cached articles')
      setIsOffline(true)
      setFromCache(true)

      // Get from IndexedDB
      const cached = await articleDb.getArticles({
        category,
        ticker,
        sentiment,
        limit,
        offset
      })

      if (cached.length > 0) {
        const age = Math.min(...cached.map(a => Date.now() - a.cachedAt))
        setCacheAge(age)
        return convertCachedToArticles(cached)
      }

      throw new Error('No cached data available offline')
    }

    setIsOffline(false)

    // Implement cache strategies
    switch (strategy) {
      case CACHE_CONFIG.STRATEGIES.CACHE_FIRST:
        return await cacheFirstStrategy(url)

      case CACHE_CONFIG.STRATEGIES.NETWORK_FIRST:
        return await networkFirstStrategy(url)

      case CACHE_CONFIG.STRATEGIES.STALE_WHILE_REVALIDATE:
        return await staleWhileRevalidateStrategy(url)

      case CACHE_CONFIG.STRATEGIES.NETWORK_ONLY:
        return await networkOnlyStrategy(url)

      default:
        return await networkFirstStrategy(url)
    }
  }

  // Cache-first strategy
  const cacheFirstStrategy = async (url: string): Promise<Article[]> => {
    // Try IndexedDB first
    const cached = await articleDb.getArticles({
      category,
      ticker,
      sentiment,
      limit,
      offset
    })

    if (cached.length > 0) {
      const age = Math.min(...cached.map(a => Date.now() - a.cachedAt))
      const maxAge = CACHE_CONFIG.TTL.REGULAR_NEWS

      if (age < maxAge) {
        console.log('✅ Cache hit (IndexedDB)')
        setFromCache(true)
        setCacheAge(age)
        return convertCachedToArticles(cached)
      }
    }

    // Fallback to network
    return networkFetch(url)
  }

  // Network-first strategy
  const networkFirstStrategy = async (url: string): Promise<Article[]> => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      const result = await networkFetch(url, {
        signal: abortControllerRef.current.signal,
        timeout: 3000 // Quick timeout for network-first
      })

      return result

    } catch (error) {
      console.warn('Network failed, trying cache:', error)

      // Fallback to cache
      const cached = await articleDb.getArticles({
        category,
        ticker,
        sentiment,
        limit,
        offset
      })

      if (cached.length > 0) {
        setFromCache(true)
        setCacheAge(Math.min(...cached.map(a => Date.now() - a.cachedAt)))
        return convertCachedToArticles(cached)
      }

      throw error
    }
  }

  // Stale-while-revalidate strategy
  const staleWhileRevalidateStrategy = async (url: string): Promise<Article[]> => {
    // Get from cache immediately
    const cached = await articleDb.getArticles({
      category,
      ticker,
      sentiment,
      limit,
      offset
    })

    if (cached.length > 0) {
      const age = Math.min(...cached.map(a => Date.now() - a.cachedAt))
      console.log('📦 Returning stale cache, revalidating...')
      setFromCache(true)
      setCacheAge(age)

      // Revalidate in background
      networkFetch(url).then(fresh => {
        mutate(key, fresh, { revalidate: false })
      }).catch(error => {
        console.warn('Background revalidation failed:', error)
      })

      return convertCachedToArticles(cached)
    }

    // No cache, fetch from network
    return networkFetch(url)
  }

  // Network-only strategy
  const networkOnlyStrategy = async (url: string): Promise<Article[]> => {
    return networkFetch(url)
  }

  // Network fetch with ETag support
  const networkFetch = async (url: string, options: any = {}): Promise<Article[]> => {
    const { data, fromCache: httpCache, age } = await fetchWithETag<{
      articles: Article[]
      totalCount: number
    }>(url, {
      signal: options.signal,
      // Add timeout using AbortSignal.timeout if available
      ...(options.timeout && AbortSignal.timeout
        ? { signal: AbortSignal.timeout(options.timeout) }
        : {})
    })

    if (!httpCache && data.articles) {
      // Fresh data, cache it
      await cacheArticles(data.articles)
      setFromCache(false)
      setCacheAge(0)
    } else if (httpCache) {
      console.log('✅ HTTP cache hit (304)')
      setFromCache(true)
      setCacheAge(age)
    }

    return data.articles || []
  }

  // Cache articles in IndexedDB
  const cacheArticles = async (articles: Article[]): Promise<void> => {
    const promises = articles.map(article => {
      const cached: Partial<CachedArticle> = {
        id: article.id,
        title: article.title,
        summary: article.summary,
        content: article.content,
        createdAt: article.createdAt,
        publishedAt: article.createdAt,
        sourcePublisher: article.sourcePublisher,
        sourceCategory: article.sourceCategory,
        sentiment: article.sentiment as any,
        readingTime: article.readingTime,
        tickers: article.tickers
      }

      return articleDb.cacheArticle(cached)
    })

    await Promise.allSettled(promises)
  }

  // Convert cached articles to API format
  const convertCachedToArticles = (cached: CachedArticle[]): Article[] => {
    return cached.map(c => ({
      id: c.id,
      title: c.title,
      summary: c.summary,
      content: c.aiContent || c.content,
      createdAt: c.createdAt || c.publishedAt,
      sourcePublisher: c.sourcePublisher,
      sourceCategory: c.sourceCategory,
      sentiment: c.sentiment,
      readingTime: c.readingTime,
      tickers: c.tickers,
      marketImpact: c.marketImpact
    }))
  }

  // SWR configuration
  const swrConfig: SWRConfiguration = {
    fetcher,
    refreshInterval: refreshInterval || undefined,
    revalidateOnFocus: isMarketOpen(),
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    keepPreviousData: true,

    // Fallback for initial data
    fallbackData: undefined,

    // Custom online check
    isOnline: () => navigator.onLine,

    // Custom visibility check
    isVisible: () => document.visibilityState === 'visible',

    // Error retry with exponential backoff
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Don't retry if offline
      if (!navigator.onLine) return

      // Don't retry on 4xx errors
      if (error.status >= 400 && error.status < 500) return

      // Exponential backoff
      if (retryCount >= 3) return

      setTimeout(
        () => revalidate({ retryCount }),
        Math.min(1000 * Math.pow(2, retryCount), 30000)
      )
    },

    // Success callback
    onSuccess: (data) => {
      console.log(`✅ Articles loaded: ${data?.length || 0}`)
      updateCacheStats()
    },

    // Loading slow callback
    onLoadingSlow: (key, config) => {
      console.warn('⚠️ Loading is slow for:', key)
    }
  }

  // Use SWR hook
  const { data, error, isValidating, mutate: swrMutate } = useSWR(key, swrConfig)

  // Update cache stats periodically
  const updateCacheStats = useCallback(async () => {
    const stats = await articleDb.getStats()
    setCacheStats({
      hitRate: (stats as any).hitRate || 0,
      storageUsed: (stats as any).storageUsed || 0,
      articlesCount: (stats as any).articleCount || 0
    })
  }, [])

  // Prefetch more articles
  const prefetchMore = useCallback(async () => {
    if (!prefetchNext) return

    const nextKey = key.replace(`offset=${offset}`, `offset=${offset + limit}`)
    const nextData = await fetcher(nextKey)

    // Cache for later use
    mutate(nextKey, nextData, { revalidate: false })
  }, [key, offset, limit, prefetchNext])

  // Mark article as read
  const markAsRead = useCallback(async (articleId: string) => {
    const article = await articleDb.getCachedArticle(articleId)
    if (article) {
      article.read = true
      await articleDb.cacheArticle(article)

      // Update SWR cache optimistically
      await swrMutate((current: Article[] | undefined) => {
        if (!current) return current
        return current.map(a =>
          a.id === articleId ? { ...a, read: true } : a
        )
      }, { revalidate: false })
    }
  }, [swrMutate])

  // Bookmark article
  const bookmarkArticle = useCallback(async (articleId: string) => {
    const article = await articleDb.getCachedArticle(articleId)
    if (article) {
      article.bookmarked = !article.bookmarked
      await articleDb.cacheArticle(article)

      // Update SWR cache optimistically
      await swrMutate((current: Article[] | undefined) => {
        if (!current) return current
        return current.map(a =>
          a.id === articleId ? { ...a, bookmarked: !article.bookmarked } : a
        )
      }, { revalidate: false })
    }
  }, [swrMutate])

  // Search articles
  const searchArticles = useCallback(async (query: string): Promise<Article[]> => {
    const results = await articleDb.searchArticles(query)
    return convertCachedToArticles(results)
  }, [])

  // Refresh data
  const refresh = useCallback(async () => {
    await swrMutate()
  }, [swrMutate])

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      refresh() // Refresh when coming online
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refresh])

  // Prefetch on mount if enabled
  useEffect(() => {
    if (prefetchNext && data) {
      prefetchMore()
    }
  }, [data, prefetchNext, prefetchMore])

  // Update stats periodically
  useEffect(() => {
    updateCacheStats()
    const interval = setInterval(updateCacheStats, 10000)
    return () => clearInterval(interval)
  }, [updateCacheStats])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    articles: data,
    isLoading: !error && !data,
    isValidating,
    error,
    mutate: refresh,

    // Cache state
    isOffline,
    fromCache,
    cacheAge,

    // Actions
    refresh,
    prefetchMore,
    markAsRead,
    bookmarkArticle,
    searchArticles,

    // Metrics
    cacheStats
  }
}