// src/compatibility/BrowserCompat.js

import { EnvironmentDetector, BrowserAPICompat } from '../utils/environment.js';

/**
 * @class BrowserCompat
 * Comprehensive browser compatibility layer for Aether.js
 * 
 * Supports:
 * - Chrome 60+ (2017)
 * - Firefox 55+ (2017)
 * - Safari 11+ (2017)
 * - Edge 79+ (2020)
 * - Mobile browsers
 * - Progressive enhancement
 * - Polyfill management
 */
export class BrowserCompat {
  static _features = new Map();
  static _polyfills = new Map();
  static _initialized = false;
  
  /**
   * Initialize browser compatibility
   */
  static async init() {
    if (this._initialized) return;
    
    console.log('🌐 BrowserCompat: Initializing universal browser support...');
    
    // Detect browser features
    this.detectFeatures();
    
    // Load required polyfills
    await this.loadPolyfills();
    
    // Setup progressive enhancement
    this.setupProgressiveEnhancement();
    
    this._initialized = true;
    console.log('✅ BrowserCompat: Universal browser support active');
  }
  
  /**
   * Detect browser features
   */
  static detectFeatures() {
    if (!EnvironmentDetector.isBrowser()) {
      // Node.js environment - assume modern features
      this._features.set('es6', true);
      this._features.set('modules', true);
      this._features.set('promises', true);
      this._features.set('fetch', true);
      return;
    }
    
    const features = {
      // ES6+ Features
      es6: this.supportsES6(),
      modules: this.supportsModules(),
      promises: this.supportsPromises(),
      asyncAwait: this.supportsAsyncAwait(),
      classes: this.supportsClasses(),
      arrow: this.supportsArrowFunctions(),
      destructuring: this.supportsDestructuring(),
      spread: this.supportsSpread(),
      
      // Web APIs
      fetch: this.supportsFetch(),
      webWorkers: this.supportsWebWorkers(),
      serviceWorker: this.supportsServiceWorker(),
      indexedDB: this.supportsIndexedDB(),
      localStorage: this.supportsLocalStorage(),
      sessionStorage: this.supportsSessionStorage(),
      
      // Modern APIs
      intersectionObserver: this.supportsIntersectionObserver(),
      mutationObserver: this.supportsMutationObserver(),
      performanceObserver: this.supportsPerformanceObserver(),
      resizeObserver: this.supportsResizeObserver(),
      
      // WebXR and Spatial
      webXR: this.supportsWebXR(),
      webGL: this.supportsWebGL(),
      webGL2: this.supportsWebGL2(),
      
      // Media APIs
      mediaDevices: this.supportsMediaDevices(),
      webRTC: this.supportsWebRTC(),
      
      // Crypto APIs
      crypto: this.supportsCrypto(),
      subtleCrypto: this.supportsSubtleCrypto(),
      
      // Network APIs
      networkInformation: this.supportsNetworkInformation(),
      
      // Performance APIs
      performanceMemory: this.supportsPerformanceMemory(),
      performanceTiming: this.supportsPerformanceTiming(),
      
      // CSS Features
      cssGrid: this.supportsCSSGrid(),
      cssFlexbox: this.supportsCSSFlexbox(),
      cssCustomProperties: this.supportsCSSCustomProperties(),
      
      // Touch and Input
      touchEvents: this.supportsTouchEvents(),
      pointerEvents: this.supportsPointerEvents()
    };
    
    // Store detected features
    for (const [feature, supported] of Object.entries(features)) {
      this._features.set(feature, supported);
    }
    
    console.log('🔍 Browser features detected:', features);
  }
  
