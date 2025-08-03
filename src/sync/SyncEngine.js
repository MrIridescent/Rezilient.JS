// src/sync/SyncEngine.js

import { get, set, del } from 'idb-keyval';
import { PersistentStore } from '../data/PersistentStore.js';
import { AetherStore } from '../data/AetherStore.js';
import { CacheManager } from '../cache/CacheManager.js';
import { CarbonAwareScheduler } from '../scheduler/CarbonAwareScheduler.js';

const MUTATION_QUEUE_KEY = 'aether-mutation-queue';

// Sync status constants
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  ERROR: 'error',
  SYNCED: 'synced',
  OFFLINE: 'offline'
};

// Sync event types
export const SYNC_EVENTS = {
  STATUS_CHANGE: 'sync-status-change',
  PROGRESS_UPDATE: 'sync-progress-update',
  MUTATION_SYNCED: 'mutation-synced',
  SYNC_ERROR: 'sync-error',
  QUEUE_UPDATED: 'queue-updated'
};

/**
 * @class SyncEngine
 * Enhanced sync engine with real-time status updates, progress tracking,
 * and intelligent error handling for the Aether.js Resilient-First paradigm.
 */

export class SyncEngine {
  /**
   * @param {Object} [options]
   * @param {'LastWriteWins'|'ServerWins'|function} [options.conflictStrategy] - Conflict resolution strategy.
   * @param {number} [options.retryAttempts=3] - Number of retry attempts for failed mutations.
   * @param {number} [options.retryDelay=1000] - Delay between retry attempts in milliseconds.
   * @param {boolean} [options.enableProgressTracking=true] - Enable detailed progress tracking.
   * @param {boolean} [options.enableAdvancedCaching=true] - Enable advanced caching strategies.
   * @param {boolean} [options.enableCarbonAware=true] - Enable carbon-aware scheduling.
   */
  constructor(options = {}) {
    this.queue = new PersistentStore(MUTATION_QUEUE_KEY, []);
    this.isSyncing = false;
    this.conflictStrategy = options.conflictStrategy || 'LastWriteWins';
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.enableProgressTracking = options.enableProgressTracking !== false;
    this.enableAdvancedCaching = options.enableAdvancedCaching !== false;
    this.enableCarbonAware = options.enableCarbonAware !== false;

    // Enhanced sync state management
    this.syncState = new AetherStore({
      status: SYNC_STATUS.IDLE,
      progress: { current: 0, total: 0, percentage: 0 },
      pending: 0,
      error: null,
      lastSync: null,
      retryCount: 0
    });

    // Event listeners for sync state changes
    this.eventListeners = new Map();

    // Network state tracking
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    this.setupEventListeners();
    this.initializeSyncState();
    this.initializeAdvancedFeatures();
  }

  /**
   * Initialize advanced features (caching and carbon-aware scheduling)
   * @private
   */
  async initializeAdvancedFeatures() {
    // Initialize cache manager
    if (this.enableAdvancedCaching) {
      this.cacheManager = new CacheManager({
        enablePredictiveCaching: true,
        enableCarbonAware: this.enableCarbonAware
      });
    }

    // Initialize carbon-aware scheduler
    if (this.enableCarbonAware) {
      this.carbonScheduler = new CarbonAwareScheduler({
        enableCarbonAwareness: true
      });
    }
  }

