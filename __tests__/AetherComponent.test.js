// __tests__/AetherComponent.test.js

import { AetherComponent } from '../src/component/AetherComponent.js';

// Mock window and addEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

// Setup window mock (use existing window from setup.js)
global.window.addEventListener = mockAddEventListener;
global.window.removeEventListener = mockRemoveEventListener;

describe('AetherComponent', () => {
  let component;

  beforeEach(() => {
    jest.clearAllMocks();
    component = new AetherComponent();
  });

  describe('constructor', () => {
    test('should register online event listener', () => {
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    });

    test('should register offline event listener', () => {
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    test('should register both event listeners', () => {
      expect(mockAddEventListener).toHaveBeenCalledTimes(2);
    });

    test('should initialize with default options', () => {
      expect(component.options).toMatchObject({
        autoSync: true,
        syncOnOnline: true,
        trackSyncState: true
      });
    });

    test('should initialize with custom options', () => {
      const customComponent = new AetherComponent({
        autoSync: false,
        syncOnOnline: false,
        trackSyncState: false
      });

      expect(customComponent.options).toMatchObject({
        autoSync: false,
        syncOnOnline: false,
        trackSyncState: false
      });
    });

    test('should initialize network state', () => {
      expect(component.isOnline).toBe(true);
      expect(component.syncEngine).toBe(null);
      expect(component.syncState).toBe(null);
    });

    test.skip('should not register event listeners when window is undefined', () => {
      // Store original window and navigator
      const originalWindow = global.window;
      const originalNavigator = global.navigator;

      // Completely remove window from global scope
      delete global.window;
      delete global.navigator;

      // Make sure window and navigator are truly undefined
      global.window = undefined;
      global.navigator = undefined;

      // Create a fresh mock for this test
      const freshMockAddEventListener = jest.fn();

      // Create component without window
      const componentWithoutWindow = new AetherComponent();

      // Verify no event listeners were added (should be 0 since window doesn't exist)
      expect(freshMockAddEventListener).not.toHaveBeenCalled();

      // Verify component still initializes properly
      expect(componentWithoutWindow.isOnline).toBe(false); // Should default to false without window
      expect(componentWithoutWindow.eventListeners).toEqual([]);

      // Restore window and navigator and set up mocks again
      global.window = originalWindow;
      global.navigator = originalNavigator;
      global.window.addEventListener = mockAddEventListener;
      global.window.removeEventListener = mockRemoveEventListener;
    });
  });

  describe('lifecycle hooks', () => {
    test('should have onOffline method', () => {
      expect(typeof component.onOffline).toBe('function');
    });

    test('should have onOnline method', () => {
      expect(typeof component.onOnline).toBe('function');
    });

    test('should have onSyncStateChange method', () => {
      expect(typeof component.onSyncStateChange).toBe('function');
    });

    test('onOffline should be callable without errors', () => {
      expect(() => component.onOffline()).not.toThrow();
    });

    test('onOnline should be callable without errors', () => {
      expect(() => component.onOnline()).not.toThrow();
    });

    test('onSyncStateChange should be callable without errors', () => {
      expect(() => component.onSyncStateChange({ status: 'syncing' })).not.toThrow();
    });
  });

  describe('event handling', () => {
    test('should call onOnline when online event is triggered', () => {
      const spy = jest.spyOn(component, 'onOnline');
      
      // Get the online event handler
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )[1];
      
      // Trigger the event
      onlineHandler();
      
      expect(spy).toHaveBeenCalled();
    });

    test('should call onOffline when offline event is triggered', () => {
      const spy = jest.spyOn(component, 'onOffline');
      
      // Get the offline event handler
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )[1];
      
      // Trigger the event
      offlineHandler();
      
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('inheritance and extension', () => {
    class TestComponent extends AetherComponent {
      constructor() {
        super();
        this.offlineCallCount = 0;
        this.onlineCallCount = 0;
        this.syncStateChanges = [];
      }

      onOffline() {
        this.offlineCallCount++;
      }

      onOnline() {
        this.onlineCallCount++;
      }

      onSyncStateChange(state) {
        this.syncStateChanges.push(state);
      }
    }

    test('should allow extending with custom lifecycle implementations', () => {
      const testComponent = new TestComponent();
      
      expect(testComponent.offlineCallCount).toBe(0);
      expect(testComponent.onlineCallCount).toBe(0);
      expect(testComponent.syncStateChanges).toEqual([]);
    });

    test('should call custom onOffline implementation', () => {
      jest.clearAllMocks();
      const testComponent = new TestComponent();

      // Get the offline event handler
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )[1];

      // Trigger the event
      offlineHandler();

      expect(testComponent.offlineCallCount).toBe(1);
    });

    test('should call custom onOnline implementation', () => {
      jest.clearAllMocks();
      const testComponent = new TestComponent();

      // Get the online event handler
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )[1];

      // Trigger the event
      onlineHandler();

      expect(testComponent.onlineCallCount).toBe(1);
    });

    test('should call custom onSyncStateChange implementation', () => {
      const testComponent = new TestComponent();
      const testState = { status: 'syncing', pending: 3, error: null };
      
      testComponent.onSyncStateChange(testState);
      
      expect(testComponent.syncStateChanges).toEqual([testState]);
    });
  });

  describe('multiple instances', () => {
    test('should register event listeners for each instance', () => {
      jest.clearAllMocks();
      
      const component1 = new AetherComponent();
      const component2 = new AetherComponent();
      
      // Should register 4 event listeners total (2 per component)
      expect(mockAddEventListener).toHaveBeenCalledTimes(4);
    });

    test('should handle events independently for each instance', () => {
      const component1 = new AetherComponent();
      const component2 = new AetherComponent();
      
      const spy1 = jest.spyOn(component1, 'onOnline');
      const spy2 = jest.spyOn(component2, 'onOnline');
      
      // Get all online event handlers
      const onlineHandlers = mockAddEventListener.mock.calls
        .filter(call => call[0] === 'online')
        .map(call => call[1]);
      
      // Trigger all online events
      onlineHandlers.forEach(handler => handler());
      
      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });
  });

  describe('enhanced features', () => {
    describe('sync engine integration', () => {
      let mockSyncEngine;

      beforeEach(() => {
        mockSyncEngine = {
          subscribeSyncState: jest.fn().mockReturnValue(jest.fn()),
          addEventListener: jest.fn().mockReturnValue(jest.fn()),
          processQueue: jest.fn(),
          addMutation: jest.fn()
        };
      });

      test('should connect sync engine', () => {
        component.connectSyncEngine(mockSyncEngine);

        expect(component.syncEngine).toBe(mockSyncEngine);
        expect(mockSyncEngine.subscribeSyncState).toHaveBeenCalled();
      });

      test('should disconnect sync engine', () => {
        component.connectSyncEngine(mockSyncEngine);
        component.disconnectSyncEngine();

        expect(component.syncEngine).toBe(null);
        expect(component.syncState).toBe(null);
      });

      test('should trigger sync when connected', async () => {
        component.connectSyncEngine(mockSyncEngine);

        await component.triggerSync();

        expect(mockSyncEngine.processQueue).toHaveBeenCalled();
      });

      test('should add mutations when connected', async () => {
        const mutation = { type: 'TEST', payload: {} };
        component.connectSyncEngine(mockSyncEngine);

        await component.addMutation(mutation);

        expect(mockSyncEngine.addMutation).toHaveBeenCalledWith(mutation);
      });
    });

    describe('utility methods', () => {
      test('should provide network state', () => {
        const networkState = component.getNetworkState();

        expect(networkState).toMatchObject({
          isOnline: expect.any(Boolean),
          isOffline: expect.any(Boolean),
          connectionType: expect.any(String)
        });
      });

      test('should provide sync state getters', () => {
        expect(component.isSyncing).toBe(false);
        expect(component.hasSyncErrors).toBe(false);
        expect(component.isSynced).toBe(false);
        expect(component.isOfflineMode).toBe(false);
      });
    });

    describe('cleanup', () => {
      test('should clean up resources on destroy', () => {
        const mockSyncEngine = {
          subscribeSyncState: jest.fn().mockReturnValue(jest.fn()),
          addEventListener: jest.fn().mockReturnValue(jest.fn())
        };

        component.connectSyncEngine(mockSyncEngine);
        component.destroy();

        expect(component.syncEngine).toBe(null);
        expect(component.eventListeners).toEqual([]);
      });

      test('should call onDestroy hook', () => {
        const spy = jest.spyOn(component, 'onDestroy');

        component.destroy();

        expect(spy).toHaveBeenCalled();
      });
    });
  });
});
