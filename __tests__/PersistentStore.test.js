// __tests__/PersistentStore.test.js

import { PersistentStore } from '../src/data/PersistentStore.js';

// Mock idb-keyval
jest.mock('idb-keyval', () => ({
  get: jest.fn(),
  set: jest.fn()
}));

import { get as idbGet, set as idbSet } from 'idb-keyval';

describe('PersistentStore', () => {
  let store;
  const testKey = 'test-key';
  const initialValue = 'initial';

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful IndexedDB operations
    idbGet.mockResolvedValue(undefined);
    idbSet.mockResolvedValue(undefined);
  });

  describe('constructor and initialization', () => {
    test('should initialize with provided key and initial value', () => {
      store = new PersistentStore(testKey, initialValue);
      expect(store.key).toBe(testKey);
      expect(store.get()).toBe(initialValue);
    });

    test('should load saved value from IndexedDB on initialization', async () => {
      const savedValue = 'saved value';
      idbGet.mockResolvedValue(savedValue);

      store = new PersistentStore(testKey, initialValue);

      // Wait for initialization - use a longer timeout to ensure async completion
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(idbGet).toHaveBeenCalledWith(testKey);
      expect(store.get()).toBe(savedValue);
    });

    test('should use initial value when nothing is saved in IndexedDB', async () => {
      idbGet.mockResolvedValue(undefined);
      
      store = new PersistentStore(testKey, initialValue);
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(store.get()).toBe(initialValue);
    });

    test('should notify subscribers after loading from IndexedDB', async () => {
      const savedValue = 'saved value';
      idbGet.mockResolvedValue(savedValue);

      store = new PersistentStore(testKey, initialValue);

      // Wait for initialization first
      await new Promise(resolve => setTimeout(resolve, 100));

      const callback = jest.fn();
      store.subscribe(callback);

      // Should be called once immediately with the loaded value
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenLastCalledWith(savedValue);
    });
  });

  describe('set() method', () => {
    beforeEach(async () => {
      store = new PersistentStore(testKey, initialValue);
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      jest.clearAllMocks();
    });

    test('should update state and save to IndexedDB', async () => {
      const newValue = 'new value';
      store.set(newValue);

      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(store.get()).toBe(newValue);
      expect(idbSet).toHaveBeenCalledWith(testKey, newValue);
    });

    test('should not save to IndexedDB before initialization', () => {
      // Create new store without waiting for initialization
      const newStore = new PersistentStore('new-key', 'initial');
      newStore.set('new value');
      
      // Should not call idbSet because _isInitialized is false
      expect(idbSet).not.toHaveBeenCalled();
    });

    test('should notify subscribers when state changes', () => {
      const callback = jest.fn();
      store.subscribe(callback);
      
      // Clear initial call
      callback.mockClear();
      
      store.set('new value');
      expect(callback).toHaveBeenCalledWith('new value');
    });
  });

  describe('update() method', () => {
    beforeEach(async () => {
      store = new PersistentStore(testKey, 10);
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      jest.clearAllMocks();
    });

    test('should update state using updater function and save to IndexedDB', async () => {
      store.update(current => current + 5);

      // Wait for async save operation
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(store.get()).toBe(15);
      expect(idbSet).toHaveBeenCalledWith(testKey, 15);
    });

    test('should work with complex state objects', async () => {
      const initialState = { count: 0, name: 'test' };
      store.set(initialState);
      jest.clearAllMocks();

      store.update(current => ({ ...current, count: current.count + 1 }));

      // Wait for async save operation
      await new Promise(resolve => setTimeout(resolve, 50));

      const expectedState = { count: 1, name: 'test' };
      expect(store.get()).toEqual(expectedState);
      expect(idbSet).toHaveBeenCalledWith(testKey, expectedState);
    });

    test('should not save to IndexedDB before initialization', () => {
      // Create new store without waiting for initialization
      const newStore = new PersistentStore('new-key', 10);
      newStore.update(current => current + 5);
      
      // Should not call idbSet because _isInitialized is false
      expect(idbSet).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should handle IndexedDB get errors gracefully', async () => {
      idbGet.mockRejectedValue(new Error('IndexedDB error'));

      // Should not throw
      expect(() => {
        store = new PersistentStore(testKey, initialValue);
      }).not.toThrow();

      // Should use initial value
      expect(store.get()).toBe(initialValue);
    });

    test('should handle IndexedDB set errors gracefully', async () => {
      store = new PersistentStore(testKey, initialValue);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Clear previous calls
      jest.clearAllMocks();
      idbSet.mockRejectedValue(new Error('IndexedDB error'));

      // Should not throw
      expect(() => {
        store.set('new value');
      }).not.toThrow();

      // State should still be updated in memory
      expect(store.get()).toBe('new value');
    });
  });

  describe('inheritance from AetherStore', () => {
    beforeEach(async () => {
      // Reset mocks to avoid interference
      jest.clearAllMocks();
      idbGet.mockResolvedValue(undefined);
      idbSet.mockResolvedValue(undefined);

      store = new PersistentStore(testKey, initialValue);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    test('should inherit all AetherStore functionality', () => {
      const callback = jest.fn();
      const unsubscribe = store.subscribe(callback);

      expect(typeof unsubscribe).toBe('function');
      expect(callback).toHaveBeenCalledWith(initialValue);
    });

    test('should maintain subscription functionality', () => {
      const callback = jest.fn();
      store.subscribe(callback);

      callback.mockClear();
      store.set('new value');

      expect(callback).toHaveBeenCalledWith('new value');
    });
  });
});
