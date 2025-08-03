// examples/advanced-features-demo.js

/**
 * Advanced Features Demo for Aether.js
 * Demonstrates Phase 2 enhancements:
 * - Smart Cache Invalidation
 * - Predictive Pre-caching
 * - Carbon-aware Sync Scheduling
 * - Advanced Service Worker Integration
 */

import {
  AetherComponent,
  PersistentStore,
  SyncEngine,
  CacheManager,
  CarbonAwareScheduler,
  SYNC_STATUS,
  SYNC_EVENTS
} from 'aether-framework';

/**
 * Advanced Enterprise Application Demo
 */
class AdvancedEnterpriseApp extends AetherComponent {
  constructor() {
    super({
      autoSync: true,
      syncOnOnline: true,
      trackSyncState: true
    });

    // Initialize stores
    this.dataStore = new PersistentStore('enterprise-data', {
      documents: [],
      analytics: {},
      userPreferences: {}
    });

    // Initialize enhanced sync engine with all advanced features
    this.syncEngine = new SyncEngine({
      conflictStrategy: 'LastWriteWins',
      retryAttempts: 5,
      retryDelay: 2000,
      enableProgressTracking: true,
      enableAdvancedCaching: true,
      enableCarbonAware: true
    });

    // Initialize standalone cache manager for demonstration
    this.cacheManager = new CacheManager({
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      enablePredictiveCaching: true,
      enableCarbonAware: true
    });

    // Initialize carbon-aware scheduler
    this.carbonScheduler = new CarbonAwareScheduler({
      enableCarbonAwareness: true,
      maxDelayHours: 12
    });

    // Connect sync engine to component
    this.connectSyncEngine(this.syncEngine);

    // Setup integrations
    this.setupAdvancedIntegrations();
    
    // UI state
    this.uiState = {
      currentView: 'dashboard',
      showAdvancedStats: false,
      showCarbonData: false,
      showCacheStats: false
    };

    // Subscribe to store changes
    this.dataStore.subscribe(data => this.render());
  }

  /**
   * Setup advanced feature integrations
   */
  setupAdvancedIntegrations() {
    // Setup data sync with carbon awareness
    this.dataStore.subscribe(async (data) => {
      // Schedule sync based on carbon intensity
      await this.carbonScheduler.scheduleTask({
        type: 'sync',
        execute: async () => {
          await this.syncEngine.addMutation({
            type: 'SYNC_ENTERPRISE_DATA',
            payload: data,
            entityType: 'enterprise'
          });
        },
        estimatedDuration: 2000
      }, 'normal', {
        carbonAware: true,
        networkAware: true,
        batteryAware: true
      });
    });

    // Setup predictive caching based on user navigation
    this.setupPredictiveCaching();
    
    // Setup intelligent cache invalidation
    this.setupCacheInvalidation();
  }

  /**
   * Setup predictive caching based on user behavior
   */
  setupPredictiveCaching() {
    // Track page views for predictive caching
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleNavigation(args[2]); // URL is the third argument
    };

