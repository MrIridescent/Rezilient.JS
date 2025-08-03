// __tests__/AetherStore.test.js

import { AetherStore } from '../src/data/AetherStore.js';

describe('AetherStore', () => {
  let store;

  beforeEach(() => {
    store = new AetherStore('initial value');
  });

  describe('constructor', () => {
    test('should initialize with provided initial state', () => {
      expect(store.get()).toBe('initial value');
    });

    test('should initialize with empty subscribers set', () => {
      expect(store._subscribers.size).toBe(0);
    });
  });

  describe('get()', () => {
    test('should return current state', () => {
      expect(store.get()).toBe('initial value');
    });

    test('should return updated state after set', () => {
      store.set('new value');
      expect(store.get()).toBe('new value');
    });
  });

  describe('set()', () => {
    test('should update state', () => {
      store.set('new value');
      expect(store.get()).toBe('new value');
    });

    test('should notify subscribers when state changes', () => {
      const callback = jest.fn();
      store.subscribe(callback);
      
      // Clear the initial call
      callback.mockClear();
      
      store.set('new value');
      expect(callback).toHaveBeenCalledWith('new value');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should not notify subscribers when state is the same', () => {
      const callback = jest.fn();
      store.subscribe(callback);
      
      // Clear the initial call
      callback.mockClear();
      
      store.set('initial value'); // Same value
      expect(callback).not.toHaveBeenCalled();
    });

    test('should notify multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      store.subscribe(callback1);
      store.subscribe(callback2);
      
      // Clear initial calls
      callback1.mockClear();
      callback2.mockClear();
      
      store.set('new value');
      
      expect(callback1).toHaveBeenCalledWith('new value');
      expect(callback2).toHaveBeenCalledWith('new value');
    });
  });

  describe('update()', () => {
    test('should update state using updater function', () => {
      store.set(10);
      store.update(current => current + 5);
      expect(store.get()).toBe(15);
    });

    test('should notify subscribers when using update', () => {
      const callback = jest.fn();
      store.set(10);
      store.subscribe(callback);
      
      // Clear the initial call
      callback.mockClear();
      
      store.update(current => current + 5);
      expect(callback).toHaveBeenCalledWith(15);
    });

    test('should work with complex state objects', () => {
      const initialState = { count: 0, name: 'test' };
      store.set(initialState);
      
      store.update(current => ({ ...current, count: current.count + 1 }));
      
      expect(store.get()).toEqual({ count: 1, name: 'test' });
    });
  });

  describe('subscribe()', () => {
    test('should call callback immediately with current state', () => {
      const callback = jest.fn();
      store.subscribe(callback);
      
      expect(callback).toHaveBeenCalledWith('initial value');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should return unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = store.subscribe(callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    test('should stop receiving updates after unsubscribe', () => {
      const callback = jest.fn();
      const unsubscribe = store.subscribe(callback);
      
      // Clear initial call
      callback.mockClear();
      
      unsubscribe();
      store.set('new value');
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should handle multiple subscriptions and unsubscriptions', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      const unsubscribe1 = store.subscribe(callback1);
      const unsubscribe2 = store.subscribe(callback2);
      
      // Clear initial calls
      callback1.mockClear();
      callback2.mockClear();
      
      // Unsubscribe first callback
      unsubscribe1();
      
      store.set('new value');
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith('new value');
    });
  });

  describe('edge cases', () => {
    test('should handle null and undefined values', () => {
      store.set(null);
      expect(store.get()).toBe(null);
      
      store.set(undefined);
      expect(store.get()).toBe(undefined);
    });

    test('should handle boolean values', () => {
      store.set(true);
      expect(store.get()).toBe(true);
      
      store.set(false);
      expect(store.get()).toBe(false);
    });

    test('should handle array values', () => {
      const array = [1, 2, 3];
      store.set(array);
      expect(store.get()).toBe(array);
      expect(store.get()).toEqual([1, 2, 3]);
    });

    test('should handle object values', () => {
      const obj = { a: 1, b: 2 };
      store.set(obj);
      expect(store.get()).toBe(obj);
      expect(store.get()).toEqual({ a: 1, b: 2 });
    });
  });
});
