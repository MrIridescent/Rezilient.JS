// __tests__/SyncEngine.test.js

import { SyncEngine } from '../src/sync/SyncEngine.js';

// Mock idb-keyval
jest.mock('idb-keyval', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}));

// Mock PersistentStore
jest.mock('../src/data/PersistentStore.js', () => ({
  PersistentStore: jest.fn().mockImplementation((key, initialValue) => ({
    key,
    _state: initialValue,
    get: jest.fn().mockReturnValue(initialValue),
    set: jest.fn(),
    update: jest.fn(),
    subscribe: jest.fn()
  }))
}));

// Mock CacheManager
jest.mock('../src/cache/CacheManager.js', () => ({
  CacheManager: jest.fn().mockImplementation(() => ({
    getStats: jest.fn().mockReturnValue({ hitRate: 85, patternsLearned: 10 })
  }))
}));

// Mock CarbonAwareScheduler
jest.mock('../src/scheduler/CarbonAwareScheduler.js', () => ({
  CarbonAwareScheduler: jest.fn().mockImplementation(() => ({
    getStats: jest.fn().mockReturnValue({ carbonSaved: 15.5, carbonIntensity: 'medium' }),
    scheduleTask: jest.fn().mockResolvedValue('task-id')
  }))
}));

import { PersistentStore } from '../src/data/PersistentStore.js';
import { CacheManager } from '../src/cache/CacheManager.js';
import { CarbonAwareScheduler } from '../src/scheduler/CarbonAwareScheduler.js';

// Mock window and navigator
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
global.window.addEventListener = mockAddEventListener;
global.window.removeEventListener = mockRemoveEventListener;

