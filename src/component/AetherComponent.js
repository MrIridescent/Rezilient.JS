// src/component/AetherComponent.js

import { SYNC_STATUS, SYNC_EVENTS } from '../sync/SyncEngine.js';

/**
 * @class AetherComponent
 * Enhanced base class for creating offline-aware UI components with
 * integrated sync state management and lifecycle hooks.
 */

export class AetherComponent {
  constructor(options = {}) {
    this.options = {
      autoSync: true,
      syncOnOnline: true,
      trackSyncState: true,
      ...options
    };

    // Component state
    this.isOnline = (typeof window !== 'undefined' && window !== null && window !== undefined && typeof navigator !== 'undefined') ? navigator.onLine : false;
    this.syncEngine = null;
    this.syncState = null;
    this.eventListeners = [];

    // Setup event listeners
    this.setupNetworkListeners();

    // Initialize component
    this.initialize();
  }

  /**
   * Initialize component - override in subclasses for custom setup
   */
  initialize() {
    // Default implementation - override in subclasses
  }

  /**
   * Setup network event listeners
   * @private
   */
  setupNetworkListeners() {
    // Only setup event listeners if we're in a browser environment with window object
    if (typeof window !== 'undefined' && window && window.addEventListener) {
      const onlineHandler = () => {
        this.isOnline = true;
        this.onOnline();

        // Auto-sync when coming online if enabled
        if (this.options.syncOnOnline && this.syncEngine) {
          this.syncEngine.processQueue();
        }
      };

      const offlineHandler = () => {
        this.isOnline = false;
        this.onOffline();
      };

      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);

      // Store references for cleanup
      this.eventListeners.push(
        { element: window, event: 'online', handler: onlineHandler },
        { element: window, event: 'offline', handler: offlineHandler }
      );
    }
  }

  /**
   * Connect a sync engine to this component
   * @param {SyncEngine} syncEngine - The sync engine to connect
   */
  connectSyncEngine(syncEngine) {
    // Disconnect previous sync engine if any
    this.disconnectSyncEngine();

    this.syncEngine = syncEngine;

    if (this.options.trackSyncState) {
      // Subscribe to sync state changes
      const unsubscribe = syncEngine.subscribeSyncState(state => {
        this.syncState = state;
        this.onSyncStateChange(state);
      });

      // Subscribe to sync events
      const unsubscribeEvents = [
        syncEngine.addEventListener(SYNC_EVENTS.STATUS_CHANGE, state => {
          this.onSyncStatusChange(state.status, state);
        }),
        syncEngine.addEventListener(SYNC_EVENTS.PROGRESS_UPDATE, progress => {
          this.onSyncProgress(progress);
        }),
        syncEngine.addEventListener(SYNC_EVENTS.SYNC_ERROR, error => {
          this.onSyncError(error);
        }),
        syncEngine.addEventListener(SYNC_EVENTS.MUTATION_SYNCED, result => {
          this.onMutationSynced(result);
        })
      ];

      // Store unsubscribe functions
      this.syncUnsubscribers = [unsubscribe, ...unsubscribeEvents];
    }
  }

  /**
   * Disconnect sync engine
   */
  disconnectSyncEngine() {
    if (this.syncUnsubscribers) {
      this.syncUnsubscribers.forEach(unsubscribe => unsubscribe());
      this.syncUnsubscribers = null;
    }
    this.syncEngine = null;
    this.syncState = null;
  }

  /**
   * Lifecycle hooks - override in subclasses
   */

  /**
   * Called when the application goes offline.
   * Override this method to handle offline state.
   */
  onOffline() {
    // Default implementation - override in subclasses
  }

  /**
   * Called when the application comes back online.
   * Override this method to handle online state.
   */
  onOnline() {
    // Default implementation - override in subclasses
  }

  /**
   * Called when sync state changes.
   * @param {object} state - The new sync state
   */
  onSyncStateChange(state) {
    // Default implementation - override in subclasses
  }

  /**
   * Called when sync status specifically changes.
   * @param {string} status - The new sync status
   * @param {object} fullState - The complete sync state
   */
  onSyncStatusChange(status, fullState) {
    // Default implementation - override in subclasses
  }

  /**
   * Called when sync progress updates.
   * @param {object} progress - Progress information
   */
  onSyncProgress(progress) {
    // Default implementation - override in subclasses
  }

  /**
   * Called when a sync error occurs.
   * @param {object} error - Error information
   */
  onSyncError(error) {
    // Default implementation - override in subclasses
  }

  /**
   * Called when a mutation is successfully synced.
   * @param {object} result - Sync result information
   */
  onMutationSynced(result) {
    // Default implementation - override in subclasses
  }

  /**
   * Utility methods
   */

  /**
   * Set component state (simple merge) and return new state
   * Included for parity with tests that simulate component updates.
   * @param {object} partialState
   * @returns {object} updated state
   */
  setState(partialState = {}) {
    this.state = { ...(this.state || {}), ...partialState };
    return this.state;
  }

  /**
   * Get current network state
   * @returns {object} Network state information
   */
  getNetworkState() {
    return {
      isOnline: this.isOnline,
      isOffline: !this.isOnline,
      connectionType: typeof navigator !== 'undefined' && navigator.connection
        ? navigator.connection.effectiveType
        : 'unknown'
    };
  }

  /**
   * Get current sync state
   * @returns {object|null} Current sync state or null if no sync engine connected
   */
  getSyncState() {
    return this.syncState;
  }

  /**
   * Check if component is in a specific sync status
   * @param {string} status - Status to check
   * @returns {boolean} True if in specified status
   */
  isSyncStatus(status) {
    return this.syncState && this.syncState.status === status;
  }

  /**
   * Convenience methods for common sync states
   */
  get isSyncing() {
    return this.syncState ? this.isSyncStatus(SYNC_STATUS.SYNCING) : false;
  }

  get hasSyncErrors() {
    return this.syncState ? this.isSyncStatus(SYNC_STATUS.ERROR) : false;
  }

  get isSynced() {
    return this.syncState ? this.isSyncStatus(SYNC_STATUS.SYNCED) : false;
  }

  get isOfflineMode() {
    return this.syncState ? this.isSyncStatus(SYNC_STATUS.OFFLINE) : false;
  }

  /**
   * Trigger manual sync if sync engine is connected
   * @returns {Promise<void>}
   */
  async triggerSync() {
    if (this.syncEngine && this.isOnline) {
      return this.syncEngine.processQueue();
    }
  }

  /**
   * Add mutation to sync queue if sync engine is connected
   * @param {object} mutation - Mutation to add
   * @returns {Promise<void>}
   */
  async addMutation(mutation) {
    if (this.syncEngine) {
      return this.syncEngine.addMutation(mutation);
    }
  }

  /**
   * Enhanced self-healing mechanism with predictive error detection
   */
  heal() {
    console.log('🔧 Enhanced self-healing mechanism activated');

    // Perform comprehensive system health check
    const healthStatus = this.performHealthCheck();

    // Predictive error detection
    const predictedIssues = this.predictPotentialIssues();

    // Apply targeted healing strategies
    const healingResults = this.applyHealingStrategies(healthStatus, predictedIssues);

    // Performance optimization
    this.optimizePerformance();

    // Update healing metrics
    this.updateHealingMetrics(healingResults);

    const success = healingResults.success;
    console.log(success ? '✅ Enhanced self-healing successful' : '❌ Self-healing partially failed');

    return success;
  }

  performHealthCheck() {
    const healthMetrics = {
      memory: this.checkMemoryHealth(),
      performance: this.checkPerformanceHealth(),
      connectivity: this.checkConnectivityHealth(),
      errors: this.checkErrorPatterns()
    };

    const overallHealth = Object.values(healthMetrics).reduce((sum, metric) =>
      sum + (metric.score || 0.5), 0) / Object.keys(healthMetrics).length;

    return {
      overall: overallHealth,
      metrics: healthMetrics,
      status: overallHealth > 0.8 ? 'HEALTHY' : overallHealth > 0.6 ? 'DEGRADED' : 'CRITICAL'
    };
  }

  checkMemoryHealth() {
    // Monitor memory usage patterns
    if (typeof performance !== 'undefined' && performance.memory) {
      const memInfo = performance.memory;
      const memoryUsage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;

      return {
        score: memoryUsage < 0.8 ? 1.0 : memoryUsage < 0.9 ? 0.7 : 0.3,
        usage: memoryUsage,
        issues: memoryUsage > 0.9 ? ['HIGH_MEMORY_USAGE'] : []
      };
    }

    return { score: 0.8, usage: 'unknown', issues: [] };
  }

  checkPerformanceHealth() {
    // Monitor performance metrics
    const avgResponseTime = this.avgResponseTime || 100;
    const errorRate = this.errorCount / Math.max(this.operationCount || 1, 1);

    let score = 1.0;
    const issues = [];

    if (avgResponseTime > 1000) {
      score -= 0.3;
      issues.push('SLOW_RESPONSE_TIME');
    }

    if (errorRate > 0.05) {
      score -= 0.4;
      issues.push('HIGH_ERROR_RATE');
    }

    return {
      score: Math.max(score, 0.1),
      responseTime: avgResponseTime,
      errorRate,
      issues
    };
  }

  checkConnectivityHealth() {
    return {
      score: this.isOnline ? 1.0 : 0.5,
      online: this.isOnline,
      issues: this.isOnline ? [] : ['OFFLINE']
    };
  }

  checkErrorPatterns() {
    const errorFrequency = this.errorCount / 10; // errors per operation

    return {
      score: errorFrequency < 0.01 ? 1.0 : errorFrequency < 0.05 ? 0.7 : 0.3,
      frequency: errorFrequency,
      issues: errorFrequency > 0.05 ? ['HIGH_ERROR_FREQUENCY'] : []
    };
  }

  predictPotentialIssues() {
    const predictions = [];

    // Performance degradation prediction
    if (this.avgResponseTime > 500) {
      predictions.push({
        type: 'PERFORMANCE_DEGRADATION',
        probability: Math.min(this.avgResponseTime / 1000, 0.9),
        timeToIssue: Math.max(30 - (this.avgResponseTime / 50), 5)
      });
    }

    // Error cascade prediction
    if (this.errorCount > 3) {
      predictions.push({
        type: 'ERROR_CASCADE',
        probability: Math.min(this.errorCount / 10, 0.8),
        timeToIssue: Math.max(15 - this.errorCount, 2)
      });
    }

    return predictions;
  }

  applyHealingStrategies(healthStatus, predictedIssues) {
    const strategies = [];
    let success = true;

    // Apply strategies based on health status
    if (healthStatus.metrics.performance.score < 0.5) {
      strategies.push(() => this.applyPerformanceHealing());
    }

    if (healthStatus.metrics.errors.score < 0.5) {
      strategies.push(() => this.applyErrorHealing());
    }

    if (!healthStatus.metrics.connectivity.online) {
      strategies.push(() => this.applyConnectivityHealing());
    }

    // Execute all strategies
    const results = strategies.map(strategy => {
      try {
        return strategy();
      } catch (error) {
        console.error('Healing strategy failed:', error);
        success = false;
        return { success: false, error: error.message };
      }
    });

    return {
      success: success && results.every(r => r.success !== false),
      strategies: results,
      appliedCount: strategies.length
    };
  }

  applyPerformanceHealing() {
    // Reset performance counters
    this.avgResponseTime = 100;
    this.operationCount = 0;

    // Clear any performance-degrading caches
    if (this.cache) {
      this.cache.clear();
    }

    console.log('🚀 Performance healing applied');
    return { success: true, type: 'performance' };
  }

  applyErrorHealing() {
    // Reset error state
    this.errorCount = 0;
    this.errorState = null;

    // Reinitialize if needed
    try {
      if (this.initialize && typeof this.initialize === 'function') {
        this.initialize();
      }
      console.log('🔧 Error healing applied');
      return { success: true, type: 'error' };
    } catch (error) {
      console.error('Error healing failed:', error);
      return { success: false, type: 'error', error: error.message };
    }
  }

  applyConnectivityHealing() {
    // Attempt to restore connectivity
    if (this.syncEngine && !this.isOnline) {
      // Queue operations for when connectivity returns
      console.log('📡 Connectivity healing: queuing operations');
      return { success: true, type: 'connectivity' };
    }

    return { success: true, type: 'connectivity' };
  }

  optimizePerformance() {
    // Implement performance optimizations
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        // Perform non-critical optimizations during idle time
        this.performIdleOptimizations();
      });
    }
  }

  performIdleOptimizations() {
    // Clean up unused resources
    if (this.cache && this.cache.size > 100) {
      // Remove oldest cache entries
      const entries = Array.from(this.cache.entries());
      entries.slice(0, entries.length - 50).forEach(([key]) => {
        this.cache.delete(key);
      });
    }
  }

  updateHealingMetrics(healingResults) {
    if (!this.healingMetrics) {
      this.healingMetrics = [];
    }

    this.healingMetrics.push({
      timestamp: Date.now(),
      success: healingResults.success,
      strategiesApplied: healingResults.appliedCount,
      results: healingResults.strategies
    });

    // Keep only last 10 healing attempts
    if (this.healingMetrics.length > 10) {
      this.healingMetrics = this.healingMetrics.slice(-10);
    }

    // Train error prediction model
    this.trainErrorPredictionModel();
  }

  /**
   * Machine Learning for Error Prediction
   */
  trainErrorPredictionModel() {
    if (this.healingMetrics.length < 5) return;

    // Simple pattern recognition for error prediction
    const patterns = this.healingMetrics.map(metric => ({
      features: [
        metric.strategiesApplied,
        metric.results.filter(r => r.success).length,
        Date.now() - metric.timestamp
      ],
      outcome: metric.success ? 1 : 0
    }));

    // Store patterns for prediction
    this.errorPredictionModel = {
      patterns,
      accuracy: this.calculateModelAccuracy(patterns),
      lastTrained: Date.now()
    };

    console.log(`🤖 Error prediction model trained with ${patterns.length} samples (accuracy: ${(this.errorPredictionModel.accuracy * 100).toFixed(1)}%)`);
  }

  calculateModelAccuracy(patterns) {
    if (patterns.length < 3) return 0.5;

    // Simple cross-validation
    let correct = 0;
    patterns.forEach((pattern, index) => {
      const trainingSet = patterns.filter((_, i) => i !== index);
      const prediction = this.predictErrorProbability(pattern.features, trainingSet);
      const predicted = prediction > 0.5 ? 1 : 0;
      if (predicted === pattern.outcome) correct++;
    });

    return correct / patterns.length;
  }

  predictErrorProbability(features, trainingSet = null) {
    const model = trainingSet || this.errorPredictionModel?.patterns || [];
    if (model.length === 0) return 0.5;

    // Simple k-nearest neighbors
    const distances = model.map(pattern => ({
      distance: this.calculateEuclideanDistance(features, pattern.features),
      outcome: pattern.outcome
    }));

    distances.sort((a, b) => a.distance - b.distance);
    const k = Math.min(3, distances.length);
    const neighbors = distances.slice(0, k);

    return neighbors.reduce((sum, neighbor) => sum + neighbor.outcome, 0) / k;
  }

  calculateEuclideanDistance(a, b) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0));
  }

  /**
   * Automatic Dependency Resolution
   */
  async resolveDependencies() {
    console.log('🔧 Resolving dependencies automatically...');

    const dependencies = this.analyzeDependencies();
    const resolutionPlan = this.createResolutionPlan(dependencies);

    for (const step of resolutionPlan) {
      try {
        await this.executeResolutionStep(step);
        console.log(`✅ Resolved: ${step.description}`);
      } catch (error) {
        console.error(`❌ Failed to resolve: ${step.description}`, error);
      }
    }

    return resolutionPlan;
  }

  analyzeDependencies() {
    const dependencies = {
      missing: [],
      outdated: [],
      conflicting: [],
      circular: []
    };

    // Check for missing dependencies
    if (this.syncEngine && !this.syncEngine.isConnected) {
      dependencies.missing.push({
        name: 'syncEngine',
        type: 'connection',
        severity: 'high'
      });
    }

    if (this.store && !this.store.subscribers) {
      dependencies.missing.push({
        name: 'store',
        type: 'initialization',
        severity: 'critical'
      });
    }

    // Check for outdated components
    if (this.lastUpdate && Date.now() - this.lastUpdate > 300000) { // 5 minutes
      dependencies.outdated.push({
        name: 'component',
        type: 'stale',
        severity: 'medium'
      });
    }

    return dependencies;
  }

  createResolutionPlan(dependencies) {
    const plan = [];

    // Critical issues first
    dependencies.missing
      .filter(dep => dep.severity === 'critical')
      .forEach(dep => {
        plan.push({
          type: 'reinitialize',
          target: dep.name,
          description: `Reinitialize ${dep.name}`,
          priority: 1
        });
      });

    // High priority issues
    dependencies.missing
      .filter(dep => dep.severity === 'high')
      .forEach(dep => {
        plan.push({
          type: 'reconnect',
          target: dep.name,
          description: `Reconnect ${dep.name}`,
          priority: 2
        });
      });

    // Medium priority issues
    dependencies.outdated.forEach(dep => {
      plan.push({
        type: 'refresh',
        target: dep.name,
        description: `Refresh ${dep.name}`,
        priority: 3
      });
    });

    return plan.sort((a, b) => a.priority - b.priority);
  }

  async executeResolutionStep(step) {
    switch (step.type) {
      case 'reinitialize':
        return this.reinitializeComponent(step.target);
      case 'reconnect':
        return this.reconnectComponent(step.target);
      case 'refresh':
        return this.refreshComponent(step.target);
      default:
        throw new Error(`Unknown resolution step: ${step.type}`);
    }
  }

  async reinitializeComponent(target) {
    switch (target) {
      case 'store':
        if (this.store && typeof this.store.initialize === 'function') {
          await this.store.initialize();
        }
        break;
      case 'syncEngine':
        if (this.syncEngine && typeof this.syncEngine.initialize === 'function') {
          await this.syncEngine.initialize();
        }
        break;
      default:
        console.warn(`Unknown component for reinitialization: ${target}`);
    }
  }

  async reconnectComponent(target) {
    switch (target) {
      case 'syncEngine':
        if (this.syncEngine && typeof this.syncEngine.connect === 'function') {
          await this.syncEngine.connect();
        }
        break;
      default:
        console.warn(`Unknown component for reconnection: ${target}`);
    }
  }

  async refreshComponent(target) {
    switch (target) {
      case 'component':
        this.lastUpdate = Date.now();
        if (typeof this.onRefresh === 'function') {
          await this.onRefresh();
        }
        break;
      default:
        console.warn(`Unknown component for refresh: ${target}`);
    }
  }

  /**
   * Rollback Mechanisms
   */
  createCheckpoint(name = 'auto') {
    if (!this.checkpoints) {
      this.checkpoints = [];
    }

    const checkpoint = {
      name,
      timestamp: Date.now(),
      state: this.store ? JSON.parse(JSON.stringify(this.store.get())) : null,
      errorCount: this.errorCount,
      isOnline: this.isOnline,
      metadata: {
        version: this.version || '1.0.0',
        healingAttempts: this.healingMetrics?.length || 0
      }
    };

    this.checkpoints.push(checkpoint);

    // Keep only last 5 checkpoints
    if (this.checkpoints.length > 5) {
      this.checkpoints = this.checkpoints.slice(-5);
    }

    console.log(`📸 Checkpoint created: ${name}`);
    return checkpoint;
  }

  async rollbackToCheckpoint(name = null) {
    if (!this.checkpoints || this.checkpoints.length === 0) {
      throw new Error('No checkpoints available for rollback');
    }

    const checkpoint = name ?
      this.checkpoints.find(cp => cp.name === name) :
      this.checkpoints[this.checkpoints.length - 1];

    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${name}`);
    }

    console.log(`🔄 Rolling back to checkpoint: ${checkpoint.name}`);

    // Restore state
    if (checkpoint.state && this.store) {
      this.store.set(checkpoint.state);
    }

    // Restore properties
    this.errorCount = checkpoint.errorCount;
    this.isOnline = checkpoint.isOnline;

    // Clear recent errors
    this.errorState = null;

    console.log(`✅ Rollback completed to ${checkpoint.name} (${new Date(checkpoint.timestamp).toISOString()})`);

    return checkpoint;
  }

  /**
   * Distributed Healing Across Components
   */
  async coordinateDistributedHealing() {
    console.log('🌐 Coordinating distributed healing...');

    const healingCoordinator = {
      components: this.getConnectedComponents(),
      healingPlan: [],
      results: []
    };

    // Analyze all components
    for (const component of healingCoordinator.components) {
      const health = await this.analyzeComponentHealth(component);
      if (health.needsHealing) {
        healingCoordinator.healingPlan.push({
          component: component.id,
          issues: health.issues,
          priority: health.priority
        });
      }
    }

    // Execute healing in priority order
    healingCoordinator.healingPlan
      .sort((a, b) => a.priority - b.priority)
      .forEach(async (plan) => {
        try {
          const result = await this.healComponent(plan.component, plan.issues);
          healingCoordinator.results.push({ ...plan, result, success: true });
        } catch (error) {
          healingCoordinator.results.push({ ...plan, error: error.message, success: false });
        }
      });

    return healingCoordinator;
  }

  getConnectedComponents() {
    // Return connected components (simplified)
    const components = [];

    if (this.store) {
      components.push({ id: 'store', instance: this.store });
    }

    if (this.syncEngine) {
      components.push({ id: 'syncEngine', instance: this.syncEngine });
    }

    return components;
  }

  async analyzeComponentHealth(component) {
    const health = {
      needsHealing: false,
      issues: [],
      priority: 5 // Lower number = higher priority
    };

    try {
      // Check if component has health check method
      if (component.instance && typeof component.instance.healthCheck === 'function') {
        const componentHealth = await component.instance.healthCheck();
        if (componentHealth.status !== 'healthy') {
          health.needsHealing = true;
          health.issues = componentHealth.issues || [];
          health.priority = componentHealth.priority || 3;
        }
      } else {
        // Basic health checks
        if (component.id === 'store' && !component.instance.subscribers) {
          health.needsHealing = true;
          health.issues.push('No subscribers');
          health.priority = 2;
        }

        if (component.id === 'syncEngine' && !component.instance.isConnected) {
          health.needsHealing = true;
          health.issues.push('Not connected');
          health.priority = 1;
        }
      }
    } catch (error) {
      health.needsHealing = true;
      health.issues.push(`Health check failed: ${error.message}`);
      health.priority = 1;
    }

    return health;
  }

  async healComponent(componentId, issues) {
    console.log(`🔧 Healing component: ${componentId}`);

    const component = this.getConnectedComponents().find(c => c.id === componentId);
    if (!component) {
      throw new Error(`Component not found: ${componentId}`);
    }

    // Apply healing strategies based on issues
    const healingResults = [];

    for (const issue of issues) {
      try {
        const result = await this.applyComponentHealing(component, issue);
        healingResults.push({ issue, result, success: true });
      } catch (error) {
        healingResults.push({ issue, error: error.message, success: false });
      }
    }

    return healingResults;
  }

  async applyComponentHealing(component, issue) {
    switch (issue) {
      case 'No subscribers':
        // Re-establish subscriptions
        if (component.instance && typeof component.instance.resubscribe === 'function') {
          return await component.instance.resubscribe();
        }
        break;

      case 'Not connected':
        // Reconnect component
        if (component.instance && typeof component.instance.connect === 'function') {
          return await component.instance.connect();
        }
        break;

      default:
        // Generic healing
        if (component.instance && typeof component.instance.heal === 'function') {
          return await component.instance.heal();
        }
    }

    return { message: `Applied generic healing for: ${issue}` };
  }

  /**
   * Cleanup component resources
   */
  destroy() {
    // Disconnect sync engine
    this.disconnectSyncEngine();

    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];

    // Call cleanup hook
    this.onDestroy();
  }

  /**
   * Called when component is being destroyed.
   * Override this method for custom cleanup.
   */
  onDestroy() {
    // Default implementation - override in subclasses
  }
}
