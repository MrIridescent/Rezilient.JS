// src/hooks/useAetherStore.js

/**
 * React-style hooks for Aether.js stores and sync engine
 * Provides a modern, declarative API for state management and synchronization
 */

/**
 * Hook for subscribing to AetherStore or PersistentStore changes
 * @param {AetherStore|PersistentStore} store - The store to subscribe to
 * @param {function} [selector] - Optional selector function to extract specific data
 * @returns {any} Current store value or selected value
 */
export function useAetherStore(store, selector = null) {
  // For vanilla JS environments without React
  if (typeof React === 'undefined') {
    return useAetherStoreVanilla(store, selector);
  }

  const [state, setState] = React.useState(() => {
    const currentValue = store.get();
    return selector ? selector(currentValue) : currentValue;
  });

  React.useEffect(() => {
    const unsubscribe = store.subscribe(newValue => {
      const selectedValue = selector ? selector(newValue) : newValue;
      setState(selectedValue);
    });

    return unsubscribe;
  }, [store, selector]);

  return state;
}

/**
 * Vanilla JavaScript version of useAetherStore
 * Returns an object with current value and update methods
 */
function useAetherStoreVanilla(store, selector = null) {
  let currentValue = store.get();
  let listeners = [];

  const getValue = () => {
    const value = store.get();
    return selector ? selector(value) : value;
  };

  const subscribe = (callback) => {
    listeners.push(callback);
    
    // Subscribe to store changes
    const unsubscribe = store.subscribe(newValue => {
      const selectedValue = selector ? selector(newValue) : newValue;
      currentValue = selectedValue;
      
      // Notify all listeners
      listeners.forEach(listener => {
        try {
          listener(selectedValue);
        } catch (error) {
          console.error('Error in useAetherStore listener:', error);
        }
      });
    });

    return () => {
      // Remove listener
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      
      // If no more listeners, unsubscribe from store
      if (listeners.length === 0) {
        unsubscribe();
      }
    };
  };

  return {
    value: getValue(),
    subscribe,
    get: getValue
  };
}

/**
 * Hook for managing sync state and operations
 * @param {SyncEngine} syncEngine - The sync engine instance
 * @returns {object} Sync state and control methods
 */
export function useSyncEngine(syncEngine) {
  if (typeof React === 'undefined') {
    return useSyncEngineVanilla(syncEngine);
  }

  const [syncState, setSyncState] = React.useState(syncEngine.getSyncState());
  const [queueStats, setQueueStats] = React.useState(null);

  React.useEffect(() => {
    // Subscribe to sync state changes
    const unsubscribe = syncEngine.subscribeSyncState(setSyncState);

    // Load initial queue stats
    syncEngine.getQueueStats().then(setQueueStats);

    // Subscribe to queue updates
    const unsubscribeQueue = syncEngine.addEventListener('queue-updated', () => {
      syncEngine.getQueueStats().then(setQueueStats);
    });

    return () => {
      unsubscribe();
      unsubscribeQueue();
    };
  }, [syncEngine]);

  const syncActions = React.useMemo(() => ({
    sync: () => syncEngine.processQueue(),
    clearQueue: () => syncEngine.clearQueue(),
    removeMutation: (id) => syncEngine.removeMutation(id),
    forceSyncMutation: (id) => syncEngine.forceSyncMutation(id),
    getHealthStatus: () => syncEngine.getHealthStatus()
  }), [syncEngine]);

  return {
    syncState,
    queueStats,
    actions: syncActions,
    isOnline: syncState.status !== 'offline',
    isSyncing: syncState.status === 'syncing',
    hasErrors: syncState.status === 'error',
    pendingCount: syncState.pending
  };
}

/**
 * Vanilla JavaScript version of useSyncEngine
 */
