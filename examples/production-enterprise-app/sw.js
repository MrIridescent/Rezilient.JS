// Service Worker for Aether.js Enterprise Suite
// Production-ready service worker with advanced caching strategies

const CACHE_VERSION = 'aether-enterprise-v2.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

// Cache configuration
const CACHE_CONFIG = {
  static: {
    strategy: 'cache-first',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  api: {
    strategy: 'stale-while-revalidate',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 50
  },
  dynamic: {
    strategy: 'network-first',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 30
  }
};

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/components.css',
  '/styles/themes.css',
  '/js/main.js',
  '/manifest.json'
];

// Carbon awareness data
let carbonData = {
  intensity: 'medium',
  lastUpdate: 0,
  renewablePercentage: 50
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', event => {
  console.log('🚀 Aether.js Enterprise Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Pre-cache critical resources
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching critical resources...');
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      
      // Initialize carbon data
      updateCarbonData(),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ]).then(() => {
      console.log('✅ Aether.js Enterprise Service Worker installed successfully');
    }).catch(error => {
      console.error('❌ Service Worker installation failed:', error);
    })
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', event => {
  console.log('🔄 Aether.js Enterprise Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      
      // Setup periodic maintenance
      setupMaintenanceSchedule(),
      
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Aether.js Enterprise Service Worker activated');
    })
  );
});

/**
 * Enhanced Fetch Handler
 */
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Determine cache strategy
  const strategy = determineCacheStrategy(url);
  
  // Handle request based on strategy
  event.respondWith(handleRequest(request, strategy));
});

/**
 * Background Sync Handler
 */
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'aether-enterprise-sync':
      event.waitUntil(processEnterpriseSync());
      break;
    case 'aether-cache-maintenance':
      event.waitUntil(performMaintenance());
      break;
    case 'aether-carbon-update':
      event.waitUntil(updateCarbonData());
      break;
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

/**
 * Push Notification Handler
 */
self.addEventListener('push', event => {
  console.log('📱 Push notification received');
  
  const options = {
    body: 'Aether.js Enterprise Suite notification',
    icon: './icons/icon-192x192.png',
    badge: './icons/badge-72x72.png',
    tag: 'aether-enterprise',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: './icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: './icons/action-dismiss.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.title = data.title || 'Aether Enterprise';
  }
  
  event.waitUntil(
    self.registration.showNotification('Aether Enterprise', options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        // Focus existing window if available
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        // Open new window if no existing window
        return self.clients.openWindow('/');
      })
    );
  }
});

/**
 * Message Handler for Communication with Main Thread
 */
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage(stats);
      });
      break;
      
    case 'INVALIDATE_CACHE':
      invalidateCache(data.pattern, data.options).then(result => {
        event.ports[0].postMessage(result);
      });
      break;
      
    case 'UPDATE_CARBON_DATA':
      updateCarbonData().then(() => {
        event.ports[0].postMessage({ success: true, carbonData });
      });
      break;
      
    case 'FORCE_SYNC':
      processEnterpriseSync().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});

/**
 * Cache Strategy Implementations
 */

async function handleRequest(request, strategy) {
  try {
    switch (strategy) {
      case 'cache-first':
        return await cacheFirstStrategy(request);
      case 'network-first':
        return await networkFirstStrategy(request);
      case 'stale-while-revalidate':
        return await staleWhileRevalidateStrategy(request);
      case 'cache-only':
        return await cacheOnlyStrategy(request);
      case 'network-only':
        return await networkOnlyStrategy(request);
      default:
        return await staleWhileRevalidateStrategy(request);
    }
  } catch (error) {
    console.error('Request handling failed:', error);
    return new Response('Service Unavailable', { status: 503 });
  }
}

async function cacheFirstStrategy(request) {
  const cacheName = getCacheName(request);
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if response is stale and schedule background update
    if (isStale(cachedResponse)) {
      scheduleBackgroundUpdate(request);
    }
    return cachedResponse;
  }
  
  // Cache miss - fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cacheResponse(cache, request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Network Error', { status: 503 });
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cacheName = getCacheName(request);
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch from network in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cacheResponse(cache, request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network if no cached response
  return await networkPromise || new Response('Service Unavailable', { status: 503 });
}

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cacheName = getCacheName(request);
      const cache = await caches.open(cacheName);
      await cacheResponse(cache, request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed - try cache
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Service Unavailable', { status: 503 });
  }
}

async function cacheOnlyStrategy(request) {
  return await caches.match(request) || new Response('Not found in cache', { status: 404 });
}

async function networkOnlyStrategy(request) {
  return await fetch(request);
}

/**
 * Cache Management Functions
 */

async function cacheResponse(cache, request, response) {
  // Check cache size limits before adding
  await enforceMaxEntries(cache);
  
  // Add timestamp for age tracking
  const enhancedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'sw-cached-at': Date.now().toString()
    }
  });
  
  await cache.put(request, enhancedResponse);
}

