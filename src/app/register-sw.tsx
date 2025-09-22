"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });

          console.log('📦 [ServiceWorker] Registration successful:', {
            scope: registration.scope,
            active: !!registration.active,
            installing: !!registration.installing,
            waiting: !!registration.waiting
          });

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('🔄 [ServiceWorker] New version activated');
                  // Optionally prompt user to refresh
                }
              });
            }
          });

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Every minute

        } catch (error) {
          console.error('❌ [ServiceWorker] Registration failed:', error);
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 [ServiceWorker] Message received:', event.data);

        if (event.data.type === 'CACHE_UPDATED') {
          // Optionally trigger UI update
          window.dispatchEvent(new CustomEvent('sw-cache-updated', {
            detail: event.data
          }));
        }
      });

      // Handle offline/online events
      window.addEventListener('online', () => {
        console.log('🟢 [ServiceWorker] Back online');
        navigator.serviceWorker.controller?.postMessage({
          type: 'SYNC_CACHE'
        });
      });

      window.addEventListener('offline', () => {
        console.log('🔴 [ServiceWorker] Gone offline');
      });
    }
  }, []);

  return null;
}