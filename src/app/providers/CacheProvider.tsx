/**
 * Cache Provider with SWR Configuration
 * Wraps the app with hybrid cache support
 */

'use client'

import { SWRConfig } from 'swr'
import { swrCacheProvider } from '@/lib/cache/providers/swrCacheProvider'
import { ReactNode, useEffect } from 'react'
import { articleDb } from '@/lib/cache/db/ArticleDatabase'

interface CacheProviderProps {
  children: ReactNode
}

export function CacheProvider({ children }: CacheProviderProps) {
  // Initialize cache cleanup on mount
  useEffect(() => {
    // Clean expired cache on app start
    articleDb.clearExpiredCache()

    // Register service worker for offline support
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)

          // Check for updates every hour
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // Request persistent storage
    if ('storage' in navigator && 'persist' in navigator.storage) {
      navigator.storage.persist().then(granted => {
        console.log(`Persistent storage ${granted ? 'granted' : 'denied'}`)
      })
    }

    // Cleanup on unmount
    return () => {
      swrCacheProvider.dispose()
    }
  }, [])

  return (
    <SWRConfig
      value={{
        provider: () => swrCacheProvider,

        // Global error handler
        onError: (error, key) => {
          console.error(`SWR Error for ${key}:`, error)

          // Send to error tracking
          if (window.gtag) {
            window.gtag('event', 'exception', {
              description: `SWR Error: ${error.message}`,
              fatal: false
            })
          }
        },

        // Global success handler
        onSuccess: (data, key) => {
          console.debug(`SWR Success for ${key}`)
        },

        // Loading slow handler
        onLoadingSlow: (key, config) => {
          console.warn(`Slow loading for ${key}`)
        },

        // Global configuration
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: true,
        dedupingInterval: 2000,
        focusThrottleInterval: 5000,
        errorRetryInterval: 5000,
        errorRetryCount: 3,
        keepPreviousData: true,

        // Custom online detector
        isOnline: () => {
          if (typeof window !== 'undefined') {
            return window.navigator.onLine
          }
          return true
        },

        // Custom visibility detector
        isVisible: () => {
          if (typeof document !== 'undefined') {
            return document.visibilityState === 'visible'
          }
          return true
        }
      }}
    >
      {children}
    </SWRConfig>
  )
}