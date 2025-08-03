// src/cache/CacheManager.js

import { BrowserAPICompat, EnvironmentDetector } from '../utils/environment.js';

/**
 * @class CacheManager
 * Advanced caching strategies for Aether.js applications
 * Implements smart cache invalidation, predictive pre-caching, and carbon-aware scheduling
 * Universal compatibility across all JavaScript environments
 */

export class CacheManager {
  constructor(options = {}) {
    this.options = {
      maxCacheSize: options.maxCacheSize || 50 * 1024 * 1024, // 50MB default
      maxCacheAge: options.maxCacheAge || 7 * 24 * 60 * 60 * 1000, // 7 days
      enablePredictiveCaching: options.enablePredictiveCaching !== false,
      enableCarbonAware: options.enableCarbonAware !== false,
      cacheStrategies: {
        static: 'cache-first',
        api: 'stale-while-revalidate',
        dynamic: 'network-first',
        ...options.cacheStrategies
      }
    };

    // Cache statistics and analytics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
      lastCleanup: Date.now()
    };

    // Usage patterns for predictive caching
    this.usagePatterns = new Map();
    this.accessHistory = [];
    
    // Carbon awareness data
    this.carbonData = {
      lastUpdate: 0,
      intensity: 'medium', // low, medium, high
      renewablePercentage: 50
    };