    // Track initial page load
    this.handleNavigation(window.location.href);
  }

  /**
   * Handle navigation for predictive caching
   */
  async handleNavigation(url) {
    console.log('📍 Navigation detected:', url);
    
    // Trigger predictive caching
    await this.cacheManager.predictivePreCache(url);
    
    // Schedule cache optimization
    await this.carbonScheduler.scheduleTask({
      type: 'cache-optimization',
      execute: async () => {
        await this.optimizeCacheForCurrentContext();
      },
      estimatedDuration: 1000
    }, 'low');
  }

  /**
   * Setup intelligent cache invalidation
   */
  setupCacheInvalidation() {
    // Invalidate cache when data changes significantly
    this.dataStore.subscribe(async (data, previousData) => {
      if (this.shouldInvalidateCache(data, previousData)) {
        await this.cacheManager.invalidateCache('/api/enterprise', {
          preserveFrequent: true,
          maxAge: 60 * 60 * 1000 // 1 hour
        });
      }
    });
  }

  /**
   * Determine if cache should be invalidated
   */
  shouldInvalidateCache(newData, oldData) {
    if (!oldData) return false;
    
    // Invalidate if document count changed significantly
    const oldDocCount = oldData.documents?.length || 0;
    const newDocCount = newData.documents?.length || 0;
    
    return Math.abs(newDocCount - oldDocCount) > 5;
  }

  /**
   * Optimize cache for current context
   */
  async optimizeCacheForCurrentContext() {
    const stats = this.cacheManager.getStats();
    
    console.log('🔧 Optimizing cache:', stats);
    
    // Clean up old entries if cache is getting full
    if (stats.hitRate < 70) {
      await this.cacheManager.invalidateCache('.*', {
        preserveFrequent: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
    }
  }

  /**
   * Enhanced lifecycle hooks
   */
  onOffline() {
    console.log('📱 Advanced App: Working offline with intelligent caching');
    this.showNotification('Working offline - using intelligent cache', 'info');
    this.render();
  }

  onOnline() {
    console.log('🌐 Advanced App: Back online, optimizing sync schedule');
    this.showNotification('Back online - optimizing sync with carbon awareness', 'success');
    this.render();
  }

  onSyncStateChange(state) {
    console.log('🔄 Advanced sync state:', state);
    this.render();
  }

  onSyncProgress(progress) {
    console.log(`📈 Sync progress: ${progress.percentage}% (${progress.current}/${progress.total})`);
    this.render();
  }

  /**
   * Advanced operations
   */
  async performLargeDataOperation() {
    const largeDataSet = this.generateLargeDataSet();
    
    // Schedule as batch operation with carbon awareness
    await this.carbonScheduler.scheduleBatch(
      largeDataSet.map(item => ({
        type: 'process-data',
        execute: async (data) => this.processDataItem(data),
        data: item,
        estimatedDuration: 500
      })),
      'low', // Low priority for batch operations
      {
        batchSize: 5,
        carbonAware: true,
        networkAware: true
      }
    );

    this.showNotification('Large operation scheduled with carbon awareness', 'info');
  }

  generateLargeDataSet() {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      data: `Large data item ${i}`,
      timestamp: Date.now()
    }));
  }

  async processDataItem(item) {
    // Simulate data processing
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('Processed item:', item.id);
    return { processed: true, id: item.id };
  }

  /**
   * Cache management operations
   */
  async clearIntelligentCache() {
    const result = await this.cacheManager.invalidateCache('.*', {
      force: true
    });
    
    this.showNotification(
      `Cache cleared: ${result.invalidated} entries removed`, 
      'success'
    );
    this.render();
  }

  async optimizeCache() {
    await this.optimizeCacheForCurrentContext();
    this.showNotification('Cache optimized for current usage patterns', 'success');
    this.render();
  }

  /**
   * Carbon scheduling operations
   */
  async scheduleBackgroundTask() {
    const taskId = await this.carbonScheduler.scheduleTask({
      type: 'background-analytics',
      execute: async () => {
        console.log('🔍 Running background analytics during low carbon period');
        return this.runBackgroundAnalytics();
      },
      estimatedDuration: 5000
    }, 'background');

    this.showNotification(`Background task scheduled: ${taskId}`, 'info');
  }

  async runBackgroundAnalytics() {
    // Simulate analytics processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analytics = {
      userEngagement: Math.random() * 100,
      performanceMetrics: {
        loadTime: Math.random() * 3000,
        cacheHitRate: Math.random() * 100
      },
      timestamp: Date.now()
    };

    this.dataStore.update(data => ({
      ...data,
      analytics
    }));

    return analytics;
  }

  async forceExecuteAllTasks() {
    const results = await this.carbonScheduler.forceExecuteAll();
    this.showNotification(`Executed ${results.length} pending tasks`, 'success');
    this.render();
  }

  /**
   * UI state management
   */
  toggleAdvancedStats() {
    this.uiState.showAdvancedStats = !this.uiState.showAdvancedStats;
    this.render();
  }

  toggleCarbonData() {
    this.uiState.showCarbonData = !this.uiState.showCarbonData;
    this.render();
  }

  toggleCacheStats() {
    this.uiState.showCacheStats = !this.uiState.showCacheStats;
    this.render();
  }

  setView(view) {
    this.uiState.currentView = view;
    this.render();
  }

  /**
   * Get comprehensive statistics
   */
  getComprehensiveStats() {
    return {
      sync: this.getSyncState(),
      advanced: this.syncEngine.getAdvancedStats(),
      cache: this.cacheManager.getStats(),
      carbon: this.carbonScheduler.getStats(),
      network: this.getNetworkState()
    };
  }

  /**
   * Enhanced render method with advanced features visualization
   */
  render() {
    const data = this.dataStore.get();
    const syncState = this.getSyncState();
    const networkState = this.getNetworkState();
    const stats = this.getComprehensiveStats();

    const container = document.getElementById('app');
    if (!container) return;

    container.innerHTML = `
      <div class="advanced-enterprise-app">
        <!-- Header -->
        <header class="app-header">
          <h1>🌟 Aether.js Advanced Features Demo</h1>
          <div class="status-indicators">
            <div class="indicator ${networkState.isOnline ? 'online' : 'offline'}">
              ${networkState.isOnline ? '🌐' : '📱'} ${networkState.isOnline ? 'Online' : 'Offline'}
            </div>
            <div class="indicator carbon-${stats.carbon.carbonIntensity}">
              🌱 Carbon: ${stats.carbon.carbonIntensity}
            </div>
            <div class="indicator">
              📊 Cache: ${stats.cache.hitRate}% hit rate
            </div>
          </div>
        </header>

        <!-- Navigation -->
        <nav class="app-nav">
          <button onclick="advancedApp.setView('dashboard')" 
                  class="${this.uiState.currentView === 'dashboard' ? 'active' : ''}">
            Dashboard
          </button>
          <button onclick="advancedApp.setView('operations')" 
                  class="${this.uiState.currentView === 'operations' ? 'active' : ''}">
            Operations
          </button>
          <button onclick="advancedApp.setView('analytics')" 
                  class="${this.uiState.currentView === 'analytics' ? 'active' : ''}">
            Analytics
          </button>
        </nav>

        <!-- Main Content -->
        <main class="app-main">
          ${this.renderCurrentView(stats)}
        </main>

        <!-- Advanced Stats Panel -->
        <div class="stats-panel">
          <button onclick="advancedApp.toggleAdvancedStats()" class="stats-toggle">
            ${this.uiState.showAdvancedStats ? '▼' : '▶'} Advanced Statistics
          </button>
          
          ${this.uiState.showAdvancedStats ? this.renderAdvancedStats(stats) : ''}
        </div>
      </div>
    `;
  }

  renderCurrentView(stats) {
    switch (this.uiState.currentView) {
      case 'dashboard':
        return this.renderDashboard(stats);
      case 'operations':
        return this.renderOperations(stats);
      case 'analytics':
        return this.renderAnalytics(stats);
      default:
        return this.renderDashboard(stats);
    }
  }

  renderDashboard(stats) {
    return `
      <div class="dashboard">
        <h2>🏢 Enterprise Dashboard</h2>
        
        <div class="dashboard-cards">
          <div class="card">
            <h3>📄 Documents</h3>
            <div class="metric">${this.dataStore.get().documents.length}</div>
          </div>
          
          <div class="card">
            <h3>🔄 Sync Status</h3>
            <div class="metric">${stats.sync.status}</div>
            <div class="sub-metric">${stats.sync.pending} pending</div>
          </div>
          
          <div class="card">
            <h3>🌱 Carbon Efficiency</h3>
            <div class="metric">${stats.carbon.carbonSaved.toFixed(1)}g CO₂ saved</div>
            <div class="sub-metric">${stats.carbon.renewablePercentage}% renewable</div>
          </div>
          
          <div class="card">
            <h3>📊 Cache Performance</h3>
            <div class="metric">${stats.cache.hitRate}%</div>
            <div class="sub-metric">${stats.cache.patternsLearned} patterns learned</div>
          </div>
        </div>
      </div>
    `;
  }

  renderOperations(stats) {
    return `
      <div class="operations">
        <h2>⚙️ Advanced Operations</h2>
        
        <div class="operation-section">
          <h3>🔄 Sync Operations</h3>
          <button onclick="advancedApp.forceSync()" ${this.isSyncing ? 'disabled' : ''}>
            Force Sync Now
          </button>
          <button onclick="advancedApp.clearSyncQueue()">
            Clear Sync Queue
          </button>
        </div>

        <div class="operation-section">
          <h3>📊 Cache Operations</h3>
          <button onclick="advancedApp.clearIntelligentCache()">
            Clear Cache (Smart)
          </button>
          <button onclick="advancedApp.optimizeCache()">
            Optimize Cache
          </button>
        </div>

        <div class="operation-section">
          <h3>🌱 Carbon-Aware Operations</h3>
          <button onclick="advancedApp.performLargeDataOperation()">
            Schedule Large Operation
          </button>
          <button onclick="advancedApp.scheduleBackgroundTask()">
            Schedule Background Task
          </button>
          <button onclick="advancedApp.forceExecuteAllTasks()">
            Force Execute All Tasks
          </button>
        </div>

        <div class="operation-section">
          <h3>📈 Queue Status</h3>
          <div class="queue-stats">
            ${Object.entries(stats.carbon.queueSizes).map(([priority, count]) => 
              `<div>${priority}: ${count} tasks</div>`
            ).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderAnalytics(stats) {
    const analytics = this.dataStore.get().analytics;
    
    return `
      <div class="analytics">
        <h2>📈 Analytics & Insights</h2>
        
        ${analytics.userEngagement ? `
          <div class="analytics-section">
            <h3>👥 User Engagement</h3>
            <div class="metric">${analytics.userEngagement.toFixed(1)}%</div>
          </div>
        ` : ''}

        <div class="analytics-section">
          <h3>⚡ Performance Metrics</h3>
          <div class="metrics-grid">
            <div>Cache Hit Rate: ${stats.cache.hitRate}%</div>
            <div>Sync Success Rate: ${((stats.sync.pending === 0) ? 100 : 85).toFixed(1)}%</div>
            <div>Carbon Efficiency: ${stats.carbon.carbonIntensity}</div>
          </div>
        </div>

        <div class="analytics-section">
          <h3>🌱 Sustainability Impact</h3>
          <div class="sustainability-metrics">
            <div>CO₂ Saved: ${stats.carbon.carbonSaved.toFixed(2)}g</div>
            <div>Energy Saved: ${stats.carbon.energySaved.toFixed(2)}Wh</div>
            <div>Renewable Energy: ${stats.carbon.renewablePercentage}%</div>
          </div>
        </div>
      </div>
    `;
  }

  renderAdvancedStats(stats) {
    return `
      <div class="advanced-stats">
        <div class="stats-tabs">
          <button onclick="advancedApp.toggleCarbonData()" 
                  class="${this.uiState.showCarbonData ? 'active' : ''}">
            Carbon Data
          </button>
          <button onclick="advancedApp.toggleCacheStats()" 
                  class="${this.uiState.showCacheStats ? 'active' : ''}">
            Cache Stats
          </button>
        </div>

        ${this.uiState.showCarbonData ? `
          <div class="carbon-data">
            <h4>🌱 Carbon Intensity Data</h4>
            <div>Current: ${stats.carbon.carbonIntensity}</div>
            <div>Renewable: ${stats.carbon.renewablePercentage}%</div>
            <div>Tasks Scheduled: ${stats.carbon.tasksScheduled}</div>
            <div>Tasks Executed: ${stats.carbon.tasksExecuted}</div>
          </div>
        ` : ''}

        ${this.uiState.showCacheStats ? `
          <div class="cache-stats">
            <h4>📊 Cache Statistics</h4>
            <div>Hit Rate: ${stats.cache.hitRate}%</div>
            <div>Patterns Learned: ${stats.cache.patternsLearned}</div>
            <div>Recent Accesses: ${stats.cache.recentAccesses}</div>
            <div>Carbon Intensity: ${stats.cache.carbonIntensity}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    
    // Simple DOM notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      background: ${type === 'error' ? '#e53e3e' : type === 'success' ? '#38a169' : '#3182ce'};
      z-index: 1000;
      animation: slideIn 0.3s ease;
      max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }
}

// Initialize the advanced enterprise app
const advancedApp = new AdvancedEnterpriseApp();
window.advancedApp = advancedApp;

// Initial render
advancedApp.render();

// Add some sample data
setTimeout(() => {
  const sampleData = {
    documents: [
      { id: 1, title: 'Q4 Financial Report', type: 'financial' },
      { id: 2, title: 'Product Roadmap 2024', type: 'planning' },
      { id: 3, title: 'Security Audit Results', type: 'security' }
    ],
    analytics: {
      userEngagement: 87.5,
      performanceMetrics: {
        loadTime: 1200,
        cacheHitRate: 89
      }
    },
    userPreferences: {
      theme: 'dark',
      notifications: true,
      carbonAware: true
    }
  };
  
  advancedApp.dataStore.set(sampleData);
}, 500);

console.log('🚀 Advanced Features Demo initialized!');
console.log('🌟 Features enabled: Smart Caching, Carbon-Aware Scheduling, Predictive Pre-caching');
console.log('📊 Available methods:', Object.getOwnPropertyNames(advancedApp).filter(name => typeof advancedApp[name] === 'function'));
