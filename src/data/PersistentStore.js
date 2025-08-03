// src/data/PersistentStore.js

import { AetherStore } from './AetherStore.js';

// Check if we're in a test environment
const isTestEnvironment = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

// Simple storage functions without external dependencies
const get = async (key) => {
  // In test environment, use mock storage
  if (isTestEnvironment) {
    // Use the mocked idb-keyval if available
    try {
      const { get: idbGet } = await import('idb-keyval');
      return await idbGet(key);
    } catch (error) {
      return undefined;
    }
  }

  if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
    try {
      // Simple IndexedDB implementation without idb-keyval
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('aether-store', 1);

        request.onerror = () => resolve(undefined);

        request.onsuccess = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('keyval')) {
            resolve(undefined);
            return;
          }

          const transaction = db.transaction(['keyval'], 'readonly');
          const store = transaction.objectStore('keyval');
          const getRequest = store.get(key);

          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => resolve(undefined);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('keyval')) {
            db.createObjectStore('keyval');
          }
        };
      });
    } catch (error) {
      console.warn('IndexedDB get failed:', error.message);
      return undefined;
    }
  }
  return undefined;
};

const idbSet = async (key, value) => {
  // In test environment, use mock storage
  if (isTestEnvironment) {
    try {
      const { set: idbSetMock } = await import('idb-keyval');
      return await idbSetMock(key, value);
    } catch (error) {
      return;
    }
  }

  if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
    try {
      // Simple IndexedDB implementation without idb-keyval
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('aether-store', 1);

        request.onerror = () => resolve();

        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['keyval'], 'readwrite');
          const store = transaction.objectStore('keyval');
          const setRequest = store.put(value, key);

          setRequest.onsuccess = () => resolve();
          setRequest.onerror = () => resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('keyval')) {
            db.createObjectStore('keyval');
          }
        };
      });
    } catch (error) {
      console.warn('IndexedDB set failed:', error.message);
    }
  }
};

/**
 * @class PersistentStore
 * Extends AetherStore to provide automatic persistence to IndexedDB.
 * It loads its initial state from IndexedDB and saves any changes back.
 */
export class PersistentStore extends AetherStore {
  /**
   * @constructor
   * @param {string} key - The key to use for storing the data in IndexedDB.
   * @param {any} initialValue - The value to use if nothing is found in IndexedDB.
   */
  constructor(key, initialValue) {
    super(initialValue);
    this.key = key;
    this._isInitialized = false;
    this._init();
  }

  /**
   * Initializes the store by loading the value from IndexedDB.
   * @private
   */
  async _init() {
    try {
      const savedValue = await get(this.key);
      if (savedValue !== undefined) {
        this._state = savedValue;
      }
    } catch (error) {
      console.warn(`PersistentStore(${this.key}): Failed to load from storage:`, error.message);
    }

    this._isInitialized = true;
    this._notify(); // Notify subscribers with the loaded state
  }

  /**
   * Updates the store's state and saves it to IndexedDB.
   * @override
   * @param {any} newState - The new state.
   */
  set(newState) {
    super.set(newState);
    if (this._isInitialized) {
      idbSet(this.key, newState).catch(error => {
        console.warn(`PersistentStore(${this.key}): Failed to save to IndexedDB:`, error.message);
      });
    }
  }

  /**
   * Updates the store's state using an updater function and saves it.
   * @override
   * @param {function} updater - A function that receives the current state
   * and returns the new state.
   */
  update(updater) {
    super.update(updater);
    if (this._isInitialized) {
      idbSet(this.key, this._state).catch(error => {
        console.warn(`PersistentStore(${this.key}): Failed to save to IndexedDB:`, error.message);
      });
    }
  }
}