  /**
   * Load required polyfills
   */
  static async loadPolyfills() {
    const polyfillsNeeded = [];
    
    // Check which polyfills are needed
    if (!this._features.get('fetch')) {
      polyfillsNeeded.push('fetch');
    }
    
    if (!this._features.get('promises')) {
      polyfillsNeeded.push('promises');
    }
    
    if (!this._features.get('intersectionObserver')) {
      polyfillsNeeded.push('intersection-observer');
    }
    
    if (!this._features.get('resizeObserver')) {
      polyfillsNeeded.push('resize-observer');
    }
    
    if (!this._features.get('webWorkers')) {
      polyfillsNeeded.push('web-workers');
    }
    
    // Load polyfills
    for (const polyfill of polyfillsNeeded) {
      await this.loadPolyfill(polyfill);
    }
    
    if (polyfillsNeeded.length > 0) {
      console.log('📦 Polyfills loaded:', polyfillsNeeded);
    }
  }
  
  /**
   * Load individual polyfill
   */
  static async loadPolyfill(name) {
    try {
      switch (name) {
        case 'fetch':
          await this.loadFetchPolyfill();
          break;
        case 'promises':
          await this.loadPromisePolyfill();
          break;
        case 'intersection-observer':
          await this.loadIntersectionObserverPolyfill();
          break;
        case 'resize-observer':
          await this.loadResizeObserverPolyfill();
          break;
        case 'web-workers':
          await this.loadWebWorkerPolyfill();
          break;
        default:
          console.warn(`Unknown polyfill: ${name}`);
      }
      
      this._polyfills.set(name, true);
    } catch (error) {
      console.warn(`Failed to load polyfill ${name}:`, error);
      this._polyfills.set(name, false);
    }
  }
  
