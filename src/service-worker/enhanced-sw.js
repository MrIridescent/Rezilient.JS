// src/service-worker/enhanced-sw.js

/**
 * Enhanced Service Worker for Aether.js applications
 * Integrates with CacheManager for intelligent caching strategies
 */

// Import CacheManager (in a real implementation, this would be bundled)
// For now, we'll implement the core logic directly

const CACHE_VERSION = 'aether-v1';
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

// Carbon awareness data
let carbonData = {
  intensity: 'medium',
  lastUpdate: 0,
  renewablePercentage: 50
};

// Usage patterns for predictive caching
let usagePatterns = new Map();
let accessHistory = [];

/**
 * Service Worker Installation
 */
self.addEventListener('install', event => {
  console.log('🚀 Aether.js Enhanced Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Pre-cache critical resources
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          // Add your critical static assets here
        ]);
      }),
      
      // Initialize carbon data
      updateCarbonData(),
      
      // Load usage patterns
      loadUsagePatterns()
    ]).then(() => {
      console.log('✅ Aether.js Service Worker installed successfully');
      self.skipWaiting();
    })
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', event => {
  console.log('🔄 Aether.js Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      
      // Setup periodic maintenance
      setupMaintenanceSchedule(),
      
      // Setup carbon data updates
      setupCarbonUpdates()
    ]).then(() => {
      console.log('✅ Aether.js Service Worker activated');
      self.clients.claim();
    })
  );
});

/**
 * Enhanced Fetch Handler with Intelligent Caching
 */
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Record access for pattern analysis
  recordAccess(url.href);
  
  // Determine cache strategy
  const strategy = determineCacheStrategy(url);
  
  // Handle request based on strategy
  event.respondWith(handleRequest(request, strategy));
});

/**
 * Background Sync for Offline Operations
 */
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'aether-sync') {
    event.waitUntil(processOfflineQueue());
  } else if (event.tag === 'aether-cache-maintenance') {
    event.waitUntil(performMaintenance());
  } else if (event.tag === 'aether-predictive-cache') {
    event.waitUntil(processPredictiveCache());
  }
});

/**
 * Message Handler for Communication with Main Thread
 */
self.addEventListener('message', event => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_STATS':
      event.ports[0].postMessage(getCacheStats());
      break;
      
    case 'INVALIDATE_CACHE':
      invalidateCache(data.pattern, data.options)
        .then(result => event.ports[0].postMessage(result));
      break;
      
    case 'UPDATE_CARBON_DATA':
      updateCarbonData()
        .then(() => event.ports[0].postMessage({ success: true }));
      break;
      
    case 'PREDICTIVE_CACHE':
      triggerPredictiveCache(data.currentUrl);
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});

/**
 * Cache Strategy Implementations
 */

async function handleRequest(request, strategy) {
  switch (strategy) {
    case 'cache-first':
      return cacheFirstStrategy(request);
    case 'network-first':
      return networkFirstStrategy(request);
    case 'stale-while-revalidate':
      return staleWhileRevalidateStrategy(request);
    case 'cache-only':
      return cacheOnlyStrategy(request);
    case 'network-only':
      return networkOnlyStrategy(request);
    default:
      return staleWhileRevalidateStrategy(request);
  }
}

async function cacheFirstStrategy(request) {
  const cacheName = getCacheName(request);
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if response is stale
    if (isStale(cachedResponse)) {
      // Schedule background update if carbon conditions are favorable
      if (shouldRevalidate()) {
        scheduleBackgroundUpdate(request);
      }
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
    // Network error - try to serve stale content
    const staleResponse = await getStaleResponse(request);
    if (staleResponse) {
      return staleResponse;
    }
    throw error;
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cacheName = getCacheName(request);
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Serve cached response immediately
    const responsePromise = Promise.resolve(cachedResponse);
    
    // Revalidate in background if conditions are favorable
    if (shouldRevalidate()) {
      revalidateInBackground(request, cache);
    }
    
    return responsePromise;
  }
  
  // No cached response - fetch from network
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    await cacheResponse(cache, request, networkResponse.clone());
  }
  return networkResponse;
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
    const cacheName = getCacheName(request);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
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
      ...response.headers,
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
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/i.test(url.pathname);
}

function isApiEndpoint(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/graphql');
}

function isStale(response) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  
  const age = Date.now() - parseInt(cachedAt);
  const maxAge = CACHE_CONFIG.api.maxAge; // Use API max age as default
  
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
    
    // Notify main thread of carbon data update
    broadcastToClients({
      type: 'CARBON_DATA_UPDATED',
      data: carbonData
    });
    
  } catch (error) {
    console.warn('Failed to update carbon data:', error);
  }
}

