// src/utils/environment.js

/**
 * Environment Detection and Compatibility Utilities
 * Provides universal compatibility across Node.js, browsers, and other environments
 */

export class EnvironmentDetector {
  static _cache = new Map();
  
  /**
   * Detect current environment
   */
  static getEnvironment() {
    if (this._cache.has('environment')) {
      return this._cache.get('environment');
    }
    
    let env = 'unknown';
    
    // Node.js detection
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      env = 'node';
    }
    // Browser detection
    else if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      env = 'browser';
    }
    // Web Worker detection
    else if (typeof self !== 'undefined' && typeof importScripts === 'function') {
      env = 'webworker';
    }
    // React Native detection
    else if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      env = 'react-native';
    }
    
    this._cache.set('environment', env);
    return env;
  }
  
  /**
   * Check if running in browser
   */
  static isBrowser() {
    return this.getEnvironment() === 'browser';
  }
  
  /**
   * Check if running in Node.js
   */
  static isNode() {
    return this.getEnvironment() === 'node';
  }
  
  /**
   * Check if running in Web Worker
   */
  static isWebWorker() {
    return this.getEnvironment() === 'webworker';
  }
  
  /**
   * Check if running in React Native
   */
  static isReactNative() {
    return this.getEnvironment() === 'react-native';
  }
  
  /**
   * Get safe global object
   */
  static getGlobal() {
    if (this._cache.has('global')) {
      return this._cache.get('global');
    }
    
    let globalObj;
    
    if (typeof globalThis !== 'undefined') {
      globalObj = globalThis;
    } else if (typeof window !== 'undefined') {
      globalObj = window;
    } else if (typeof global !== 'undefined') {
      globalObj = global;
    } else if (typeof self !== 'undefined') {
      globalObj = self;
    } else {
      globalObj = {};
    }
    
    this._cache.set('global', globalObj);
    return globalObj;
  }
}

/**
 * Browser API Compatibility Layer
 */
export class BrowserAPICompat {
  /**
   * Safe navigator access
   */
  static getNavigator() {
    const global = EnvironmentDetector.getGlobal();
    return global.navigator || {
      userAgent: 'Aether.js/Node.js',
      platform: 'node',
      onLine: true,
      connection: { effectiveType: '4g' },
      permissions: {
        query: () => Promise.resolve({ state: 'granted' })
      },
      mediaDevices: {
        getUserMedia: () => Promise.reject(new Error('Media not available in Node.js'))
      }
    };
  }
  
  /**
   * Safe localStorage access
   */
  static getLocalStorage() {
    if (EnvironmentDetector.isBrowser()) {
      try {
        return window.localStorage;
      } catch (error) {
        return this.createMemoryStorage();
      }
    }
    return this.createMemoryStorage();
  }
  
  /**
   * Safe sessionStorage access
   */
  static getSessionStorage() {
    if (EnvironmentDetector.isBrowser()) {
      try {
        return window.sessionStorage;
      } catch (error) {
        return this.createMemoryStorage();
      }
    }
    return this.createMemoryStorage();
  }
  
  /**
   * Safe IndexedDB access
   */
  static getIndexedDB() {
    if (EnvironmentDetector.isBrowser()) {
      return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    }
    return null;
  }
  
  /**
   * Safe document access
   */
  static getDocument() {
    const global = EnvironmentDetector.getGlobal();
    return global.document || {
      createElement: () => ({}),
      getElementById: () => null,
      querySelector: () => null,
      addEventListener: () => {},
      removeEventListener: () => {}
    };
  }
  
  /**
   * Safe window access
   */
  static getWindow() {
    const global = EnvironmentDetector.getGlobal();
    return global.window || global;
  }
  
  /**
   * Safe confirm dialog
   */
  static confirm(message) {
    if (EnvironmentDetector.isBrowser() && typeof window.confirm === 'function') {
      return window.confirm(message);
    }
    // Node.js fallback - auto-approve for testing
    console.log(`[Aether.js] Auto-confirming: ${message}`);
    return true;
  }
  
  /**
   * Safe alert dialog
   */
  static alert(message) {
    if (EnvironmentDetector.isBrowser() && typeof window.alert === 'function') {
      window.alert(message);
    } else {
      console.log(`[Aether.js] Alert: ${message}`);
    }
  }
  
  /**
   * Create memory-based storage
   */
  static createMemoryStorage() {
    const storage = new Map();
    
    return {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: (key) => storage.delete(key),
      clear: () => storage.clear(),
      get length() { return storage.size; },
      key: (index) => Array.from(storage.keys())[index] || null
    };
  }
  
