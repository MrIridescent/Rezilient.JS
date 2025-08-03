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
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
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
    return this.isSyncStatus(SYNC_STATUS.SYNCING);
  }

  get hasSyncErrors() {
    return this.isSyncStatus(SYNC_STATUS.ERROR);
  }

  get isSynced() {
    return this.isSyncStatus(SYNC_STATUS.SYNCED);
  }

  get isOfflineMode() {
    return this.isSyncStatus(SYNC_STATUS.OFFLINE);
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
