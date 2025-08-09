/**
 * REZILIENT.js Legacy System Compatibility Layer
 * 
 * Ensures the framework works on ALL systems:
 * - Legacy browsers (IE8+, old mobile browsers)
 * - Old mobile devices (iOS 6+, Android 2.3+)
 * - Legacy desktop systems (Windows XP+, macOS 10.6+)
 * - Embedded systems and IoT devices
 * - Feature phones and low-end devices
 */

/**
 * Browser and System Detection
 */
export class LegacyDetector {
  constructor() {
    this.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    this.platform = typeof navigator !== 'undefined' ? navigator.platform : '';
    this.capabilities = this.detectCapabilities();
  }

  detectCapabilities() {
    const capabilities = {
      // JavaScript Features
      es5: true, // Assume ES5 as minimum
      es6: typeof Symbol !== 'undefined',
      es2017: typeof Object.values !== 'undefined',
      es2018: typeof Object.fromEntries !== 'undefined',
      
      // Browser APIs
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      webWorkers: typeof Worker !== 'undefined',
      serviceWorkers: 'serviceWorker' in navigator,
      
      // Network APIs
      fetch: typeof fetch !== 'undefined',
      xhr: typeof XMLHttpRequest !== 'undefined',
      websockets: typeof WebSocket !== 'undefined',
      
      // DOM APIs
      querySelector: typeof document !== 'undefined' && document.querySelector,
      addEventListener: typeof addEventListener !== 'undefined',
      classList: typeof DOMTokenList !== 'undefined',
      
      // Mobile/Touch
      touchEvents: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      orientation: typeof screen !== 'undefined' && screen.orientation,
      
      // Performance APIs
      performance: typeof performance !== 'undefined',
      requestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
      
      // Modern Features
      promises: typeof Promise !== 'undefined',
      asyncAwait: (function() {
        try {
          return (function() {}).constructor('return (async function(){})().constructor')();
        } catch (e) {
          return false;
        }
      })(),
      
      // CSS Features
      flexbox: this.supportsCSSFeature('display', 'flex'),
      grid: this.supportsCSSFeature('display', 'grid'),
      customProperties: this.supportsCSSFeature('--test', 'test'),
      
      // Device Capabilities
      lowMemory: this.detectLowMemoryDevice(),
      slowCPU: this.detectSlowCPU(),
      limitedBandwidth: this.detectLimitedBandwidth()
    };

    return capabilities;
  }

  supportsCSSFeature(property, value) {
    if (typeof document === 'undefined') return false;
    
    const element = document.createElement('div');
    element.style[property] = value;
    return element.style[property] === value;
  }

  detectLowMemoryDevice() {
    // Detect devices with limited memory
    if (typeof navigator !== 'undefined' && navigator.deviceMemory) {
      return navigator.deviceMemory <= 2; // 2GB or less
    }
    
    // Fallback detection based on user agent
    const lowMemoryPatterns = [
      /Android [2-4]\./,
      /iPhone OS [6-9]_/,
      /Windows Phone/,
      /BlackBerry/,
      /Opera Mini/
    ];
    
    return lowMemoryPatterns.some(pattern => pattern.test(this.userAgent));
  }

  detectSlowCPU() {
    // Basic CPU performance detection
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
      return navigator.hardwareConcurrency <= 2;
    }
    return false;
  }

  detectLimitedBandwidth() {
    // Network connection detection
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const connection = navigator.connection;
      return connection.effectiveType === 'slow-2g' || 
             connection.effectiveType === '2g' ||
             connection.downlink < 1;
    }
    return false;
  }

  isLegacyBrowser() {
    const legacyPatterns = [
      /MSIE [6-9]\./,
      /MSIE 10\./,
      /Trident.*rv:11\./,
      /Chrome\/[1-3][0-9]\./,
      /Firefox\/[1-3][0-9]\./,
      /Safari\/[1-5][0-9][0-9]\./,
      /Opera\/[1-9]\./,
      /Android [2-4]\./,
      /iPhone OS [6-9]_/
    ];
    
    return legacyPatterns.some(pattern => pattern.test(this.userAgent));
  }

  getCompatibilityLevel() {
    if (this.capabilities.es6 && this.capabilities.fetch && this.capabilities.promises) {
      return 'modern';
    } else if (this.capabilities.es5 && this.capabilities.xhr) {
      return 'legacy';
    } else {
      return 'minimal';
    }
  }
}

/**
 * Polyfill Manager for Legacy Systems
 */
export class PolyfillManager {
  constructor(detector) {
    this.detector = detector;
    this.polyfills = new Map();
    this.loadedPolyfills = new Set();
  }

  registerPolyfill(name, condition, polyfillFn) {
    this.polyfills.set(name, { condition, polyfillFn });
  }

