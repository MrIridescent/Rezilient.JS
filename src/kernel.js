// src/kernel.js

import { SyncEngine } from './sync/SyncEngine.js';

const syncEngine = new SyncEngine();

self.addEventListener('install', (event) => {
  console.log('Aether.js Kernel installed.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Aether.js Kernel activated.');
  event.waitUntil(self.clients.claim());
});

/**
 * Listen for the 'sync' event, which is triggered by the browser
 * when the network connection is restored, even if the app tab is closed.
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'aether-sync') {
    console.log('Aether.js Kernel: Background sync event received.');
    event.waitUntil(syncEngine.processQueue());
  }
});

/**
 * This is a placeholder for the fetch handler, which is a core part of a
 * service worker's caching strategy. In a full implementation, this would
 * intercept network requests and serve cached responses when offline.
 */

const STATIC_CACHE = 'aether-static-v1';
const DATA_CACHE = 'aether-data-v1';

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache-first for static assets (e.g., .js, .css, .png, .svg)
  if (request.method === 'GET' && /\.(js|css|png|svg|woff2?|ttf|eot|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(request).then(response => {
          if (response) return response;
          return fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
      )
    );
    return;
  }

  // Stale-while-revalidate for API/data requests (e.g., /api/)
  if (request.method === 'GET' && url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(cache =>
        cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        })
      )
    );
    return;
  }

  // Default: network fallback
  event.respondWith(fetch(request));
});