function shouldRevalidate() {
  return carbonData.intensity !== 'high';
}

function shouldPreCache() {
  return carbonData.intensity === 'low';
}

/**
 * Predictive Caching Functions
 */

function recordAccess(url) {
  const now = Date.now();
  
  // Add to access history
  accessHistory.push({ url, timestamp: now });
  
  // Keep only recent history
  if (accessHistory.length > 1000) {
    accessHistory = accessHistory.slice(-1000);
  }
  
  // Update usage patterns
  updateUsagePatterns(url);
}

function updateUsagePatterns(currentUrl) {
  const recentAccess = accessHistory.slice(-10);
  const previousAccess = recentAccess[recentAccess.length - 2];
  
  if (previousAccess) {
    const previousUrl = previousAccess.url;
    
    if (!usagePatterns.has(previousUrl)) {
      usagePatterns.set(previousUrl, { next: new Map(), count: 0 });
    }
    
    const pattern = usagePatterns.get(previousUrl);
    pattern.count++;
    
    const nextCount = pattern.next.get(currentUrl) || 0;
    pattern.next.set(currentUrl, nextCount + 1);
  }
}

async function triggerPredictiveCache(currentUrl) {
  if (!shouldPreCache()) return;
  
  const predictions = analyzePredictions(currentUrl);
  
  // Pre-cache predicted resources
  for (const prediction of predictions) {
    if (prediction.probability > 0.3) { // Only cache high-probability predictions
      try {
        const response = await fetch(prediction.url);
        if (response.ok) {
          const cacheName = getCacheName({ url: prediction.url });
          const cache = await caches.open(cacheName);
          await cacheResponse(cache, new Request(prediction.url), response);
        }
      } catch (error) {
        console.warn('Failed to pre-cache:', prediction.url, error);
      }
    }
  }
}

function analyzePredictions(currentUrl) {
  const pattern = usagePatterns.get(currentUrl);
  if (!pattern) return [];
  
  return Array.from(pattern.next.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([url, count]) => ({
      url,
      probability: count / pattern.count
    }));
}

/**
 * Maintenance Functions
 */

async function performMaintenance() {
  console.log('🧹 Performing cache maintenance...');
  
  await Promise.all([
    cleanupExpiredEntries(),
    enforceGlobalCacheSize(),
    saveUsagePatterns()
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
  const config = getCacheConfig(cache);
  
  if (requests.length >= config.maxEntries) {
    // Remove oldest entries
    const entriesToRemove = requests.length - config.maxEntries + 1;
    for (let i = 0; i < entriesToRemove; i++) {
      await cache.delete(requests[i]);
    }
  }
}

function getCacheConfig(cache) {
  // This is a simplified version - in reality, you'd determine based on cache name
  return CACHE_CONFIG.api;
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
      .map(cacheName => caches.delete(cacheName))
  );
}

function setupMaintenanceSchedule() {
  // Schedule maintenance every hour
  setInterval(() => {
    self.registration.sync.register('aether-cache-maintenance');
  }, 60 * 60 * 1000);
}

function setupCarbonUpdates() {
  // Update carbon data every 30 minutes
  setInterval(() => {
    updateCarbonData();
  }, 30 * 60 * 1000);
}

async function loadUsagePatterns() {
  // In a real implementation, this would load from IndexedDB
  // For now, we'll use a simple approach
  try {
    const stored = await getStoredData('usage-patterns');
    if (stored) {
      usagePatterns = new Map(stored);
    }
  } catch (error) {
    console.warn('Failed to load usage patterns:', error);
  }
}

async function saveUsagePatterns() {
  try {
    const data = Array.from(usagePatterns.entries());
    await storeData('usage-patterns', data);
  } catch (error) {
    console.warn('Failed to save usage patterns:', error);
  }
}

function getCacheStats() {
  return {
    carbonIntensity: carbonData.intensity,
    renewablePercentage: carbonData.renewablePercentage,
    patternsLearned: usagePatterns.size,
    recentAccesses: accessHistory.length,
    lastUpdate: carbonData.lastUpdate
  };
}

function broadcastToClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage(message));
  });
}

// Simplified storage functions (in reality, would use IndexedDB)
async function getStoredData(key) {
  return null; // Placeholder
}

async function storeData(key, data) {
  // Placeholder
}

console.log('🌟 Aether.js Enhanced Service Worker loaded with advanced caching strategies');