  /**
   * Setup event listeners for network and sync events
   * @private
   */
  setupEventListeners() {
    // Only setup event listeners if we're in a browser environment with window object
    if (typeof window !== 'undefined' && window && window.addEventListener) {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.updateSyncStatus(SYNC_STATUS.IDLE);
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.updateSyncStatus(SYNC_STATUS.OFFLINE);
      });
    }
  }

  /**
   * Initialize sync state based on current conditions
   * @private
   */
  async initializeSyncState() {
    const queueLength = (await this.queue.get()).length;
    this.updateSyncState({
      pending: queueLength,
      status: this.isOnline ? SYNC_STATUS.IDLE : SYNC_STATUS.OFFLINE
    });
  }

  /**
   * Enhanced sync state management methods
   */

  /**
   * Update sync state and notify listeners
   * @private
   */
  updateSyncState(updates) {
    this.syncState.update(current => ({ ...current, ...updates }));
    this.emitEvent(SYNC_EVENTS.STATUS_CHANGE, this.syncState.get());
  }

  /**
   * Update sync status specifically
   * @private
   */
  updateSyncStatus(status) {
    this.updateSyncState({ status });
  }

  /**
   * Update sync progress
   * @private
   */
  updateProgress(current, total) {
    if (!this.enableProgressTracking) return;

    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const progress = { current, total, percentage };

    this.updateSyncState({ progress });
    this.emitEvent(SYNC_EVENTS.PROGRESS_UPDATE, progress);
  }

  /**
   * Emit sync events to listeners
   * @private
   */
  emitEvent(eventType, data) {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in sync event listener for ${eventType}:`, error);
      }
    });
  }

  /**
   * Subscribe to sync events
   * @param {string} eventType - Event type to listen for
   * @param {function} listener - Event listener function
   * @returns {function} Unsubscribe function
   */
  addEventListener(eventType, listener) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }

    this.eventListeners.get(eventType).push(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(eventType) || [];
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current sync state
   * @returns {object} Current sync state
   */
  getSyncState() {
    return this.syncState.get();
  }

  /**
   * Get current sync state (alias for getSyncState)
   * @returns {object} Current sync state
   */
  getState() {
    return this.getSyncState();
  }

  /**
   * Subscribe to sync state changes
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  subscribeSyncState(callback) {
    return this.syncState.subscribe(callback);
  }

  /**
   * Adds a mutation to the queue with enhanced tracking.
   * @param {object} mutation - The mutation object to add.
   * It should contain all information needed to perform the action later.
   * e.g., { type: 'ADD_ITEM', payload: { id: 1, text: 'New item' } }
   */
  async addMutation(mutation) {
    // Add metadata to mutation
    const enhancedMutation = {
      ...mutation,
      id: mutation.id || this.generateMutationId(),
      timestamp: mutation.timestamp || Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    const currentQueue = (await this.queue.get()) || [];
    const newQueue = [...currentQueue, enhancedMutation];
    await this.queue.set(newQueue);

    // Update sync state
    this.updateSyncState({ pending: newQueue.length });
    this.emitEvent(SYNC_EVENTS.QUEUE_UPDATED, {
      action: 'added',
      mutation: enhancedMutation,
      queueLength: newQueue.length
    });

    // Auto-process if online and not already syncing
    if (this.isOnline && !this.isSyncing) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Generate unique mutation ID
   * @private
   */
  generateMutationId() {
    return `mutation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enhanced queue processing with progress tracking, error recovery, and carbon-aware scheduling.
   * This method should be called when the application comes online.
   */
  async processQueue(options = {}) {
    // Guard clauses
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    if (!this.isOnline) {
      console.log('Device is offline, cannot sync');
      this.updateSyncStatus(SYNC_STATUS.OFFLINE);
      return;
    }

    const mutations = (await this.queue.get()) || [];

    if (mutations.length === 0) {
      this.updateSyncState({
        status: SYNC_STATUS.SYNCED,
        pending: 0,
        error: null
      });
      return;
    }

    // Use carbon-aware scheduling if enabled
    if (this.enableCarbonAware && this.carbonScheduler && !options.force) {
      return this.processQueueWithCarbonAwareness(mutations, options);
    }

    // Start sync process
    this.isSyncing = true;
    this.updateSyncState({
      status: SYNC_STATUS.SYNCING,
      error: null,
      retryCount: 0
    });

    const totalMutations = mutations.length;
    let processedCount = 0;
    const failedMutations = [];
    const successfulMutations = [];

    this.updateProgress(0, totalMutations);

    // Process mutations with enhanced error handling
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];

      try {
        // Update progress
        this.updateProgress(i, totalMutations);

        // Process single mutation with retry logic
        const result = await this.processSingleMutation(mutation);

        if (result.success) {
          successfulMutations.push(mutation);
          this.emitEvent(SYNC_EVENTS.MUTATION_SYNCED, {
            mutation,
            result: result.data
          });
        } else {
          failedMutations.push({
            mutation,
            error: result.error,
            retryCount: mutation.retryCount || 0
          });
        }

        processedCount++;

      } catch (error) {
        console.error('Failed to sync mutation:', mutation, error);
        failedMutations.push({
          mutation,
          error,
          retryCount: mutation.retryCount || 0
        });
      }
    }

    // Update final progress
    this.updateProgress(totalMutations, totalMutations);

    // Handle results
    await this.handleSyncResults(successfulMutations, failedMutations);

    this.isSyncing = false;
  }

  /**
   * Process queue with carbon-aware scheduling
   * @private
   */
  async processQueueWithCarbonAwareness(mutations, options = {}) {
    const priority = options.priority || 'normal';

    // Group mutations by type for batch processing
    const mutationGroups = this.groupMutationsByType(mutations);

    for (const [type, groupMutations] of mutationGroups) {
      const batchTask = {
        type: 'sync-batch',
        data: groupMutations,
        execute: async (mutations) => {
          return this.processMutationBatch(mutations);
        },
        estimatedDuration: groupMutations.length * 500 // Estimate 500ms per mutation
      };

      // Schedule with carbon awareness
      await this.carbonScheduler.scheduleTask(batchTask, priority, {
        carbonAware: true,
        networkAware: true,
        batteryAware: true
      });
    }
  }

  /**
   * Group mutations by type for efficient batch processing
   * @private
   */
  groupMutationsByType(mutations) {
    const groups = new Map();

    for (const mutation of mutations) {
      const type = mutation.type || 'default';
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type).push(mutation);
    }

    return groups;
  }

  /**
   * Process a batch of mutations
   * @private
   */
  async processMutationBatch(mutations) {
    const results = [];

    for (const mutation of mutations) {
      try {
        const result = await this.processSingleMutation(mutation);
        results.push({ mutation, result });
      } catch (error) {
        results.push({ mutation, error });
      }
    }

    // Update queue after batch processing
    await this.updateQueueAfterBatch(results);

    return results;
  }

  /**
   * Update queue after batch processing
   * @private
   */
  async updateQueueAfterBatch(results) {
    const currentQueue = await this.queue.get();
    const successfulMutations = results
      .filter(r => r.result && r.result.success)
      .map(r => r.mutation);

    // Remove successful mutations from queue
    const updatedQueue = currentQueue.filter(queueMutation =>
      !successfulMutations.some(successful =>
        successful.id === queueMutation.id
      )
    );

    await this.queue.set(updatedQueue);

    // Update sync state
    this.updateSyncState({
      pending: updatedQueue.length,
      status: updatedQueue.length === 0 ? SYNC_STATUS.SYNCED : SYNC_STATUS.IDLE
    });
  }

  /**
   * Process a single mutation with retry logic
   * @private
   */
  async processSingleMutation(mutation) {
    let lastError = null;
    const maxRetries = mutation.retryCount < this.retryAttempts ?
      this.retryAttempts - mutation.retryCount : 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Fetch server state for conflict resolution
        const serverState = await this.fetchServerState(mutation);
        let resolvedMutation = mutation;

        // Conflict resolution
        if (serverState && this.hasConflict(mutation, serverState)) {
          if (typeof this.conflictStrategy === 'function') {
            resolvedMutation = this.conflictStrategy(mutation, serverState);
            if (!resolvedMutation) {
              // Custom resolver decided to skip this mutation
              return { success: true, data: { skipped: true, reason: 'conflict_resolved' } };
            }
          } else if (this.conflictStrategy === 'ServerWins') {
            // Discard local mutation
            return { success: true, data: { skipped: true, reason: 'server_wins' } };
          } else if (this.conflictStrategy === 'LastWriteWins') {
            // Default: apply local mutation
          }
        }

        // Attempt to sync the mutation
        const result = await this.syncMutation(resolvedMutation);
        return { success: true, data: result };

      } catch (error) {
        lastError = error;

        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    return {
      success: false,
      error: lastError,
      retriesExhausted: true
    };
  }

  /**
   * Handle sync results and update queue
   * @private
   */
  async handleSyncResults(successfulMutations, failedMutations) {
    const currentQueue = await this.queue.get();

    // Remove successful mutations from queue
    const remainingQueue = currentQueue.filter(queueMutation =>
      !successfulMutations.some(successful =>
        successful.id === queueMutation.id
      )
    );

    // Update failed mutations with retry count
    const updatedFailedMutations = failedMutations.map(failed => ({
      ...failed.mutation,
      retryCount: (failed.mutation.retryCount || 0) + 1,
      lastError: failed.error.message,
      lastAttempt: Date.now()
    }));

    // Keep failed mutations that haven't exceeded retry limit
    const retriableMutations = updatedFailedMutations.filter(mutation =>
      mutation.retryCount < this.retryAttempts
    );

    // Final queue with only retriable mutations
    const finalQueue = remainingQueue.map(queueMutation => {
      const failedUpdate = retriableMutations.find(failed =>
        failed.id === queueMutation.id
      );
      return failedUpdate || queueMutation;
    });

    await this.queue.set(finalQueue);

    // Update sync state
    const hasErrors = failedMutations.length > 0;
    const allRetryExhausted = failedMutations.every(f => f.retriesExhausted);

    this.updateSyncState({
      status: hasErrors ?
        (allRetryExhausted ? SYNC_STATUS.ERROR : SYNC_STATUS.IDLE) :
        SYNC_STATUS.SYNCED,
      pending: finalQueue.length,
      error: hasErrors ? failedMutations[0].error : null,
      lastSync: Date.now()
    });

    // Emit error events for failed mutations
    if (hasErrors) {
      failedMutations.forEach(failed => {
        this.emitEvent(SYNC_EVENTS.SYNC_ERROR, {
          mutation: failed.mutation,
          error: failed.error,
          retryCount: failed.mutation.retryCount || 0,
          retriesExhausted: failed.retriesExhausted
        });
      });
    }

    // Schedule retry for retriable mutations
    if (retriableMutations.length > 0 && this.isOnline) {
      setTimeout(() => {
        if (!this.isSyncing) {
          this.processQueue();
        }
      }, this.retryDelay * 2);
    }
  }

  /**
   * Simulate fetching the latest server state for a resource.
   * In a real implementation, this would fetch from the server.
   */
  async fetchServerState(mutation) {
    // Placeholder: return null to indicate no conflict by default
    return null;
  }

  /**
   * Determines if there is a conflict between the mutation and server state.
   * @private
   */
  hasConflict(mutation, serverState) {
    // Placeholder: always returns false (no conflict)
    // In a real implementation, compare mutation and serverState
    return false;
  }

  /**
   * Simulates syncing a single mutation to a server.
   * @param {object} mutation - The mutation to sync.
   * @private
   */
  async syncMutation(mutation) {
    // In a real implementation, this would be a fetch() call to your API.
    console.log('Syncing mutation:', mutation);
    return new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency
  }

  /**
   * Enhanced utility methods
   */

  /**
   * Returns the current mutation queue with metadata.
   * @returns {Promise<Array>} The current queue.
   */
  async getQueue() {
    const queue = await this.queue.get();
    return queue.map(mutation => ({
      ...mutation,
      age: Date.now() - (mutation.timestamp || 0),
      canRetry: (mutation.retryCount || 0) < this.retryAttempts
    }));
  }

  /**
   * Get queue statistics
   * @returns {Promise<object>} Queue statistics
   */
  async getQueueStats() {
    const queue = await this.getQueue();
    const now = Date.now();

    return {
      total: queue.length,
      pending: queue.filter(m => m.status === 'pending').length,
      failed: queue.filter(m => (m.retryCount || 0) >= this.retryAttempts).length,
      retriable: queue.filter(m => m.canRetry).length,
      oldestMutation: queue.length > 0 ?
        Math.max(...queue.map(m => now - (m.timestamp || 0))) : 0,
      averageAge: queue.length > 0 ?
        queue.reduce((sum, m) => sum + (now - (m.timestamp || 0)), 0) / queue.length : 0
    };
  }

  /**
   * Clear all mutations from queue (use with caution)
   * @returns {Promise<void>}
   */
  async clearQueue() {
    await this.queue.set([]);
    this.updateSyncState({
      pending: 0,
      status: SYNC_STATUS.IDLE,
      error: null
    });
    this.emitEvent(SYNC_EVENTS.QUEUE_UPDATED, {
      action: 'cleared',
      queueLength: 0
    });
  }

  /**
   * Remove specific mutation from queue
   * @param {string} mutationId - ID of mutation to remove
   * @returns {Promise<boolean>} True if mutation was found and removed
   */
  async removeMutation(mutationId) {
    const currentQueue = await this.queue.get();
    const filteredQueue = currentQueue.filter(m => m.id !== mutationId);

    if (filteredQueue.length !== currentQueue.length) {
      await this.queue.set(filteredQueue);
      this.updateSyncState({ pending: filteredQueue.length });
      this.emitEvent(SYNC_EVENTS.QUEUE_UPDATED, {
        action: 'removed',
        mutationId,
        queueLength: filteredQueue.length
      });
      return true;
    }

    return false;
  }

  /**
   * Force sync of specific mutation
   * @param {string} mutationId - ID of mutation to sync
   * @returns {Promise<boolean>} True if mutation was found and synced
   */
  async forceSyncMutation(mutationId) {
    const currentQueue = await this.queue.get();
    const mutation = currentQueue.find(m => m.id === mutationId);

    if (!mutation) {
      return false;
    }

    if (!this.isOnline) {
      throw new Error('Cannot force sync while offline');
    }

    try {
      const result = await this.processSingleMutation(mutation);

      if (result.success) {
        await this.removeMutation(mutationId);
        this.emitEvent(SYNC_EVENTS.MUTATION_SYNCED, {
          mutation,
          result: result.data,
          forced: true
        });
        return true;
      } else {
        throw result.error;
      }
    } catch (error) {
      this.emitEvent(SYNC_EVENTS.SYNC_ERROR, {
        mutation,
        error,
        forced: true
      });
      throw error;
    }
  }

  /**
   * Check if sync engine is healthy
   * @returns {Promise<object>} Health status
   */
  async getHealthStatus() {
    const stats = await this.getQueueStats();
    const state = this.getSyncState();

    const health = {
      status: 'healthy',
      issues: [],
      recommendations: []
    };

    // Check for issues
    if (!this.isOnline) {
      health.status = 'offline';
      health.issues.push('Device is offline');
    }

    if (stats.failed > 0) {
      health.status = 'degraded';
      health.issues.push(`${stats.failed} mutations have failed permanently`);
      health.recommendations.push('Review failed mutations and consider manual intervention');
    }

    if (stats.oldestMutation > 24 * 60 * 60 * 1000) { // 24 hours
      health.status = 'degraded';
      health.issues.push('Mutations older than 24 hours in queue');
      health.recommendations.push('Check network connectivity and server availability');
    }

    if (state.status === SYNC_STATUS.ERROR) {
      health.status = 'error';
      health.issues.push('Sync engine is in error state');
      health.recommendations.push('Check error details and retry sync');
    }

    return {
      ...health,
      stats,
      state,
      timestamp: Date.now()
    };
  }

  /**
   * Get advanced features statistics
   */
  getAdvancedStats() {
    const stats = {
      caching: null,
      carbonScheduling: null,
      features: {
        advancedCaching: this.enableAdvancedCaching,
        carbonAware: this.enableCarbonAware
      }
    };

    if (this.cacheManager) {
      stats.caching = this.cacheManager.getStats();
    }

    if (this.carbonScheduler) {
      stats.carbonScheduling = this.carbonScheduler.getStats();
    }

    return stats;
  }

  /**
   * Get carbon data if carbon-aware scheduling is enabled
   */
  getCarbonData() {
    if (this.carbonScheduler) {
      return this.carbonScheduler.getCarbonData();
    }
    return null;
  }

  /**
   * Force immediate sync (bypass carbon-aware scheduling)
   */
  async forceSync() {
    return this.processQueue({ force: true });
  }

  /**
   * Schedule predictive caching for a URL
   */
  async schedulePredictiveCache(currentUrl) {
    if (this.cacheManager) {
      return this.cacheManager.predictivePreCache(currentUrl);
    }
  }

  /**
   * Invalidate cache with smart strategies
   */
  async invalidateCache(pattern, options = {}) {
    if (this.cacheManager) {
      return this.cacheManager.invalidateCache(pattern, options);
    }
    return { invalidated: 0, preserved: 0, errors: [] };
  }

  /**
   * Destroy sync engine and clean up resources
   */
  destroy() {
    // Clear all event listeners
    this.eventListeners.clear();

    // Cleanup advanced features
    if (this.cacheManager) {
      // CacheManager cleanup would go here
    }

    if (this.carbonScheduler) {
      // CarbonScheduler cleanup would go here
    }

    // Remove window event listeners
    if (typeof window !== 'undefined') {
      // Note: We can't remove specific listeners without references
      // This is a limitation of the current implementation
      console.warn('Window event listeners for SyncEngine cannot be automatically removed');
    }

    // Reset state
    this.isSyncing = false;
    this.updateSyncStatus(SYNC_STATUS.IDLE);
  }
}
