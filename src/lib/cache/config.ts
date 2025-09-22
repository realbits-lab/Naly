/**
 * Cache configuration for Naly's hybrid caching system
 * Optimized for financial news with time-sensitive content
 */

export const CACHE_CONFIG = {
  VERSION: 1,

  // Cache store names
  STORES: {
    NEWS_ARTICLES: 'news_articles',
    FETCHED_ARTICLES: 'fetched_articles',
    AI_ENHANCEMENTS: 'ai_enhancements',
    MARKET_DATA: 'market_data',
    USER_PREFERENCES: 'user_preferences',
    METRICS: 'cache_metrics'
  },

  // Time-to-live configurations (in milliseconds)
  TTL: {
    BREAKING_NEWS: 5 * 60 * 1000,        // 5 minutes
    REGULAR_NEWS: 30 * 60 * 1000,        // 30 minutes
    AI_ENHANCEMENT: 60 * 60 * 1000,      // 1 hour
    MARKET_DATA: 60 * 1000,              // 1 minute
    STATIC_CONTENT: 24 * 60 * 60 * 1000, // 24 hours
    USER_PREFERENCES: 7 * 24 * 60 * 60 * 1000 // 7 days
  },

  // Storage size limits
  SIZE_LIMITS: {
    MEMORY_CACHE: 10 * 1024 * 1024,      // 10MB
    LOCAL_STORAGE: 5 * 1024 * 1024,      // 5MB
    INDEXED_DB: 100 * 1024 * 1024,       // 100MB
    TOTAL: 150 * 1024 * 1024              // 150MB
  },

  // Cache strategies
  STRATEGIES: {
    NETWORK_FIRST: 'network-first',
    CACHE_FIRST: 'cache-first',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
    NETWORK_ONLY: 'network-only',
    CACHE_ONLY: 'cache-only'
  },

  // Market-aware settings
  MARKET: {
    // US Market hours (EST/EDT)
    OPEN_HOUR: 9,
    CLOSE_HOUR: 16,
    TIMEZONE: 'America/New_York',

    // Cache multipliers based on market status
    MARKET_HOURS_MULTIPLIER: 0.5,  // Shorter TTL during market hours
    AFTER_HOURS_MULTIPLIER: 1.5,   // Longer TTL after hours
    WEEKEND_MULTIPLIER: 3          // Much longer TTL on weekends
  },

  // Compression settings
  COMPRESSION: {
    ENABLED: true,
    THRESHOLD: 1024,  // Compress if larger than 1KB
    ALGORITHM: 'lz-string'
  },

  // Sync settings
  SYNC: {
    INTERVAL: 5 * 60 * 1000,  // 5 minutes
    BATCH_SIZE: 50,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  },

  // Performance settings
  PERFORMANCE: {
    MAX_CONCURRENT_FETCHES: 3,
    DEBOUNCE_DELAY: 300,
    THROTTLE_DELAY: 1000,
    PREFETCH_COUNT: 5
  }
} as const

/**
 * Determine if market is currently open
 */
export function isMarketOpen(): boolean {
  const now = new Date()
  const nyTime = new Date(now.toLocaleString("en-US", {timeZone: CACHE_CONFIG.MARKET.TIMEZONE}))
  const hour = nyTime.getHours()
  const day = nyTime.getDay()

  // Market is open Monday-Friday, 9:30 AM - 4:00 PM EST
  return day >= 1 && day <= 5 && hour >= CACHE_CONFIG.MARKET.OPEN_HOUR && hour < CACHE_CONFIG.MARKET.CLOSE_HOUR
}

/**
 * Get dynamic TTL based on content type and market status
 */
export function getDynamicTTL(contentType: keyof typeof CACHE_CONFIG.TTL): number {
  const baseTTL = CACHE_CONFIG.TTL[contentType]
  const now = new Date()
  const day = now.getDay()

  if (isMarketOpen()) {
    return Math.floor(baseTTL * CACHE_CONFIG.MARKET.MARKET_HOURS_MULTIPLIER)
  } else if (day === 0 || day === 6) {
    // Weekend
    return Math.floor(baseTTL * CACHE_CONFIG.MARKET.WEEKEND_MULTIPLIER)
  } else {
    // After hours
    return Math.floor(baseTTL * CACHE_CONFIG.MARKET.AFTER_HOURS_MULTIPLIER)
  }
}

/**
 * Get cache strategy based on content type
 */
export function getCacheStrategy(contentType: string): string {
  const strategyMap: Record<string, string> = {
    'breaking': CACHE_CONFIG.STRATEGIES.NETWORK_FIRST,
    'market-data': CACHE_CONFIG.STRATEGIES.NETWORK_ONLY,
    'regular': CACHE_CONFIG.STRATEGIES.STALE_WHILE_REVALIDATE,
    'static': CACHE_CONFIG.STRATEGIES.CACHE_FIRST,
    'user-preferences': CACHE_CONFIG.STRATEGIES.CACHE_FIRST
  }

  return strategyMap[contentType] || CACHE_CONFIG.STRATEGIES.NETWORK_FIRST
}