  /**
   * Fetch polyfill
   */
  static async loadFetchPolyfill() {
    if (typeof fetch === 'undefined') {
      // Simple fetch polyfill using XMLHttpRequest
      window.fetch = function(url, options = {}) {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.open(options.method || 'GET', url);
          
          // Set headers
          if (options.headers) {
            for (const [key, value] of Object.entries(options.headers)) {
              xhr.setRequestHeader(key, value);
            }
          }
          
          xhr.onload = () => {
            const response = {
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              text: () => Promise.resolve(xhr.responseText),
              json: () => Promise.resolve(JSON.parse(xhr.responseText)),
              headers: {
                get: (name) => xhr.getResponseHeader(name)
              }
            };
            resolve(response);
          };
          
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(options.body);
        });
      };
    }
  }
  
  /**
   * Promise polyfill
   */
  static async loadPromisePolyfill() {
    if (typeof Promise === 'undefined') {
      // Basic Promise polyfill
      window.Promise = class Promise {
        constructor(executor) {
          this.state = 'pending';
          this.value = undefined;
          this.handlers = [];
          
          const resolve = (value) => {
            if (this.state === 'pending') {
              this.state = 'fulfilled';
              this.value = value;
              this.handlers.forEach(handler => handler.onFulfilled(value));
            }
          };
          
          const reject = (reason) => {
            if (this.state === 'pending') {
              this.state = 'rejected';
              this.value = reason;
              this.handlers.forEach(handler => handler.onRejected(reason));
            }
          };
          
          try {
            executor(resolve, reject);
          } catch (error) {
            reject(error);
          }
        }
        
        then(onFulfilled, onRejected) {
          return new Promise((resolve, reject) => {
            const handler = {
              onFulfilled: (value) => {
                try {
                  const result = onFulfilled ? onFulfilled(value) : value;
                  resolve(result);
                } catch (error) {
                  reject(error);
                }
              },
              onRejected: (reason) => {
                try {
                  const result = onRejected ? onRejected(reason) : reason;
                  reject(result);
                } catch (error) {
                  reject(error);
                }
              }
            };
            
            if (this.state === 'fulfilled') {
              handler.onFulfilled(this.value);
            } else if (this.state === 'rejected') {
              handler.onRejected(this.value);
            } else {
              this.handlers.push(handler);
            }
          });
        }
        
        catch(onRejected) {
          return this.then(null, onRejected);
        }
        
        static resolve(value) {
          return new Promise(resolve => resolve(value));
        }
        
        static reject(reason) {
          return new Promise((_, reject) => reject(reason));
        }
      };
    }
  }
  
  /**
   * IntersectionObserver polyfill
   */
  static async loadIntersectionObserverPolyfill() {
    if (typeof IntersectionObserver === 'undefined') {
      // Basic IntersectionObserver polyfill
      window.IntersectionObserver = class IntersectionObserver {
        constructor(callback, options = {}) {
          this.callback = callback;
          this.options = options;
          this.targets = new Set();
        }
        
        observe(target) {
          this.targets.add(target);
          // Simplified implementation - always consider visible
          setTimeout(() => {
            this.callback([{
              target,
              isIntersecting: true,
              intersectionRatio: 1
            }]);
          }, 100);
        }
        
        unobserve(target) {
          this.targets.delete(target);
        }
        
        disconnect() {
          this.targets.clear();
        }
      };
    }
  }
  
  /**
   * ResizeObserver polyfill
   */
  static async loadResizeObserverPolyfill() {
    if (typeof ResizeObserver === 'undefined') {
      // Basic ResizeObserver polyfill
      window.ResizeObserver = class ResizeObserver {
        constructor(callback) {
          this.callback = callback;
          this.targets = new Set();
        }
        
        observe(target) {
          this.targets.add(target);
          // Simplified implementation using window resize
          const handler = () => {
            this.callback([{
              target,
              contentRect: target.getBoundingClientRect()
            }]);
          };
          
          window.addEventListener('resize', handler);
          target._resizeHandler = handler;
        }
        
        unobserve(target) {
          this.targets.delete(target);
          if (target._resizeHandler) {
            window.removeEventListener('resize', target._resizeHandler);
            delete target._resizeHandler;
          }
        }
        
        disconnect() {
          this.targets.forEach(target => this.unobserve(target));
        }
      };
    }
  }
  
  /**
   * Web Worker polyfill
   */
  static async loadWebWorkerPolyfill() {
    if (typeof Worker === 'undefined') {
      // Basic Worker polyfill using setTimeout
      window.Worker = class Worker {
        constructor(scriptURL) {
          this.scriptURL = scriptURL;
          this.onmessage = null;
          this.onerror = null;
        }
        
        postMessage(data) {
          // Simulate async processing
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage({ data: `Processed: ${JSON.stringify(data)}` });
            }
          }, 10);
        }
        
        terminate() {
          // No-op in polyfill
        }
        
        addEventListener(type, listener) {
          if (type === 'message') {
            this.onmessage = listener;
          } else if (type === 'error') {
            this.onerror = listener;
          }
        }
        
        removeEventListener(type, listener) {
          if (type === 'message') {
            this.onmessage = null;
          } else if (type === 'error') {
            this.onerror = null;
          }
        }
      };
    }
  }
  
  /**
   * Setup progressive enhancement
   */
  static setupProgressiveEnhancement() {
    if (!EnvironmentDetector.isBrowser()) return;
    
    // Add feature classes to document
    const html = document.documentElement;
    
    for (const [feature, supported] of this._features) {
      html.classList.add(supported ? `aether-${feature}` : `aether-no-${feature}`);
    }
    
    // Add browser detection classes
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      html.classList.add('aether-chrome');
    } else if (userAgent.includes('firefox')) {
      html.classList.add('aether-firefox');
    } else if (userAgent.includes('safari')) {
      html.classList.add('aether-safari');
    } else if (userAgent.includes('edge')) {
      html.classList.add('aether-edge');
    }
    
    // Add mobile detection
    if (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      html.classList.add('aether-mobile');
    } else {
      html.classList.add('aether-desktop');
    }
  }
  
  // Feature detection methods
  static supportsES6() {
    try {
      return typeof Symbol !== 'undefined' && 
             typeof Map !== 'undefined' && 
             typeof Set !== 'undefined';
    } catch { return false; }
  }
  
  static supportsModules() {
    const script = document.createElement('script');
    return 'noModule' in script;
  }
  
  static supportsPromises() {
    return typeof Promise !== 'undefined';
  }
  
  static supportsAsyncAwait() {
    try {
      return (async () => {})().constructor === Promise;
    } catch { return false; }
  }
  
  static supportsClasses() {
    try {
      eval('class Test {}');
      return true;
    } catch { return false; }
  }
  
  static supportsArrowFunctions() {
    try {
      eval('() => {}');
      return true;
    } catch { return false; }
  }
  
  static supportsDestructuring() {
    try {
      eval('const {a} = {a: 1}');
      return true;
    } catch { return false; }
  }
  
  static supportsSpread() {
    try {
      eval('[...[], 1]');
      return true;
    } catch { return false; }
  }
  
  static supportsFetch() {
    return typeof fetch !== 'undefined';
  }
  
  static supportsWebWorkers() {
    return typeof Worker !== 'undefined';
  }
  
  static supportsServiceWorker() {
    return 'serviceWorker' in navigator;
  }
  
  static supportsIndexedDB() {
    return typeof indexedDB !== 'undefined';
  }
  
  static supportsLocalStorage() {
    try {
      return typeof localStorage !== 'undefined' && localStorage !== null;
    } catch { return false; }
  }
  
  static supportsSessionStorage() {
    try {
      return typeof sessionStorage !== 'undefined' && sessionStorage !== null;
    } catch { return false; }
  }
  
  static supportsIntersectionObserver() {
    return typeof IntersectionObserver !== 'undefined';
  }
  
  static supportsMutationObserver() {
    return typeof MutationObserver !== 'undefined';
  }
  
  static supportsPerformanceObserver() {
    return typeof PerformanceObserver !== 'undefined';
  }
  
  static supportsResizeObserver() {
    return typeof ResizeObserver !== 'undefined';
  }
  
  static supportsWebXR() {
    return 'xr' in navigator;
  }
  
  static supportsWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch { return false; }
  }
  
  static supportsWebGL2() {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch { return false; }
  }
  
  static supportsMediaDevices() {
    return 'mediaDevices' in navigator;
  }
  
  static supportsWebRTC() {
    return typeof RTCPeerConnection !== 'undefined';
  }
  
  static supportsCrypto() {
    return typeof crypto !== 'undefined' && 'getRandomValues' in crypto;
  }
  
  static supportsSubtleCrypto() {
    return typeof crypto !== 'undefined' && 'subtle' in crypto;
  }
  
  static supportsNetworkInformation() {
    return 'connection' in navigator;
  }
  
  static supportsPerformanceMemory() {
    return typeof performance !== 'undefined' && 'memory' in performance;
  }
  
  static supportsPerformanceTiming() {
    return typeof performance !== 'undefined' && 'timing' in performance;
  }
  
  static supportsCSSGrid() {
    return CSS.supports('display', 'grid');
  }
  
  static supportsCSSFlexbox() {
    return CSS.supports('display', 'flex');
  }
  
  static supportsCSSCustomProperties() {
    return CSS.supports('--custom', 'property');
  }
  
  static supportsTouchEvents() {
    return 'ontouchstart' in window;
  }
  
  static supportsPointerEvents() {
    return 'onpointerdown' in window;
  }
  
  /**
   * Check if feature is supported
   */
  static isSupported(feature) {
    return this._features.get(feature) || false;
  }
  
  /**
   * Get all supported features
   */
  static getSupportedFeatures() {
    return Object.fromEntries(this._features);
  }
  
  /**
   * Get browser compatibility report
   */
  static getCompatibilityReport() {
    const supported = Array.from(this._features.entries()).filter(([, support]) => support);
    const unsupported = Array.from(this._features.entries()).filter(([, support]) => !support);
    const polyfilled = Array.from(this._polyfills.entries()).filter(([, loaded]) => loaded);
    
    return {
      environment: EnvironmentDetector.getEnvironment(),
      totalFeatures: this._features.size,
      supportedFeatures: supported.length,
      unsupportedFeatures: unsupported.length,
      polyfillsLoaded: polyfilled.length,
      compatibilityScore: (supported.length / this._features.size) * 100,
      supported: Object.fromEntries(supported),
      unsupported: Object.fromEntries(unsupported),
      polyfills: Object.fromEntries(polyfilled)
    };
  }
}

// Auto-initialize in browser
if (EnvironmentDetector.isBrowser()) {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BrowserCompat.init());
  } else {
    BrowserCompat.init();
  }
}