  async loadRequiredPolyfills() {
    const promises = [];
    
    for (const [name, { condition, polyfillFn }] of this.polyfills) {
      if (condition(this.detector.capabilities) && !this.loadedPolyfills.has(name)) {
        promises.push(this.loadPolyfill(name, polyfillFn));
      }
    }
    
    await Promise.all(promises);
  }

  async loadPolyfill(name, polyfillFn) {
    try {
      await polyfillFn();
      this.loadedPolyfills.add(name);
      console.log(`✅ Loaded polyfill: ${name}`);
    } catch (error) {
      console.warn(`⚠️ Failed to load polyfill ${name}:`, error);
    }
  }

  // Built-in polyfills
  setupBuiltinPolyfills() {
    // Promise polyfill
    this.registerPolyfill('promises', 
      (caps) => !caps.promises,
      () => this.loadPromisePolyfill()
    );

    // Fetch polyfill
    this.registerPolyfill('fetch',
      (caps) => !caps.fetch,
      () => this.loadFetchPolyfill()
    );

    // Array methods polyfills
    this.registerPolyfill('array-methods',
      (caps) => !caps.es5,
      () => this.loadArrayMethodsPolyfill()
    );

    // Object methods polyfills
    this.registerPolyfill('object-methods',
      (caps) => !caps.es6,
      () => this.loadObjectMethodsPolyfill()
    );

    // Event listener polyfill
    this.registerPolyfill('event-listeners',
      (caps) => !caps.addEventListener,
      () => this.loadEventListenerPolyfill()
    );

    // Local storage polyfill
    this.registerPolyfill('local-storage',
      (caps) => !caps.localStorage,
      () => this.loadLocalStoragePolyfill()
    );
  }

  loadPromisePolyfill() {
    if (typeof Promise === 'undefined') {
      // Minimal Promise implementation
      window.Promise = function(executor) {
        const self = this;
        self.state = 'pending';
        self.value = undefined;
        self.handlers = [];

        function resolve(result) {
          if (self.state === 'pending') {
            self.state = 'fulfilled';
            self.value = result;
            self.handlers.forEach(handle);
            self.handlers = null;
          }
        }

        function reject(error) {
          if (self.state === 'pending') {
            self.state = 'rejected';
            self.value = error;
            self.handlers.forEach(handle);
            self.handlers = null;
          }
        }

        function handle(handler) {
          if (self.state === 'pending') {
            self.handlers.push(handler);
          } else {
            if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
              handler.onFulfilled(self.value);
            }
            if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
              handler.onRejected(self.value);
            }
          }
        }

        this.then = function(onFulfilled, onRejected) {
          return new Promise(function(resolve, reject) {
            handle({
              onFulfilled: function(result) {
                try {
                  resolve(onFulfilled ? onFulfilled(result) : result);
                } catch (ex) {
                  reject(ex);
                }
              },
              onRejected: function(error) {
                try {
                  resolve(onRejected ? onRejected(error) : error);
                } catch (ex) {
                  reject(ex);
                }
              }
            });
          });
        };

        executor(resolve, reject);
      };
    }
  }

  loadFetchPolyfill() {
    if (typeof fetch === 'undefined') {
      window.fetch = function(url, options) {
        return new Promise(function(resolve, reject) {
          const xhr = new XMLHttpRequest();
          const method = (options && options.method) || 'GET';
          
          xhr.open(method, url);
          
          if (options && options.headers) {
            for (const key in options.headers) {
              xhr.setRequestHeader(key, options.headers[key]);
            }
          }
          
          xhr.onload = function() {
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              json: function() {
                return Promise.resolve(JSON.parse(xhr.responseText));
              },
              text: function() {
                return Promise.resolve(xhr.responseText);
              }
            });
          };
          
          xhr.onerror = function() {
            reject(new Error('Network error'));
          };
          
          xhr.send(options && options.body);
        });
      };
    }
  }

  loadArrayMethodsPolyfill() {
    // Array.forEach
    if (!Array.prototype.forEach) {
      Array.prototype.forEach = function(callback, thisArg) {
        for (let i = 0; i < this.length; i++) {
          callback.call(thisArg, this[i], i, this);
        }
      };
    }

    // Array.map
    if (!Array.prototype.map) {
      Array.prototype.map = function(callback, thisArg) {
        const result = [];
        for (let i = 0; i < this.length; i++) {
          result[i] = callback.call(thisArg, this[i], i, this);
        }
        return result;
      };
    }

    // Array.filter
    if (!Array.prototype.filter) {
      Array.prototype.filter = function(callback, thisArg) {
        const result = [];
        for (let i = 0; i < this.length; i++) {
          if (callback.call(thisArg, this[i], i, this)) {
            result.push(this[i]);
          }
        }
        return result;
      };
    }
  }

  loadObjectMethodsPolyfill() {
    // Object.keys
    if (!Object.keys) {
      Object.keys = function(obj) {
        const keys = [];
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            keys.push(key);
          }
        }
        return keys;
      };
    }

    // Object.assign
    if (!Object.assign) {
      Object.assign = function(target) {
        for (let i = 1; i < arguments.length; i++) {
          const source = arguments[i];
          for (const key in source) {
            if (source.hasOwnProperty(key)) {
              target[key] = source[key];
            }
          }
        }
        return target;
      };
    }
  }

  loadEventListenerPolyfill() {
    if (!window.addEventListener) {
      window.addEventListener = function(type, listener) {
        window.attachEvent('on' + type, listener);
      };
      
      window.removeEventListener = function(type, listener) {
        window.detachEvent('on' + type, listener);
      };
    }
  }

  loadLocalStoragePolyfill() {
    if (typeof localStorage === 'undefined') {
      // Cookie-based localStorage fallback
      window.localStorage = {
        getItem: function(key) {
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'ls_' + key) {
              return decodeURIComponent(value);
            }
          }
          return null;
        },
        setItem: function(key, value) {
          document.cookie = 'ls_' + key + '=' + encodeURIComponent(value) + '; path=/';
        },
        removeItem: function(key) {
          document.cookie = 'ls_' + key + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        }
      };
    }
  }
}

