/**
 * Service Worker for Naly
 * Provides offline support and intelligent caching
 */

const CACHE_NAME = 'naly-cache-v1';
const API_CACHE_NAME = 'naly-api-v1';
const IMAGE_CACHE_NAME = 'naly-images-v1';

// URLs to cache for offline
const urlsToCache = [
  '/',
  '/offline',
  '/manifest.json'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME &&
              cacheName !== API_CACHE_NAME &&
              cacheName !== IMAGE_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API calls - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Only cache successful responses
            if (response.status === 200) {
              // Clone response as it can only be used once
              const responseToCache = response.clone();

              // Add custom header with cache timestamp
              const headers = new Headers(responseToCache.headers);
              headers.set('sw-cached-at', new Date().toISOString());

              cache.put(request, new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
              }));
            }
            return response;
          })
          .catch(() => {
            // Network failed, try cache
            return cache.match(request).then((response) => {
              if (response) {
                // Check if cache is fresh enough (5 minutes for API data)
                const cachedAt = response.headers.get('sw-cached-at');
                if (cachedAt) {
                  const age = Date.now() - new Date(cachedAt).getTime();
                  if (age < 5 * 60 * 1000) {
                    console.log('Serving from cache:', request.url);
                    return response;
                  }
                }
                // Return stale cache if no alternative
                console.log('Serving stale cache:', request.url);
                return response;
              }

              // No cache available
              return new Response(JSON.stringify({
                error: 'Offline',
                message: 'No cached data available'
              }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            });
          });
      })
    );
    return;
  }

  // Images - Cache first
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }

          return fetch(request).then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // HTML and other assets - Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Update cache with fresh content
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      })
      .catch(() => {
        // Try cache
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }

          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }

          // Default offline response
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-articles') {
    event.waitUntil(syncArticles());
  }
});

// Sync queued articles when back online
async function syncArticles() {
  try {
    // Get queued actions from cache
    const cache = await caches.open('offline-queue');
    const requests = await cache.keys();

    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          // Remove from queue on success
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Sync failed for:', request.url, error);
      }
    }
  } catch (error) {
    console.error('Sync articles failed:', error);
  }
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CACHE_ARTICLES') {
    // Pre-cache articles for offline reading
    cacheArticles(event.data.articles);
  }

  if (event.data?.type === 'CLEAR_OLD_CACHE') {
    clearOldCache();
  }
});

// Pre-cache articles for offline
async function cacheArticles(articles) {
  const cache = await caches.open(API_CACHE_NAME);

  for (const article of articles) {
    const request = new Request(`/api/articles/${article.id}`);
    const response = new Response(JSON.stringify(article), {
      headers: {
        'Content-Type': 'application/json',
        'sw-cached-at': new Date().toISOString()
      }
    });

    await cache.put(request, response);
  }

  console.log(`Cached ${articles.length} articles for offline`);
}

// Clear old cache entries
async function clearOldCache() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name =>
    name.startsWith('naly-') && !name.endsWith('-v1')
  );

  for (const cacheName of oldCaches) {
    await caches.delete(cacheName);
    console.log('Deleted old cache:', cacheName);
  }
}