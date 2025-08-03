// __tests__/useAetherStore.test.js

import {
  useAetherStore,
  useSyncEngine,
  usePersistentStore,
  useNetworkState
} from '../src/hooks/useAetherStore.js';
import { AetherStore } from '../src/data/AetherStore.js';
import { PersistentStore } from '../src/data/PersistentStore.js';

// Mock PersistentStore
jest.mock('../src/data/PersistentStore.js');

// Mock React for testing React integration
global.React = undefined; // Test vanilla JS mode

describe('useAetherStore', () => {
  let store;

  beforeEach(() => {
    store = new AetherStore(0);
  });

  describe('vanilla JS mode', () => {
    test('should return store wrapper with current value', () => {
      const result = useAetherStore(store);
      
      expect(result).toMatchObject({
        value: 0,
        subscribe: expect.any(Function),
        get: expect.any(Function)
      });
    });

    test('should return selected value when selector provided', () => {
      const objectStore = new AetherStore({ count: 5, name: 'test' });
      const result = useAetherStore(objectStore, state => state.count);
      
      expect(result.value).toBe(5);
    });

    test('should notify listeners on store changes', () => {
      const result = useAetherStore(store);
      const listener = jest.fn();
      
      const unsubscribe = result.subscribe(listener);
      store.set(10);
      
      expect(listener).toHaveBeenCalledWith(10);
      
      unsubscribe();
    });

    test('should handle selector in subscription', () => {
      const objectStore = new AetherStore({ count: 5, name: 'test' });
      const result = useAetherStore(objectStore, state => state.count);
      const listener = jest.fn();
      
      result.subscribe(listener);
      objectStore.set({ count: 10, name: 'test' });
      
      expect(listener).toHaveBeenCalledWith(10);
    });
  });
});

describe('useSyncEngine', () => {
  let mockSyncEngine;

  beforeEach(() => {
    mockSyncEngine = {
      getSyncState: jest.fn().mockReturnValue({
        status: 'idle',
        pending: 0,
        error: null
      }),
      getQueueStats: jest.fn().mockResolvedValue({
        total: 0,
        pending: 0,
        failed: 0
      }),
      subscribeSyncState: jest.fn().mockReturnValue(jest.fn()),
      addEventListener: jest.fn().mockReturnValue(jest.fn()),
      processQueue: jest.fn(),
      clearQueue: jest.fn(),
      removeMutation: jest.fn(),
      forceSyncMutation: jest.fn(),
      getHealthStatus: jest.fn()
    };
  });

  describe('vanilla JS mode', () => {
    test('should return sync state and actions', () => {
      const result = useSyncEngine(mockSyncEngine);
      
      expect(result).toMatchObject({
        subscribe: expect.any(Function),
        actions: expect.any(Object),
        getCurrentState: expect.any(Function)
      });
      
      expect(result.actions).toMatchObject({
        sync: expect.any(Function),
        clearQueue: expect.any(Function),
        removeMutation: expect.any(Function),
        forceSyncMutation: expect.any(Function),
        getHealthStatus: expect.any(Function)
      });
    });

    test('should call sync engine methods through actions', () => {
      const result = useSyncEngine(mockSyncEngine);
      
      result.actions.sync();
      expect(mockSyncEngine.processQueue).toHaveBeenCalled();
      
      result.actions.clearQueue();
      expect(mockSyncEngine.clearQueue).toHaveBeenCalled();
      
      result.actions.removeMutation('test-id');
      expect(mockSyncEngine.removeMutation).toHaveBeenCalledWith('test-id');
    });

    test('should provide current state', () => {
      const result = useSyncEngine(mockSyncEngine);
      const state = result.getCurrentState();
      
      expect(state).toMatchObject({
        syncState: expect.any(Object),
        queueStats: null, // Initially null until loaded
        isOnline: expect.any(Boolean),
        isSyncing: expect.any(Boolean),
        hasErrors: expect.any(Boolean),
        pendingCount: expect.any(Number)
      });
    });
  });
});

describe('usePersistentStore', () => {
  beforeEach(() => {
    // Mock PersistentStore constructor
    PersistentStore.mockImplementation((key, initialValue) => {
      const store = new AetherStore(initialValue);
      store.key = key;
      return store;
    });
  });

  describe('vanilla JS mode', () => {
    test('should create and return persistent store', () => {
      const result = usePersistentStore('test-key', { count: 0 });
      
      expect(result).toMatchObject({
        store: expect.any(Object),
        setValue: expect.any(Function),
        getValue: expect.any(Function),
        subscribe: expect.any(Function)
      });
      
      expect(PersistentStore).toHaveBeenCalledWith('test-key', { count: 0 });
    });

    test('should handle setValue with direct value', () => {
      const result = usePersistentStore('test-key', 0);
      const setSpy = jest.spyOn(result.store, 'set');
      
      result.setValue(10);
      
      expect(setSpy).toHaveBeenCalledWith(10);
    });

    test('should handle setValue with updater function', () => {
      const result = usePersistentStore('test-key', 0);
      const updateSpy = jest.spyOn(result.store, 'update');
      const updater = (prev) => prev + 1;
      
      result.setValue(updater);
      
      expect(updateSpy).toHaveBeenCalledWith(updater);
    });
  });
});