/**
 * Legacy Compatibility Manager
 */
export class LegacyCompatibilityManager {
  constructor() {
    this.detector = new LegacyDetector();
    this.polyfillManager = new PolyfillManager(this.detector);
    this.adaptiveConfig = this.createAdaptiveConfig();
  }

  async initialize() {
    console.log('🔧 Initializing Legacy Compatibility Layer...');
    console.log(`📱 Detected compatibility level: ${this.detector.getCompatibilityLevel()}`);
    
    // Setup and load polyfills
    this.polyfillManager.setupBuiltinPolyfills();
    await this.polyfillManager.loadRequiredPolyfills();
    
    // Apply adaptive configurations
    this.applyAdaptiveConfig();
    
    console.log('✅ Legacy Compatibility Layer initialized');
    return this.adaptiveConfig;
  }

  createAdaptiveConfig() {
    const caps = this.detector.capabilities;
    
    return {
      // Performance optimizations for legacy systems
      enableVirtualDOM: caps.es6 && !caps.lowMemory,
      enableServiceWorker: caps.serviceWorkers && !this.detector.isLegacyBrowser(),
      enableWebWorkers: caps.webWorkers && !caps.slowCPU,
      
      // Feature toggles based on capabilities
      useModernSyntax: caps.es6,
      useFetch: caps.fetch,
      useLocalStorage: caps.localStorage,
      useIndexedDB: caps.indexedDB,
      
      // UI adaptations
      enableAnimations: caps.requestAnimationFrame && !caps.slowCPU,
      enableTouchEvents: caps.touchEvents,
      useFlexbox: caps.flexbox,
      useGrid: caps.grid,
      
      // Network optimizations
      enableOfflineFirst: caps.serviceWorkers || caps.localStorage,
      enableBackgroundSync: caps.serviceWorkers,
      optimizeForSlowNetwork: caps.limitedBandwidth,
      
      // Memory optimizations
      enableLazyLoading: !caps.lowMemory,
      enableCaching: caps.localStorage || caps.indexedDB,
      limitConcurrentOperations: caps.slowCPU || caps.lowMemory,
      
      // Compatibility flags
      compatibilityLevel: this.detector.getCompatibilityLevel(),
      isLegacyBrowser: this.detector.isLegacyBrowser(),
      capabilities: caps
    };
  }

  applyAdaptiveConfig() {
    // Apply CSS classes for progressive enhancement
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      const level = this.adaptiveConfig.compatibilityLevel;
      
      html.className += ` rezilient-${level}`;
      
      if (this.adaptiveConfig.isLegacyBrowser) {
        html.className += ' rezilient-legacy';
      }
      
      // Add capability classes
      Object.keys(this.adaptiveConfig.capabilities).forEach(cap => {
        if (this.adaptiveConfig.capabilities[cap]) {
          html.className += ` rezilient-${cap}`;
        }
      });
    }
  }

  getOptimizedConfig(baseConfig) {
    // Merge base config with adaptive optimizations
    return Object.assign({}, baseConfig, {
      // Disable heavy features on legacy systems
      carbonAware: baseConfig.carbonAware && !this.adaptiveConfig.isLegacyBrowser,
      aiAware: baseConfig.aiAware && this.adaptiveConfig.capabilities.es6,
      quantumReady: baseConfig.quantumReady && this.adaptiveConfig.capabilities.webWorkers,
      
      // Optimize for device capabilities
      enableVirtualDOM: this.adaptiveConfig.enableVirtualDOM,
      enableServiceWorker: this.adaptiveConfig.enableServiceWorker,
      enableAnimations: this.adaptiveConfig.enableAnimations,
      
      // Legacy-specific optimizations
      legacyMode: this.adaptiveConfig.isLegacyBrowser,
      adaptiveConfig: this.adaptiveConfig
    });
  }
}