  /**
   * Safe fetch API
   */
  static async fetch(url, options = {}) {
    if (EnvironmentDetector.isBrowser() && typeof fetch === 'function') {
      return fetch(url, options);
    }
    
    // Node.js fallback
    if (EnvironmentDetector.isNode()) {
      try {
        const { default: fetch } = await import('node-fetch');
        return fetch(url, options);
      } catch (error) {
        throw new Error('Fetch not available in Node.js environment');
      }
    }
    
    throw new Error('Fetch not available in current environment');
  }
  
  /**
   * Safe WebXR access
   */
  static getWebXR() {
    const navigator = this.getNavigator();
    return navigator.xr || {
      isSessionSupported: () => Promise.resolve(false),
      requestSession: () => Promise.reject(new Error('WebXR not supported'))
    };
  }
  
  /**
   * Safe Web Workers
   */
  static createWorker(script) {
    if (EnvironmentDetector.isBrowser() && typeof Worker === 'function') {
      return new Worker(script);
    }
    
    // Fallback worker-like object
    return {
      postMessage: (data) => console.log('Worker message:', data),
      terminate: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    };
  }
  
  /**
   * Safe performance API
   */
  static getPerformance() {
    const global = EnvironmentDetector.getGlobal();
    return global.performance || {
      now: () => Date.now(),
      mark: () => {},
      measure: () => {},
      getEntriesByType: () => []
    };
  }
  
  /**
   * Safe crypto API
   */
  static getCrypto() {
    const global = EnvironmentDetector.getGlobal();
    
    if (global.crypto && global.crypto.getRandomValues) {
      return global.crypto;
    }
    
    // Node.js fallback
    if (EnvironmentDetector.isNode()) {
      try {
        const crypto = require('crypto');
        return {
          getRandomValues: (array) => {
            const bytes = crypto.randomBytes(array.length);
            for (let i = 0; i < array.length; i++) {
              array[i] = bytes[i];
            }
            return array;
          },
          subtle: crypto.webcrypto?.subtle || null
        };
      } catch (error) {
        // Fallback to Math.random
      }
    }
    
    // Fallback crypto implementation
    return {
      getRandomValues: (array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      },
      subtle: null
    };
  }
}

/**
 * Performance Compatibility
 */
export class PerformanceCompat {
  static _marks = new Map();
  static _measures = new Map();
  
  /**
   * High-resolution timestamp
   */
  static now() {
    const perf = BrowserAPICompat.getPerformance();
    return perf.now();
  }
  
  /**
   * Performance mark
   */
  static mark(name) {
    this._marks.set(name, this.now());
    const perf = BrowserAPICompat.getPerformance();
    if (perf.mark) {
      perf.mark(name);
    }
  }
  
  /**
   * Performance measure
   */
  static measure(name, startMark, endMark) {
    const startTime = this._marks.get(startMark) || 0;
    const endTime = this._marks.get(endMark) || this.now();
    const duration = endTime - startTime;
    
    this._measures.set(name, { duration, startTime, endTime });
    
    const perf = BrowserAPICompat.getPerformance();
    if (perf.measure) {
      try {
        perf.measure(name, startMark, endMark);
      } catch (error) {
        // Fallback handled above
      }
    }
    
    return duration;
  }
  
  /**
   * Get performance entries
   */
  static getEntries() {
    return Array.from(this._measures.entries()).map(([name, data]) => ({
      name,
      entryType: 'measure',
      startTime: data.startTime,
      duration: data.duration
    }));
  }
}

/**
 * Network Compatibility
 */
export class NetworkCompat {
  /**
   * Get network information
   */
  static getNetworkInfo() {
    const navigator = BrowserAPICompat.getNavigator();
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    return {
      isOnline: navigator.onLine !== false,
      effectiveType: connection?.effectiveType || '4g',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 100,
      saveData: connection?.saveData || false
    };
  }
  
  /**
   * Add network change listener
   */
  static addNetworkListener(callback) {
    const global = EnvironmentDetector.getGlobal();
    
    if (EnvironmentDetector.isBrowser()) {
      global.addEventListener('online', () => callback({ isOnline: true }));
      global.addEventListener('offline', () => callback({ isOnline: false }));
      
      const navigator = BrowserAPICompat.getNavigator();
      const connection = navigator.connection;
      if (connection && connection.addEventListener) {
        connection.addEventListener('change', () => {
          callback(this.getNetworkInfo());
        });
      }
    }
  }
}

// Export all utilities
export default {
  EnvironmentDetector,
  BrowserAPICompat,
  PerformanceCompat,
  NetworkCompat
};