describe('useNetworkState', () => {
  beforeEach(() => {
    // Mock navigator
    Object.defineProperty(global.navigator, 'onLine', {
      value: true,
      writable: true
    });
    
    Object.defineProperty(global.navigator, 'connection', {
      value: { effectiveType: '4g' },
      writable: true
    });
  });

  describe('vanilla JS mode', () => {
    test('should return network state', () => {
      const result = useNetworkState();
      
      expect(result).toMatchObject({
        subscribe: expect.any(Function),
        getCurrentState: expect.any(Function)
      });
    });

    test('should provide current network state', () => {
      const result = useNetworkState();
      const state = result.getCurrentState();
      
      expect(state).toMatchObject({
        isOnline: true,
        isOffline: false,
        connectionType: '4g'
      });
    });

    test('should handle missing connection info', () => {
      const originalConnection = global.navigator.connection;
      global.navigator.connection = undefined;

      const result = useNetworkState();
      const state = result.getCurrentState();

      expect(state.connectionType).toBe('unknown');

      // Restore original connection
      global.navigator.connection = originalConnection;
    });

    test('should subscribe to network changes', () => {
      const result = useNetworkState();
      const listener = jest.fn();
      
      const unsubscribe = result.subscribe(listener);
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: true,
          isOffline: false
        })
      );
      
      expect(typeof unsubscribe).toBe('function');
    });
  });
});

describe('React integration', () => {
  beforeEach(() => {
    // Mock React
    global.React = {
      useState: jest.fn((initial) => [initial, jest.fn()]),
      useEffect: jest.fn((effect, deps) => {
        // Simulate effect running
        const cleanup = effect();
        return cleanup;
      }),
      useCallback: jest.fn((fn, deps) => fn),
      useMemo: jest.fn((fn, deps) => fn())
    };
  });

  afterEach(() => {
    global.React = undefined;
  });

  test('should use React hooks when React is available', () => {
    const store = new AetherStore(0);
    
    useAetherStore(store);
    
    expect(React.useState).toHaveBeenCalled();
    expect(React.useEffect).toHaveBeenCalled();
  });

  test('should use React hooks for sync engine', () => {
    const mockSyncEngine = {
      getSyncState: jest.fn().mockReturnValue({ status: 'idle' }),
      subscribeSyncState: jest.fn().mockReturnValue(jest.fn()),
      addEventListener: jest.fn().mockReturnValue(jest.fn()),
      getQueueStats: jest.fn().mockResolvedValue({}),
      processQueue: jest.fn()
    };
    
    useSyncEngine(mockSyncEngine);
    
    expect(React.useState).toHaveBeenCalled();
    expect(React.useEffect).toHaveBeenCalled();
    expect(React.useMemo).toHaveBeenCalled();
  });

  test('should use React hooks for persistent store', () => {
    // Create a proper mock that has the subscribe method
    const mockStore = {
      get: jest.fn(() => ({})),
      set: jest.fn(),
      subscribe: jest.fn(() => jest.fn()), // Return unsubscribe function
      update: jest.fn(),
      initialize: jest.fn(() => Promise.resolve())
    };

    // Clear any previous mocks
    PersistentStore.mockClear();
    PersistentStore.mockImplementation(() => mockStore);

    // Mock React.useState to call the lazy initializer and return the mock store
    const mockSetState = jest.fn();
    React.useState.mockImplementationOnce((initializer) => {
      // Call the lazy initializer function to trigger PersistentStore creation
      if (typeof initializer === 'function') {
        initializer(); // This should call new PersistentStore(key, initialValue)
      }
      return [mockStore, mockSetState];
    });

    // Mock useAetherStore to return a value (since it's called internally)
    const mockUseAetherStore = jest.fn(() => ({}));

    // Temporarily replace useAetherStore in the module
    const originalUseAetherStore = require('../src/hooks/useAetherStore.js').useAetherStore;
    require('../src/hooks/useAetherStore.js').useAetherStore = mockUseAetherStore;

    const result = usePersistentStore('test', {});

    // Restore original function
    require('../src/hooks/useAetherStore.js').useAetherStore = originalUseAetherStore;

    // Verify the store was created
    expect(PersistentStore).toHaveBeenCalledWith('test', {});
    expect(React.useState).toHaveBeenCalled();
    expect(React.useCallback).toHaveBeenCalled();

    // Verify the result has the expected structure
    expect(result).toHaveLength(3); // [value, setValue, store]
    expect(result[1]).toEqual(expect.any(Function)); // setValue
    expect(result[2]).toBe(mockStore); // store
  });

  test('should use React hooks for network state', () => {
    useNetworkState();
    
    expect(React.useState).toHaveBeenCalled();
    expect(React.useEffect).toHaveBeenCalled();
  });
});