    this.initialize();
  }

  /**
   * Initialize cache manager
   * @private
   */
  async initialize() {
    await this.loadCacheStats();
    await this.loadUsagePatterns();
    await this.updateCarbonData();
    
    // Setup periodic maintenance
    this.setupMaintenanceSchedule();
    
    // Setup carbon data updates
    this.setupCarbonUpdates();
  }

  /**
   * Smart cache invalidation based on content analysis and usage patterns
   */
  async invalidateCache(pattern, options = {}) {
    const {
      force = false,
      preserveFrequent = true,
      maxAge = this.options.maxCacheAge
    } = options;

    const caches = await window.caches.keys();
    const results = {
      invalidated: 0,
      preserved: 0,
      errors: []
    };

    for (const cacheName of caches) {
      try {
        const cache = await window.caches.open(cacheName);
        const requests = await cache.keys();

        for (const request of requests) {
          const url = request.url;
          
          // Check if URL matches pattern
          if (this.matchesPattern(url, pattern)) {
            const shouldInvalidate = await this.shouldInvalidateEntry(
              request, 
              cache, 
              { force, preserveFrequent, maxAge }
            );

            if (shouldInvalidate) {
              await cache.delete(request);
              results.invalidated++;
            } else {
              results.preserved++;
            }
          }
        }
      } catch (error) {
        results.errors.push({ cacheName, error: error.message });
      }
    }

    // Update statistics
    this.stats.evictions += results.invalidated;
    await this.saveCacheStats();

    return results;
  }

  /**
   * Predictive pre-caching based on user behavior analysis
   */
  async predictivePreCache(currentUrl) {
    if (!this.options.enablePredictiveCaching) return;

    // Record access for pattern analysis
    this.recordAccess(currentUrl);

    // Analyze patterns and predict next likely resources
    const predictions = this.analyzePredictions(currentUrl);

    // Pre-cache predicted resources during low carbon intensity
    if (this.shouldPreCache()) {
      await this.preCacheResources(predictions);
    }
  }

  /**
   * Carbon-aware sync scheduling
   */
  async scheduleSync(syncFunction, priority = 'normal') {
    const carbonIntensity = await this.getCarbonIntensity();
    const networkCondition = this.getNetworkCondition();
    
    const delay = this.calculateOptimalDelay(carbonIntensity, networkCondition, priority);
    
    if (delay === 0) {
      // Execute immediately
      return await syncFunction();
    } else {
      // Schedule for later execution
      return this.scheduleDelayedSync(syncFunction, delay, priority);
    }
  }

  /**
   * Advanced cache strategies implementation
   */
  async handleRequest(request, strategy = null) {
    const url = new URL(request.url);
    const cacheStrategy = strategy || this.determineCacheStrategy(url);
    
    // Record access for analytics
    this.recordAccess(url.href);
    
    switch (cacheStrategy) {
      case 'cache-first':
        return this.cacheFirstStrategy(request);
      case 'network-first':
        return this.networkFirstStrategy(request);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidateStrategy(request);
      case 'cache-only':
        return this.cacheOnlyStrategy(request);
      case 'network-only':
        return this.networkOnlyStrategy(request);
      default:
        return this.staleWhileRevalidateStrategy(request);
    }
  }

  /**
   * Cache-first strategy with intelligent fallback
   */
  async cacheFirstStrategy(request) {
    try {
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        this.stats.hits++;
        
        // Check if cached response is stale and schedule background update
        if (this.isStale(cachedResponse)) {
          this.scheduleBackgroundUpdate(request);
        }
        
        return cachedResponse;
      }
      
      // Cache miss - fetch from network
      this.stats.misses++;
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        await this.cacheResponse(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      // Network error - try to serve stale content
      const staleResponse = await this.getStaleResponse(request);
      if (staleResponse) {
        return staleResponse;
      }
      throw error;
    }
  }

  /**
   * Stale-while-revalidate strategy with carbon awareness
   */
  async staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      this.stats.hits++;
      
      // Serve cached response immediately
      const responsePromise = Promise.resolve(cachedResponse);
      
      // Revalidate in background if carbon conditions are favorable
      if (this.shouldRevalidate()) {
        this.revalidateInBackground(request);
      }
      
      return responsePromise;
    }
    
    // No cached response - fetch from network
    this.stats.misses++;
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await this.cacheResponse(request, networkResponse.clone());
    }
    
    return networkResponse;
  }

  /**
   * Network-first strategy with intelligent caching
   */
  async networkFirstStrategy(request) {
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Cache successful responses
        await this.cacheResponse(request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (error) {
      // Network failed - try cache
      const cachedResponse = await caches.match(request);
      
      if (cachedResponse) {
        this.stats.hits++;
        return cachedResponse;
      }
      
      this.stats.misses++;
      throw error;
    }
  }

  /**
   * Intelligent cache response with size and age management
   */
  async cacheResponse(request, response) {
    const cacheName = this.determineCacheName(request);
    const cache = await caches.open(cacheName);
    
    // Check cache size limits
    if (await this.shouldEvictForSpace()) {
      await this.evictLeastUsed();
    }
    
    // Add metadata for intelligent management
    const enhancedResponse = this.enhanceResponse(response);
    
    await cache.put(request, enhancedResponse);
    this.updateCacheStats(request, response);
  }

  /**
   * Determine optimal cache strategy based on resource type and patterns
   */
  determineCacheStrategy(url) {
    // Static assets
    if (this.isStaticAsset(url)) {
      return this.options.cacheStrategies.static;
    }
    
    // API endpoints
    if (this.isApiEndpoint(url)) {
      return this.options.cacheStrategies.api;
    }
    
    // Dynamic content
    return this.options.cacheStrategies.dynamic;
  }

  /**
   * Carbon intensity awareness
   */
  async getCarbonIntensity() {
    // Update carbon data if stale
    if (Date.now() - this.carbonData.lastUpdate > 60 * 60 * 1000) { // 1 hour
      await this.updateCarbonData();
    }
    
    return this.carbonData.intensity;
  }

  /**
   * Update carbon intensity data from external APIs
   */
  async updateCarbonData() {
    if (!this.options.enableCarbonAware) return;
    
    try {
      // In a real implementation, this would call carbon intensity APIs
      // For now, simulate based on time of day
      const hour = new Date().getHours();
      
      // Simulate renewable energy patterns (more renewable during day)
      if (hour >= 10 && hour <= 16) {
        this.carbonData.intensity = 'low';
        this.carbonData.renewablePercentage = 70;
      } else if (hour >= 6 && hour <= 22) {
        this.carbonData.intensity = 'medium';
        this.carbonData.renewablePercentage = 50;
      } else {
        this.carbonData.intensity = 'high';
        this.carbonData.renewablePercentage = 30;
      }
      
      this.carbonData.lastUpdate = Date.now();
    } catch (error) {
      console.warn('Failed to update carbon data:', error);
    }
  }

  /**
   * Calculate optimal delay for carbon-aware operations
   */
  calculateOptimalDelay(carbonIntensity, networkCondition, priority) {
    if (priority === 'urgent') return 0;
    
    let baseDelay = 0;
    
    // Carbon intensity factor
    switch (carbonIntensity) {
      case 'high':
        baseDelay += priority === 'low' ? 60 * 60 * 1000 : 30 * 60 * 1000; // 1h or 30min
        break;
      case 'medium':
        baseDelay += priority === 'low' ? 15 * 60 * 1000 : 5 * 60 * 1000; // 15min or 5min
        break;
      case 'low':
        baseDelay = 0; // Execute immediately
        break;
    }
    
    // Network condition factor
    if (networkCondition === 'slow') {
      baseDelay += 5 * 60 * 1000; // Additional 5 minutes
    }
    
    return baseDelay;
  }

  /**
   * Usage pattern analysis for predictive caching
   */
  analyzePredictions(currentUrl) {
    const pattern = this.usagePatterns.get(currentUrl) || { next: new Map(), count: 0 };
    
    // Get most likely next resources
    const predictions = Array.from(pattern.next.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url, probability]) => ({ url, probability }));
    
    return predictions;
  }

  /**
   * Record access patterns for machine learning
   */
  recordAccess(url) {
    const now = Date.now();
    
    // Add to access history
    this.accessHistory.push({ url, timestamp: now });
    
    // Keep only recent history (last 1000 accesses)
    if (this.accessHistory.length > 1000) {
      this.accessHistory = this.accessHistory.slice(-1000);
    }
    
    // Update usage patterns
    this.updateUsagePatterns(url);
  }

  /**
   * Update usage patterns for predictive analysis
   */
  updateUsagePatterns(currentUrl) {
    // Find previous URL in recent history
    const recentAccess = this.accessHistory.slice(-10);
    const previousAccess = recentAccess[recentAccess.length - 2];
    
    if (previousAccess) {
      const previousUrl = previousAccess.url;
      
      if (!this.usagePatterns.has(previousUrl)) {
        this.usagePatterns.set(previousUrl, { next: new Map(), count: 0 });
      }
      
      const pattern = this.usagePatterns.get(previousUrl);
      pattern.count++;
      
      const nextCount = pattern.next.get(currentUrl) || 0;
      pattern.next.set(currentUrl, nextCount + 1);
    }
  }

  /**
   * Utility methods
   */
  
  isStaticAsset(url) {
    return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/i.test(url.pathname);
  }
  
  isApiEndpoint(url) {
    return url.pathname.startsWith('/api/') || url.pathname.startsWith('/graphql');
  }
  
  matchesPattern(url, pattern) {
    if (typeof pattern === 'string') {
      return url.includes(pattern);
    }
    if (pattern instanceof RegExp) {
      return pattern.test(url);
    }
    return false;
  }
  
  shouldPreCache() {
    return this.carbonData.intensity === 'low' && navigator.onLine;
  }
  
  shouldRevalidate() {
    return this.carbonData.intensity !== 'high' && navigator.onLine;
  }
  
  getNetworkCondition() {
    if (navigator.connection) {
      const effectiveType = navigator.connection.effectiveType;
      return ['slow-2g', '2g'].includes(effectiveType) ? 'slow' : 'fast';
    }
    return 'unknown';
  }

  /**
   * Maintenance and cleanup
   */
  setupMaintenanceSchedule() {
    // Run maintenance every hour
    setInterval(() => {
      this.performMaintenance();
    }, 60 * 60 * 1000);
  }

  setupCarbonUpdates() {
    // Update carbon data every 30 minutes
    setInterval(() => {
      this.updateCarbonData();
    }, 30 * 60 * 1000);
  }

  async performMaintenance() {
    await this.cleanupExpiredEntries();
    await this.optimizeCacheSize();
    await this.saveCacheStats();
    await this.saveUsagePatterns();
  }

  /**
   * Persistence methods
   */
  async loadCacheStats() {
    try {
      // Use compatibility layer for universal storage access
      const storage = BrowserAPICompat.getLocalStorage();
      const saved = storage.getItem('aether-cache-stats');
      if (saved) {
        this.stats = { ...this.stats, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load cache stats:', error);
    }
  }

  async saveCacheStats() {
    try {
      // Use compatibility layer for universal storage access
      const storage = BrowserAPICompat.getLocalStorage();
      storage.setItem('aether-cache-stats', JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Failed to save cache stats:', error);
    }
  }

  async loadUsagePatterns() {
    try {
      const saved = localStorage.getItem('aether-usage-patterns');
      if (saved) {
        const data = JSON.parse(saved);
        this.usagePatterns = new Map(data);
      }
    } catch (error) {
      console.warn('Failed to load usage patterns:', error);
    }
  }

  async saveUsagePatterns() {
    try {
      const data = Array.from(this.usagePatterns.entries());
      localStorage.setItem('aether-usage-patterns', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save usage patterns:', error);
    }
  }

  /**
   * Get cache statistics and health information
   */
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100),
      carbonIntensity: this.carbonData.intensity,
      renewablePercentage: this.carbonData.renewablePercentage,
      patternsLearned: this.usagePatterns.size,
      recentAccesses: this.accessHistory.length
    };
  }
}