function determineCacheStrategy(url) {
  // Static assets
  if (isStaticAsset(url)) {
    return CACHE_CONFIG.static.strategy;
  }
  
  // API endpoints
  if (isApiEndpoint(url)) {
    return CACHE_CONFIG.api.strategy;
  }
  
  // Dynamic content
  return CACHE_CONFIG.dynamic.strategy;
}

function getCacheName(request) {
  const url = new URL(request.url);
  
  if (isStaticAsset(url)) {
    return STATIC_CACHE;
  } else if (isApiEndpoint(url)) {
    return API_CACHE;
  } else {
    return DYNAMIC_CACHE;
  }
}

function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico|json)$/i.test(url.pathname);
}

function isApiEndpoint(url) {
  return url.pathname.startsWith('/api/') || 
         url.pathname.startsWith('/graphql') ||
         url.hostname !== self.location.hostname;
}

function isStale(response) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  
  const age = Date.now() - parseInt(cachedAt);
  const maxAge = CACHE_CONFIG.api.maxAge;
  
  return age > maxAge;
}

/**
 * Carbon Awareness Functions
 */

async function updateCarbonData() {
  try {
    // Simulate carbon intensity based on time of day
    const hour = new Date().getHours();
    
    if (hour >= 10 && hour <= 16) {
      carbonData = {
        intensity: 'low',
        renewablePercentage: 70,
        lastUpdate: Date.now()
      };
    } else if (hour >= 6 && hour <= 22) {
      carbonData = {
        intensity: 'medium',
        renewablePercentage: 50,
        lastUpdate: Date.now()
      };
    } else {
      carbonData = {
        intensity: 'high',
        renewablePercentage: 30,
        lastUpdate: Date.now()
      };
    }
    
    // Notify clients of carbon data update
    broadcastToClients({
      type: 'CARBON_DATA_UPDATED',
      data: carbonData
    });
    
  } catch (error) {
    console.warn('Failed to update carbon data:', error);
  }
}

/**
 * Maintenance Functions
 */

async function performMaintenance() {
  console.log('🧹 Performing cache maintenance...');
  
  await Promise.all([
    cleanupExpiredEntries(),
    enforceGlobalCacheSize()
  ]);
  
  console.log('✅ Cache maintenance completed');
}

async function cleanupExpiredEntries() {
  const cacheNames = [STATIC_CACHE, API_CACHE, DYNAMIC_CACHE];
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response && isStale(response)) {
          await cache.delete(request);
        }
      }
    } catch (error) {
      console.warn('Error cleaning cache:', cacheName, error);
    }
  }
}

async function enforceMaxEntries(cache) {
  const requests = await cache.keys();
  const maxEntries = 50; // Default max entries
  
  if (requests.length >= maxEntries) {
    // Remove oldest entries
    const entriesToRemove = requests.length - maxEntries + 1;
    for (let i = 0; i < entriesToRemove; i++) {
      await cache.delete(requests[i]);
    }
  }
}

async function enforceGlobalCacheSize() {
  // Estimate cache size and clean up if needed
  const estimate = await navigator.storage?.estimate?.();
  if (estimate && estimate.usage > 100 * 1024 * 1024) { // 100MB
    console.log('Cache size limit reached, cleaning up...');
    await cleanupExpiredEntries();
  }
}

/**
 * Utility Functions
 */

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE, API_CACHE, DYNAMIC_CACHE];
  
  return Promise.all(
    cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => {
        console.log('🗑️ Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      })
  );
}

function setupMaintenanceSchedule() {
  // Schedule maintenance every hour
  setInterval(() => {
    if (self.registration.sync) {
      self.registration.sync.register('aether-cache-maintenance');
    }
  }, 60 * 60 * 1000);
}

function scheduleBackgroundUpdate(request) {
  // Schedule background update for stale content
  setTimeout(() => {
    fetch(request).then(response => {
      if (response.ok) {
        const cacheName = getCacheName(request);
        caches.open(cacheName).then(cache => {
          cacheResponse(cache, request, response);
        });
      }
    }).catch(() => {
      // Ignore background update failures
    });
  }, 1000);
}

async function processEnterpriseSync() {
  console.log('🔄 Processing enterprise sync...');
  // This would handle offline data synchronization
  // For demo purposes, we'll just log the action
  return Promise.resolve();
}

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {
    caches: cacheNames.length,
    carbonIntensity: carbonData.intensity,
    renewablePercentage: carbonData.renewablePercentage,
    lastUpdate: carbonData.lastUpdate
  };
  
  return stats;
}

async function invalidateCache(pattern, options = {}) {
  const cacheNames = await caches.keys();
  let invalidated = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes(pattern)) {
        await cache.delete(request);
        invalidated++;
      }
    }
  }
  
  return { invalidated };
}

function broadcastToClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

console.log('🌟 Aether.js Enterprise Service Worker loaded successfully');
