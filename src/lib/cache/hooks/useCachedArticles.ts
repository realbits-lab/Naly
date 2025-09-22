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
  marketAnalysis?: string
  investmentImplications?: string
  createdAt: string
  sourceTitle?: string
  sourcePublisher?: string
  sourceCategory?: string
  sentiment?: string
  readingTime?: number
  keywords?: string[]
  entities?: any[]
  wordCount?: number
  aiModel?: string
  keyPoints?: string
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
  const [isOffline, setIsOffline] = useState(typeof window !== 'undefined' ? !navigator.onLine : false)
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
    console.log('\n🔄 [Cache] === NEW FETCH REQUEST ===')
    console.log('📊 [Cache] Request details:', {
      url,
      strategy,
      category: category || 'regular',
      limit,
      offset,
      online: typeof window !== 'undefined' ? navigator.onLine : true,
      timestamp: new Date().toISOString()
    })

    // Check offline status
    if (typeof window !== 'undefined' && !navigator.onLine && enableOffline) {
      console.log('📱 [Cache] OFFLINE MODE - attempting cached retrieval')
      setIsOffline(true)
      setFromCache(true)

      // Get from IndexedDB
      console.log('💾 [Cache] Querying IndexedDB for offline articles...')
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
        console.log('✅ [Cache] Found offline articles:', {
          count: cached.length,
          age: `${Math.round(age / 1000)}s`,
          titles: cached.slice(0, 3).map(a => a.title)
        })
        return convertCachedToArticles(cached)
      }

      console.log('❌ [Cache] No offline data available')
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
    console.log('📦 [Cache] Using CACHE-FIRST strategy')
    // Try IndexedDB first
    console.log('💾 [Cache] Checking IndexedDB...')
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

      console.log('🔍 [Cache] Found cached articles:', {
        count: cached.length,
        age: `${Math.round(age / 1000)}s`,
        maxAge: `${Math.round(maxAge / 1000)}s`,
        isStale: age >= maxAge
      })

      if (age < maxAge) {
        console.log('✅ [Cache HIT] Using fresh IndexedDB cache')
        setFromCache(true)
        setCacheAge(age)
        return convertCachedToArticles(cached)
      } else {
        console.log('⚠️ [Cache] Cache is stale, fetching fresh data')
      }
    } else {
      console.log('📭 [Cache] No cached articles found in IndexedDB')
    }

    // Fallback to network
    console.log('🌐 [Cache] Falling back to network fetch')
    return networkFetch(url)
  }

  // Network-first strategy
  const networkFirstStrategy = async (url: string): Promise<Article[]> => {
    console.log('🌐 [Cache] Using NETWORK-FIRST strategy')
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        console.log('🛑 [Cache] Cancelling previous request')
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      console.log('🚀 [Cache] Attempting network fetch (3s timeout)...')
      const result = await networkFetch(url, {
        signal: abortControllerRef.current.signal,
        timeout: 3000 // Quick timeout for network-first
      })

      console.log('✅ [Cache] Network fetch successful:', {
        articles: result.length
      })
      return result

    } catch (error) {
      console.warn('⚠️ [Cache] Network failed, falling back to cache:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      // Fallback to cache
      console.log('💾 [Cache] Checking IndexedDB fallback...')
      const cached = await articleDb.getArticles({
        category,
        ticker,
        sentiment,
        limit,
        offset
      })

      if (cached.length > 0) {
        const age = Math.min(...cached.map(a => Date.now() - a.cachedAt))
        console.log('✅ [Cache] Using fallback cache:', {
          count: cached.length,
          age: `${Math.round(age / 1000)}s`
        })
        setFromCache(true)
        setCacheAge(age)
        return convertCachedToArticles(cached)
      }

      console.log('❌ [Cache] No fallback cache available')
      throw error
    }
  }

  // Stale-while-revalidate strategy
  const staleWhileRevalidateStrategy = async (url: string): Promise<Article[]> => {
    console.log('♻️ [Cache] Using STALE-WHILE-REVALIDATE strategy')
    // Get from cache immediately
    console.log('💾 [Cache] Fetching from cache for immediate response...')
    const cached = await articleDb.getArticles({
      category,
      ticker,
      sentiment,
      limit,
      offset
    })

    if (cached.length > 0) {
      const age = Math.min(...cached.map(a => Date.now() - a.cachedAt))
      console.log('📦 [Cache] Returning stale cache immediately:', {
        count: cached.length,
        age: `${Math.round(age / 1000)}s`,
        strategy: 'will revalidate in background'
      })
      setFromCache(true)
      setCacheAge(age)

      // Revalidate in background
      console.log('🔄 [Cache] Starting background revalidation...')
      networkFetch(url).then(fresh => {
        console.log('✅ [Cache] Background revalidation complete:', {
          freshArticles: fresh.length
        })
        mutate(key, fresh, { revalidate: false })
      }).catch(error => {
        console.warn('⚠️ [Cache] Background revalidation failed:', error)
      })

      return convertCachedToArticles(cached)
    }

    console.log('📭 [Cache] No stale cache available, fetching from network')
    // No cache, fetch from network
    return networkFetch(url)
  }

  // Network-only strategy
  const networkOnlyStrategy = async (url: string): Promise<Article[]> => {
    console.log('🌐 [Cache] Using NETWORK-ONLY strategy (no cache)')
    return networkFetch(url)
  }

  // Network fetch with ETag support
  const networkFetch = async (url: string, options: any = {}): Promise<Article[]> => {
    const fetchStart = Date.now()
    console.log('🌐 [Cache] Starting network fetch with ETag support...')

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

    const fetchTime = Date.now() - fetchStart

    if (!httpCache && data.articles) {
      // Fresh data, cache it
      console.log('📥 [Cache] Received FRESH data from server:', {
        articles: data.articles.length,
        fetchTime: `${fetchTime}ms`,
        totalCount: data.totalCount
      })
      console.log('💾 [Cache] Saving to IndexedDB...')
      await cacheArticles(data.articles)
      setFromCache(false)
      setCacheAge(0)
      console.log('✅ [Cache] Fresh data cached successfully')
    } else if (httpCache) {
      console.log('✅ [Cache] HTTP cache hit (304 Not Modified):', {
        age: age ? `${Math.round(age / 1000)}s` : 'unknown',
        fetchTime: `${fetchTime}ms`
      })
      setFromCache(true)
      setCacheAge(age)
    } else {
      console.log('⚠️ [Cache] No articles received from server')
    }

    return data.articles || []
  }

  // Cache articles in IndexedDB
  const cacheArticles = async (articles: any[]): Promise<void> => {
    const cacheStart = Date.now()
    console.log(`💾 [Cache] Caching ${articles.length} articles to IndexedDB...`)

    const promises = articles.map((article: any) => {
      console.log(`💾 [Cache] Processing article: ${article.title}`)

      const cached: Partial<CachedArticle> = {
        id: article.id,
        title: article.title,
        summary: article.summary,
        content: article.marketAnalysis || article.content,
        aiContent: article.marketAnalysis,
        textContent: article.investmentImplications,
        createdAt: article.createdAt,
        publishedAt: article.createdAt,
        sourceTitle: article.sourceTitle,
        sourcePublisher: article.sourcePublisher,
        sourceCategory: article.sourceCategory,
        sentiment: article.sentiment as any,
        readingTime: article.readingTime,
        keywords: article.keywords || [],
        entities: article.entities || [],
        wordCount: article.wordCount,
        aiModel: article.aiModel,
        keyPoints: article.keyPoints,
        marketAnalysis: article.marketAnalysis,
        investmentImplications: article.investmentImplications,
        aiEnhanced: !!article.marketAnalysis,
        tickers: [] // Will be extracted from entities or keywords if needed
      }

      console.log(`💾 [Cache] Mapped article keys:`, Object.keys(cached))
      return articleDb.cacheArticle(cached)
    })

    const results = await Promise.allSettled(promises)
    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    const cacheTime = Date.now() - cacheStart

    console.log('💾 [Cache] IndexedDB cache complete:', {
      succeeded,
      failed,
      cacheTime: `${cacheTime}ms`,
      avgPerArticle: `${Math.round(cacheTime / articles.length)}ms`
    })
  }

  // Convert cached articles to API format
  const convertCachedToArticles = (cached: CachedArticle[]): any[] => {
    return cached.map(c => ({
      id: c.id,
      title: c.title,
      summary: c.summary,
      marketAnalysis: c.marketAnalysis || c.aiContent || c.content,
      investmentImplications: c.investmentImplications || c.textContent,
      createdAt: c.createdAt || c.publishedAt,
      sourceTitle: c.sourceTitle,
      sourcePublisher: c.sourcePublisher,
      sourceCategory: c.sourceCategory,
      sentiment: c.sentiment,
      readingTime: c.readingTime,
      keywords: c.keywords,
      entities: c.entities,
      wordCount: c.wordCount,
      aiModel: c.aiModel,
      keyPoints: c.keyPoints
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
    isOnline: () => typeof window !== 'undefined' ? navigator.onLine : true,

    // Custom visibility check
    isVisible: () => document.visibilityState === 'visible',

    // Error retry with exponential backoff
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Don't retry if offline
      if (typeof window !== 'undefined' && !navigator.onLine) return

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
      console.log(`✅ [Cache] SWR Success: ${data?.length || 0} articles loaded`)
      updateCacheStats()
    },

    // Loading slow callback
    onLoadingSlow: (key, config) => {
      console.warn('⚠️ [Cache] Loading is slow for:', key)
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
      console.log('🟢 [Cache] Network is back ONLINE - refreshing data...')
      setIsOffline(false)
      refresh() // Refresh when coming online
    }

    const handleOffline = () => {
      console.log('🔴 [Cache] Network went OFFLINE - using cached data only')
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Log initial state
    console.log(`🌐 [Cache] Initial network state: ${typeof window !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE'}`)

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
    const interval = setInterval(() => {
      updateCacheStats()
      console.log('📊 [Cache] Stats updated:', cacheStats)
    }, 10000)
    return () => clearInterval(interval)
  }, [updateCacheStats, cacheStats])

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