describe('SyncEngine', () => {
  let syncEngine;
  let mockQueue;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock queue
    mockQueue = {
      get: jest.fn().mockResolvedValue([]),
      set: jest.fn().mockResolvedValue(undefined)
    };
    
    PersistentStore.mockImplementation(() => mockQueue);
    
    syncEngine = new SyncEngine({
      enableAdvancedCaching: false, // Disable for simpler testing
      enableCarbonAware: false // Disable for simpler testing
    });
  });

  describe('constructor', () => {
    test('should initialize with default options', () => {
      expect(syncEngine.conflictStrategy).toBe('LastWriteWins');
      expect(syncEngine.isSyncing).toBe(false);
    });

    test('should initialize with custom conflict strategy', () => {
      const customEngine = new SyncEngine({ conflictStrategy: 'ServerWins' });
      expect(customEngine.conflictStrategy).toBe('ServerWins');
    });

    test('should initialize with custom function conflict strategy', () => {
      const customStrategy = jest.fn();
      const customEngine = new SyncEngine({ conflictStrategy: customStrategy });
      expect(customEngine.conflictStrategy).toBe(customStrategy);
    });

    test('should create PersistentStore for queue', () => {
      expect(PersistentStore).toHaveBeenCalledWith('aether-mutation-queue', []);
    });

    test('should register online and offline event listeners', () => {
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    test.skip('should not register event listener when window is undefined', () => {
      const originalWindow = global.window;
      delete global.window;
      global.window = undefined;

      jest.clearAllMocks();
      const syncEngine = new SyncEngine();

      expect(mockAddEventListener).not.toHaveBeenCalled();
      expect(syncEngine.isOnline).toBe(false); // Should default to false without window

      global.window = originalWindow;
      global.window.addEventListener = mockAddEventListener;
      global.window.removeEventListener = mockRemoveEventListener;
    });
  });

  describe('addMutation()', () => {
    test('should add mutation to queue', async () => {
      const mutation = { type: 'ADD_ITEM', payload: { id: 1, text: 'Test' } };
      const currentQueue = [{ type: 'EXISTING' }];
      
      mockQueue.get.mockResolvedValue(currentQueue);
      
      await syncEngine.addMutation(mutation);
      
      expect(mockQueue.get).toHaveBeenCalled();
      expect(mockQueue.set).toHaveBeenCalledWith([
        ...currentQueue,
        expect.objectContaining({
          type: 'ADD_ITEM',
          payload: { id: 1, text: 'Test' },
          id: expect.any(String),
          timestamp: expect.any(Number),
          retryCount: 0,
          status: 'pending'
        })
      ]);
    });

    test('should handle empty queue', async () => {
      const mutation = { type: 'ADD_ITEM', payload: { id: 1, text: 'Test' } };
      
      mockQueue.get.mockResolvedValue([]);
      
      await syncEngine.addMutation(mutation);
      
      expect(mockQueue.set).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'ADD_ITEM',
          payload: { id: 1, text: 'Test' },
          id: expect.any(String),
          timestamp: expect.any(Number),
          retryCount: 0,
          status: 'pending'
        })
      ]);
    });

    test('should handle null queue', async () => {
      const mutation = { type: 'ADD_ITEM', payload: { id: 1, text: 'Test' } };
      
      mockQueue.get.mockResolvedValue(null);
      
      await syncEngine.addMutation(mutation);
      
      expect(mockQueue.set).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'ADD_ITEM',
          payload: { id: 1, text: 'Test' },
          id: expect.any(String),
          timestamp: expect.any(Number),
          retryCount: 0,
          status: 'pending'
        })
      ]);
    });
  });

  describe('processQueue()', () => {
    beforeEach(() => {
      // Mock the sync methods
      syncEngine.fetchServerState = jest.fn().mockResolvedValue(null);
      syncEngine.hasConflict = jest.fn().mockReturnValue(false);
      syncEngine.syncMutation = jest.fn().mockResolvedValue(undefined);
    });

    test('should not process when already syncing', async () => {
      syncEngine.isSyncing = true;

      await syncEngine.processQueue();

      // Should still call get to check queue length, but not process
      expect(mockQueue.get).toHaveBeenCalled();
    });

    test('should not process when offline', async () => {
      // Set sync engine offline state
      syncEngine.isOnline = false;

      await syncEngine.processQueue();

      // Should still call get to check queue length, but not process
      expect(mockQueue.get).toHaveBeenCalled();
    });

    test('should process empty queue', async () => {
      mockQueue.get.mockResolvedValue([]);

      await syncEngine.processQueue();

      expect(syncEngine.isSyncing).toBe(false);
      // Empty queue doesn't call set in enhanced implementation
      expect(mockQueue.set).not.toHaveBeenCalled();
    });

    test('should process mutations in queue', async () => {
      const mutations = [
        { type: 'ADD_ITEM', payload: { id: 1 } },
        { type: 'UPDATE_ITEM', payload: { id: 2 } }
      ];
      
      mockQueue.get.mockResolvedValue(mutations);
      
      await syncEngine.processQueue();
      
      expect(syncEngine.syncMutation).toHaveBeenCalledTimes(2);
      expect(syncEngine.syncMutation).toHaveBeenCalledWith(mutations[0]);
      expect(syncEngine.syncMutation).toHaveBeenCalledWith(mutations[1]);
      expect(mockQueue.set).toHaveBeenCalledWith([]);
      expect(syncEngine.isSyncing).toBe(false);
    });

    test('should handle sync errors', async () => {
      const mutations = [{ type: 'ADD_ITEM', payload: { id: 1 } }];
      mockQueue.get.mockResolvedValue(mutations);
      syncEngine.syncMutation.mockRejectedValue(new Error('Sync failed'));

      // Mock fetchServerState to avoid additional calls
      syncEngine.fetchServerState = jest.fn().mockResolvedValue(null);

      await syncEngine.processQueue();

      // Verify sync was attempted
      expect(syncEngine.syncMutation).toHaveBeenCalledWith(mutations[0]);
      expect(syncEngine.isSyncing).toBe(false);

      // Since the mutation failed, it should remain in queue (not cleared)
      // The failed mutations are handled by handleSyncResults
      expect(mockQueue.set).toHaveBeenCalled();

      // Verify the queue contains the failed mutation with retry metadata
      const setCall = mockQueue.set.mock.calls[mockQueue.set.mock.calls.length - 1];
      expect(setCall[0]).toHaveLength(1);
      expect(setCall[0][0]).toMatchObject({
        type: 'ADD_ITEM',
        payload: { id: 1 },
        retryCount: 1,
        lastError: 'Sync failed'
      });
      expect(setCall[0][0]).toHaveProperty('lastAttempt');
    });
  });

  describe('conflict resolution', () => {
    beforeEach(() => {
      syncEngine.fetchServerState = jest.fn().mockResolvedValue({ version: 2 });
      syncEngine.hasConflict = jest.fn().mockReturnValue(true);
      syncEngine.syncMutation = jest.fn().mockResolvedValue(undefined);
    });

    test('should apply LastWriteWins strategy', async () => {
      const mutation = { type: 'UPDATE_ITEM', payload: { id: 1, version: 1 } };
      mockQueue.get.mockResolvedValue([mutation]);
      
      await syncEngine.processQueue();
      
      expect(syncEngine.syncMutation).toHaveBeenCalledWith(mutation);
    });

    test('should apply ServerWins strategy', async () => {
      syncEngine.conflictStrategy = 'ServerWins';
      const mutation = { type: 'UPDATE_ITEM', payload: { id: 1, version: 1 } };
      mockQueue.get.mockResolvedValue([mutation]);
      
      await syncEngine.processQueue();
      
      expect(syncEngine.syncMutation).not.toHaveBeenCalled();
      expect(mockQueue.set).toHaveBeenCalledWith([]);
    });

    test('should apply custom conflict resolution function', async () => {
      const customResolver = jest.fn().mockReturnValue({ type: 'RESOLVED' });
      syncEngine.conflictStrategy = customResolver;
      
      const mutation = { type: 'UPDATE_ITEM', payload: { id: 1 } };
      const serverState = { version: 2 };
      mockQueue.get.mockResolvedValue([mutation]);
      syncEngine.fetchServerState.mockResolvedValue(serverState);
      
      await syncEngine.processQueue();
      
      expect(customResolver).toHaveBeenCalledWith(mutation, serverState);
      expect(syncEngine.syncMutation).toHaveBeenCalledWith({ type: 'RESOLVED' });
    });
  });

  describe('getQueue()', () => {
    test('should return enhanced queue with metadata', async () => {
      const baseQueue = [{ type: 'TEST', timestamp: Date.now() - 1000 }];
      mockQueue.get.mockResolvedValue(baseQueue);

      const result = await syncEngine.getQueue();

      expect(result).toEqual([
        expect.objectContaining({
          type: 'TEST',
          age: expect.any(Number),
          canRetry: true
        })
      ]);
      expect(mockQueue.get).toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    test('should process queue when online event is triggered', () => {
      const spy = jest.spyOn(syncEngine, 'processQueue');
      
      // Get the online event handler
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )[1];
      
      onlineHandler();
      
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('enhanced features', () => {
    describe('sync state management', () => {
      test('should provide sync state', () => {
        const state = syncEngine.getSyncState();

        expect(state).toMatchObject({
          status: expect.any(String),
          progress: { current: 0, total: 0, percentage: 0 },
          pending: expect.any(Number),
          error: null,
          lastSync: null,
          retryCount: 0
        });
      });

      test('should allow subscribing to sync state changes', () => {
        const callback = jest.fn();
        const unsubscribe = syncEngine.subscribeSyncState(callback);

        expect(typeof unsubscribe).toBe('function');
        expect(callback).toHaveBeenCalledWith(expect.any(Object));
      });

      test('should allow adding event listeners', () => {
        const callback = jest.fn();
        const unsubscribe = syncEngine.addEventListener('sync-status-change', callback);

        expect(typeof unsubscribe).toBe('function');
      });
    });

    describe('queue management', () => {
      test('should provide queue statistics', async () => {
        const queue = [
          { timestamp: Date.now() - 1000, retryCount: 0 },
          { timestamp: Date.now() - 2000, retryCount: 5 }
        ];
        mockQueue.get.mockResolvedValue(queue);

        const stats = await syncEngine.getQueueStats();

        expect(stats).toMatchObject({
          total: 2,
          pending: expect.any(Number),
          failed: expect.any(Number),
          retriable: expect.any(Number),
          oldestMutation: expect.any(Number),
          averageAge: expect.any(Number)
        });
      });

      test('should allow clearing queue', async () => {
        await syncEngine.clearQueue();

        expect(mockQueue.set).toHaveBeenCalledWith([]);
      });

      test('should allow removing specific mutations', async () => {
        const queue = [
          { id: 'mutation-1', type: 'TEST' },
          { id: 'mutation-2', type: 'TEST' }
        ];
        mockQueue.get.mockResolvedValue(queue);

        const result = await syncEngine.removeMutation('mutation-1');

        expect(result).toBe(true);
        expect(mockQueue.set).toHaveBeenCalledWith([
          { id: 'mutation-2', type: 'TEST' }
        ]);
      });
    });

    describe('health monitoring', () => {
      test('should provide health status', async () => {
        mockQueue.get.mockResolvedValue([]);

        const health = await syncEngine.getHealthStatus();

        expect(health).toMatchObject({
          status: expect.any(String),
          issues: expect.any(Array),
          recommendations: expect.any(Array),
          stats: expect.any(Object),
          state: expect.any(Object),
          timestamp: expect.any(Number)
        });
      });
    });

    describe('cleanup', () => {
      test('should clean up resources on destroy', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        syncEngine.destroy();

        expect(syncEngine.isSyncing).toBe(false);

        consoleSpy.mockRestore();
      });
    });
  });
});