function useSyncEngineVanilla(syncEngine) {
  let syncState = syncEngine.getSyncState();
  let queueStats = null;
  let listeners = [];

  // Load initial queue stats
  syncEngine.getQueueStats().then(stats => {
    queueStats = stats;
    notifyListeners();
  });

  // Subscribe to sync state changes
  const unsubscribeSyncState = syncEngine.subscribeSyncState(newState => {
    syncState = newState;
    notifyListeners();
  });

  // Subscribe to queue updates
  const unsubscribeQueue = syncEngine.addEventListener('queue-updated', () => {
    syncEngine.getQueueStats().then(stats => {
      queueStats = stats;
      notifyListeners();
    });
  });

  function notifyListeners() {
    listeners.forEach(listener => {
      try {
        listener({
          syncState,
          queueStats,
          isOnline: syncState.status !== 'offline',
          isSyncing: syncState.status === 'syncing',
          hasErrors: syncState.status === 'error',
          pendingCount: syncState.pending
        });
      } catch (error) {
        console.error('Error in useSyncEngine listener:', error);
      }
    });
  }

  const subscribe = (callback) => {
    listeners.push(callback);
    
    // Immediately call with current state
    callback({
      syncState,
      queueStats,
      isOnline: syncState.status !== 'offline',
      isSyncing: syncState.status === 'syncing',
      hasErrors: syncState.status === 'error',
      pendingCount: syncState.pending
    });

    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      
      if (listeners.length === 0) {
        unsubscribeSyncState();
        unsubscribeQueue();
      }
    };
  };

  const actions = {
    sync: () => syncEngine.processQueue(),
    clearQueue: () => syncEngine.clearQueue(),
    removeMutation: (id) => syncEngine.removeMutation(id),
    forceSyncMutation: (id) => syncEngine.forceSyncMutation(id),
    getHealthStatus: () => syncEngine.getHealthStatus()
  };

  return {
    subscribe,
    actions,
    getCurrentState: () => ({
      syncState,
      queueStats,
      isOnline: syncState.status !== 'offline',
      isSyncing: syncState.status === 'syncing',
      hasErrors: syncState.status === 'error',
      pendingCount: syncState.pending
    })
  };
}

/**
 * Hook for creating and managing a persistent store
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial value
 * @param {object} options - Store options
 * @returns {array} [value, setValue, store] tuple
 */
export function usePersistentStore(key, initialValue, options = {}) {
  if (typeof React === 'undefined') {
    return usePersistentStoreVanilla(key, initialValue, options);
  }

  const [store] = React.useState(() => {
    const { PersistentStore } = require('../data/PersistentStore.js');
    return new PersistentStore(key, initialValue);
  });

  const value = useAetherStore(store);

  const setValue = React.useCallback((newValue) => {
    if (typeof newValue === 'function') {
      store.update(newValue);
    } else {
      store.set(newValue);
    }
  }, [store]);

  return [value, setValue, store];
}

/**
 * Vanilla JavaScript version of usePersistentStore
 */
function usePersistentStoreVanilla(key, initialValue, options = {}) {
  const { PersistentStore } = require('../data/PersistentStore.js');
  const store = new PersistentStore(key, initialValue);

  const setValue = (newValue) => {
    if (typeof newValue === 'function') {
      store.update(newValue);
    } else {
      store.set(newValue);
    }
  };

  return {
    store,
    setValue,
    getValue: () => store.get(),
    subscribe: (callback) => store.subscribe(callback)
  };
}

/**
 * Hook for offline-aware components
 * @returns {object} Network state and utilities
 */
export function useNetworkState() {
  if (typeof React === 'undefined') {
    return useNetworkStateVanilla();
  }

  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType: typeof navigator !== 'undefined' && navigator.connection 
      ? navigator.connection.effectiveType 
      : 'unknown'
  };
}

/**
 * Vanilla JavaScript version of useNetworkState
 */
function useNetworkStateVanilla() {
  let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  let listeners = [];

  if (typeof window !== 'undefined') {
    const handleOnline = () => {
      isOnline = true;
      notifyListeners();
    };

    const handleOffline = () => {
      isOnline = false;
      notifyListeners();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  function notifyListeners() {
    const state = {
      isOnline,
      isOffline: !isOnline,
      connectionType: typeof navigator !== 'undefined' && navigator.connection 
        ? navigator.connection.effectiveType 
        : 'unknown'
    };

    listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in useNetworkState listener:', error);
      }
    });
  }

  const subscribe = (callback) => {
    listeners.push(callback);
    
    // Immediately call with current state
    callback({
      isOnline,
      isOffline: !isOnline,
      connectionType: typeof navigator !== 'undefined' && navigator.connection 
        ? navigator.connection.effectiveType 
        : 'unknown'
    });

    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  };

  return {
    subscribe,
    getCurrentState: () => ({
      isOnline,
      isOffline: !isOnline,
      connectionType: typeof navigator !== 'undefined' && navigator.connection 
        ? navigator.connection.effectiveType 
        : 'unknown'
    })
  };
}
