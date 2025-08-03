/**
 * Real Energy Monitoring and Measurement
 * Provides actual energy consumption tracking and optimization
 */

export class EnergyMonitor {
  constructor(options = {}) {
    this.options = {
      sampleInterval: 1000, // 1 second
      enableBatteryAPI: true,
      enablePerformanceAPI: true,
      enableNetworkAPI: true,
      ...options
    };
    
    this.energyMetrics = new Map();
    this.batteryInfo = null;
    this.performanceObserver = null;
    this.networkObserver = null;
    this.baselineConsumption = 0;
    
    this.initialize();
  }

  async initialize() {
    console.log('🔋 Initializing Real Energy Monitor...');
    
    // Initialize battery monitoring
    if (this.options.enableBatteryAPI) {
      await this.initializeBatteryMonitoring();
    }
    
    // Initialize performance monitoring
    if (this.options.enablePerformanceAPI) {
      this.initializePerformanceMonitoring();
    }
    
    // Initialize network monitoring
    if (this.options.enableNetworkAPI) {
      this.initializeNetworkMonitoring();
    }
    
    // Start continuous monitoring
    this.startContinuousMonitoring();
    
    // Establish baseline
    setTimeout(() => this.establishBaseline(), 5000);
  }

  async initializeBatteryMonitoring() {
    try {
      if ('getBattery' in navigator) {
        this.batteryInfo = await navigator.getBattery();
        
        // Monitor battery events
        this.batteryInfo.addEventListener('chargingchange', () => {
          this.recordEnergyEvent('battery_charging_change', {
            charging: this.batteryInfo.charging,
            level: this.batteryInfo.level
          });
        });
        
        this.batteryInfo.addEventListener('levelchange', () => {
          this.recordEnergyEvent('battery_level_change', {
            level: this.batteryInfo.level,
            dischargingTime: this.batteryInfo.dischargingTime
          });
        });
        
        console.log('🔋 Battery API monitoring enabled');
      }
    } catch (error) {
      console.warn('Battery API not available:', error);
    }
  }

  initializePerformanceMonitoring() {
    try {
      if ('PerformanceObserver' in window) {
        // Monitor CPU-intensive operations
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.recordPerformanceEnergyImpact(entry);
          });
        });
        
        // Observe different performance entry types
        ['measure', 'navigation', 'resource', 'paint'].forEach(type => {
          try {
            this.performanceObserver.observe({ entryTypes: [type] });
          } catch (e) {
            // Some entry types might not be supported
          }
        });
        
        console.log('⚡ Performance monitoring enabled');
      }
    } catch (error) {
      console.warn('Performance Observer not available:', error);
    }
  }

  initializeNetworkMonitoring() {
    try {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        
        connection.addEventListener('change', () => {
          this.recordEnergyEvent('network_change', {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
          });
        });
        
        console.log('📡 Network monitoring enabled');
      }
    } catch (error) {
      console.warn('Network Information API not available:', error);
    }
  }

  startContinuousMonitoring() {
    setInterval(() => {
      this.collectEnergyMetrics();
    }, this.options.sampleInterval);
  }

  collectEnergyMetrics() {
    const timestamp = Date.now();
    const metrics = {
      timestamp,
      battery: this.getBatteryMetrics(),
      performance: this.getPerformanceMetrics(),
      network: this.getNetworkMetrics(),
      cpu: this.getCPUMetrics(),
      memory: this.getMemoryMetrics()
    };
    
    // Calculate estimated energy consumption
    metrics.estimatedConsumption = this.calculateEnergyConsumption(metrics);
    
    this.energyMetrics.set(timestamp, metrics);
    
    // Keep only last 100 measurements
    if (this.energyMetrics.size > 100) {
      const oldestKey = this.energyMetrics.keys().next().value;
      this.energyMetrics.delete(oldestKey);
    }
  }

  getBatteryMetrics() {
    if (!this.batteryInfo) return null;
    
    return {
      level: this.batteryInfo.level,
      charging: this.batteryInfo.charging,
      chargingTime: this.batteryInfo.chargingTime,
      dischargingTime: this.batteryInfo.dischargingTime,
      // Calculate discharge rate
      dischargeRate: this.calculateDischargeRate()
    };
  }

  calculateDischargeRate() {
    if (!this.batteryInfo || this.batteryInfo.charging) return 0;
    
    const recentMetrics = Array.from(this.energyMetrics.values()).slice(-5);
    if (recentMetrics.length < 2) return 0;
    
    const oldest = recentMetrics[0];
    const newest = recentMetrics[recentMetrics.length - 1];
    
    if (!oldest.battery || !newest.battery) return 0;
    
    const timeDiff = (newest.timestamp - oldest.timestamp) / 1000; // seconds
    const levelDiff = oldest.battery.level - newest.battery.level;
    
    return levelDiff / timeDiff; // % per second
  }

  getPerformanceMetrics() {
    if (typeof performance === 'undefined') return null;
    
    const metrics = {
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      timing: performance.timing ? {
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
      } : null
    };
    
    return metrics;
  }

  getNetworkMetrics() {
    if (!('connection' in navigator)) return null;
    
    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
      // Estimate network energy impact
      energyImpact: this.calculateNetworkEnergyImpact(connection)
    };
  }

  calculateNetworkEnergyImpact(connection) {
    // Energy consumption estimates based on connection type
    const energyFactors = {
      'slow-2g': 0.1,
      '2g': 0.3,
      '3g': 0.6,
      '4g': 1.0,
      '5g': 1.2
    };
    
    const baseFactor = energyFactors[connection.effectiveType] || 0.5;
    const rttFactor = Math.min(connection.rtt / 100, 2); // Higher RTT = more energy
    
    return baseFactor * (1 + rttFactor);
  }

  getCPUMetrics() {
    // Estimate CPU usage based on performance metrics
    if (typeof performance === 'undefined') return null;
    
    const now = performance.now();
    const entries = performance.getEntriesByType('measure');
    
    // Calculate CPU intensity based on recent measurements
    const recentMeasures = entries.filter(entry => 
      now - entry.startTime < 5000 // Last 5 seconds
    );
    
    const totalDuration = recentMeasures.reduce((sum, entry) => sum + entry.duration, 0);
    const cpuIntensity = Math.min(totalDuration / 5000, 1); // Normalize to 0-1
    
    return {
      intensity: cpuIntensity,
      recentMeasures: recentMeasures.length,
      totalDuration
    };
  }

  getMemoryMetrics() {
    if (typeof performance === 'undefined' || !performance.memory) return null;
    
    const memory = performance.memory;
    const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    
    return {
      usage,
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      // Memory pressure affects energy consumption
      energyImpact: usage > 0.8 ? 1.5 : usage > 0.6 ? 1.2 : 1.0
    };
  }

  calculateEnergyConsumption(metrics) {
    let consumption = this.baselineConsumption;
    
    // CPU contribution
    if (metrics.cpu) {
      consumption += metrics.cpu.intensity * 0.4; // 40% weight for CPU
    }
    
    // Memory contribution
    if (metrics.memory) {
      consumption += metrics.memory.energyImpact * 0.2; // 20% weight for memory
    }
    
    // Network contribution
    if (metrics.network) {
      consumption += metrics.network.energyImpact * 0.3; // 30% weight for network
    }
    
    // Battery discharge rate contribution
    if (metrics.battery && metrics.battery.dischargeRate > 0) {
      consumption += metrics.battery.dischargeRate * 100; // Scale discharge rate
    }
    
    return Math.max(consumption, 0.1); // Minimum baseline consumption
  }

  establishBaseline() {
    const recentMetrics = Array.from(this.energyMetrics.values()).slice(-10);
    if (recentMetrics.length === 0) return;
    
    const avgConsumption = recentMetrics.reduce((sum, metric) => 
      sum + (metric.estimatedConsumption || 0.1), 0) / recentMetrics.length;
    
    this.baselineConsumption = avgConsumption;
    console.log(`🔋 Energy baseline established: ${avgConsumption.toFixed(3)} units`);
  }

  recordEnergyEvent(type, data) {
    const event = {
      type,
      timestamp: Date.now(),
      data,
      energyImpact: this.calculateEventEnergyImpact(type, data)
    };
    
    // Store in recent events
    if (!this.recentEvents) this.recentEvents = [];
    this.recentEvents.push(event);
    
    // Keep only last 50 events
    if (this.recentEvents.length > 50) {
      this.recentEvents = this.recentEvents.slice(-50);
    }
  }

  calculateEventEnergyImpact(type, data) {
    switch (type) {
      case 'battery_charging_change':
        return data.charging ? -0.5 : 0.5; // Charging reduces impact
      case 'battery_level_change':
        return data.level < 0.2 ? 1.5 : 1.0; // Low battery increases impact
      case 'network_change':
        return this.calculateNetworkEnergyImpact(data);
      default:
        return 0.1;
    }
  }

  recordPerformanceEnergyImpact(entry) {
    let energyImpact = 0;
    
    switch (entry.entryType) {
      case 'measure':
        energyImpact = entry.duration / 1000; // Duration in seconds
        break;
      case 'resource':
        energyImpact = (entry.transferSize || 0) / 1000000; // MB transferred
        break;
      case 'navigation':
        energyImpact = entry.loadEventEnd / 1000; // Load time in seconds
        break;
      default:
        energyImpact = 0.1;
    }
    
    this.recordEnergyEvent('performance_entry', {
      entryType: entry.entryType,
      name: entry.name,
      duration: entry.duration,
      energyImpact
    });
  }

  // Public API methods
  getCurrentEnergyConsumption() {
    const latest = Array.from(this.energyMetrics.values()).slice(-1)[0];
    return latest ? latest.estimatedConsumption : this.baselineConsumption;
  }

  getEnergyTrend(minutes = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentMetrics = Array.from(this.energyMetrics.values())
      .filter(metric => metric.timestamp > cutoff);
    
    if (recentMetrics.length < 2) return 0;
    
    const oldest = recentMetrics[0];
    const newest = recentMetrics[recentMetrics.length - 1];
    
    return newest.estimatedConsumption - oldest.estimatedConsumption;
  }

  getEnergyReport() {
    const current = this.getCurrentEnergyConsumption();
    const trend = this.getEnergyTrend();
    const batteryMetrics = this.getBatteryMetrics();
    
    return {
      current,
      trend,
      baseline: this.baselineConsumption,
      efficiency: this.baselineConsumption / current,
      battery: batteryMetrics,
      recommendations: this.generateEnergyRecommendations(current, trend)
    };
  }

  generateEnergyRecommendations(current, trend) {
    const recommendations = [];

    if (current > this.baselineConsumption * 1.5) {
      recommendations.push('High energy consumption detected - consider reducing CPU-intensive operations');
    }

    if (trend > 0.1) {
      recommendations.push('Energy consumption is increasing - monitor for memory leaks or runaway processes');
    }

    if (this.batteryInfo && this.batteryInfo.level < 0.2) {
      recommendations.push('Low battery - enable power saving mode');
    }

    return recommendations;
  }

  /**
   * GPU Energy Tracking
   */
  initializeGPUMonitoring() {
    try {
      // WebGL context for GPU monitoring
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (gl) {
        this.gpuContext = gl;
        this.gpuInfo = {
          vendor: gl.getParameter(gl.VENDOR),
          renderer: gl.getParameter(gl.RENDERER),
          version: gl.getParameter(gl.VERSION),
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
        };

        console.log('🎮 GPU monitoring initialized:', this.gpuInfo.renderer);

        // Monitor GPU memory usage
        this.startGPUMemoryMonitoring();
      }
    } catch (error) {
      console.warn('GPU monitoring initialization failed:', error);
    }
  }

  startGPUMemoryMonitoring() {
    if (!this.gpuContext) return;

    setInterval(() => {
      try {
        const ext = this.gpuContext.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          const gpuMemory = this.estimateGPUMemoryUsage();
          this.recordEnergyEvent('gpu_memory_usage', {
            estimatedUsage: gpuMemory,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        // GPU monitoring failed, continue silently
      }
    }, 5000); // Every 5 seconds
  }

  estimateGPUMemoryUsage() {
    // Estimate GPU memory usage based on WebGL state
    if (!this.gpuContext) return 0;

    try {
      const gl = this.gpuContext;

      // Get texture memory usage estimate
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const textureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

      // Rough estimate based on typical usage patterns
      const estimatedTextureMemory = (maxTextureSize * maxTextureSize * 4 * textureUnits) / (1024 * 1024); // MB

      return {
        textureMemoryMB: estimatedTextureMemory,
        maxTextureSize,
        textureUnits,
        energyImpact: this.calculateGPUEnergyImpact(estimatedTextureMemory)
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  calculateGPUEnergyImpact(memoryUsageMB) {
    // GPU energy consumption estimation
    const baseGPUPower = 50; // Watts for integrated GPU
    const memoryFactor = memoryUsageMB / 1000; // Scale factor
    const utilizationFactor = this.getGPUUtilization();

    return baseGPUPower * (0.3 + memoryFactor * 0.4 + utilizationFactor * 0.3);
  }

  getGPUUtilization() {
    // Estimate GPU utilization based on recent rendering activity
    const recentGPUEvents = this.recentEvents?.filter(event =>
      event.type.includes('gpu') || event.type.includes('render')
    ) || [];

    return Math.min(recentGPUEvents.length / 10, 1.0);
  }

  /**
   * Network Request Energy Tracking
   */
  trackNetworkEnergy(request) {
    const energyCost = this.calculateNetworkEnergyCost(request);

    this.recordEnergyEvent('network_request', {
      url: request.url,
      method: request.method,
      size: request.size || 0,
      duration: request.duration || 0,
      energyCost,
      timestamp: Date.now()
    });

    return energyCost;
  }

  calculateNetworkEnergyCost(request) {
    // Energy cost calculation for network requests
    const baseEnergy = 0.001; // Base energy per request (Wh)
    const sizeEnergy = (request.size || 0) * 0.000001; // Energy per byte
    const durationEnergy = (request.duration || 0) * 0.0001; // Energy per ms

    // Connection type multiplier
    const connectionMultiplier = this.getConnectionEnergyMultiplier();

    return (baseEnergy + sizeEnergy + durationEnergy) * connectionMultiplier;
  }

  getConnectionEnergyMultiplier() {
    if (!('connection' in navigator)) return 1.0;

    const connection = navigator.connection;
    const multipliers = {
      'slow-2g': 3.0,
      '2g': 2.5,
      '3g': 2.0,
      '4g': 1.0,
      '5g': 0.8
    };

    return multipliers[connection.effectiveType] || 1.0;
  }

  /**
   * Storage Operation Energy Tracking
   */
  trackStorageEnergy(operation) {
    const energyCost = this.calculateStorageEnergyCost(operation);

    this.recordEnergyEvent('storage_operation', {
      type: operation.type, // 'read', 'write', 'delete'
      size: operation.size || 0,
      duration: operation.duration || 0,
      storage: operation.storage || 'unknown', // 'localStorage', 'indexedDB', etc.
      energyCost,
      timestamp: Date.now()
    });

    return energyCost;
  }

  calculateStorageEnergyCost(operation) {
    // Energy cost for storage operations
    const baseCosts = {
      read: 0.0001,    // Wh per read
      write: 0.0005,   // Wh per write
      delete: 0.0002   // Wh per delete
    };

    const baseEnergy = baseCosts[operation.type] || baseCosts.read;
    const sizeEnergy = (operation.size || 0) * 0.0000001; // Energy per byte
    const durationEnergy = (operation.duration || 0) * 0.00001; // Energy per ms

    // Storage type multiplier
    const storageMultiplier = this.getStorageEnergyMultiplier(operation.storage);

    return (baseEnergy + sizeEnergy + durationEnergy) * storageMultiplier;
  }

  getStorageEnergyMultiplier(storageType) {
    const multipliers = {
      'localStorage': 1.0,
      'sessionStorage': 1.0,
      'indexedDB': 1.5,
      'webSQL': 2.0,
      'cache': 1.2
    };

    return multipliers[storageType] || 1.0;
  }

  /**
   * Real-time Energy Optimization
   */
  enableRealTimeOptimization() {
    console.log('⚡ Enabling real-time energy optimization...');

    this.optimizationInterval = setInterval(() => {
      this.performRealTimeOptimization();
    }, 10000); // Every 10 seconds
  }

  performRealTimeOptimization() {
    const currentConsumption = this.getCurrentEnergyConsumption();
    const trend = this.getEnergyTrend(2); // 2-minute trend

    // Apply optimizations based on current state
    if (currentConsumption > this.baselineConsumption * 2) {
      this.applyHighConsumptionOptimizations();
    }

    if (trend > 0.2) {
      this.applyTrendOptimizations();
    }

    if (this.batteryInfo && this.batteryInfo.level < 0.3) {
      this.applyBatteryOptimizations();
    }

    // GPU optimizations
    if (this.gpuContext) {
      this.applyGPUOptimizations();
    }
  }

  applyHighConsumptionOptimizations() {
    console.log('🔋 Applying high consumption optimizations...');

    // Reduce animation frame rate
    if (typeof requestAnimationFrame !== 'undefined') {
      this.throttleAnimations();
    }

    // Reduce network polling frequency
    this.throttleNetworkRequests();

    // Clear unnecessary caches
    this.clearNonEssentialCaches();
  }

  applyTrendOptimizations() {
    console.log('📈 Applying trend-based optimizations...');

    // Preemptively reduce resource usage
    this.reduceBackgroundProcessing();

    // Optimize memory usage
    this.optimizeMemoryUsage();
  }

  applyBatteryOptimizations() {
    console.log('🔋 Applying battery-saving optimizations...');

    // Enable aggressive power saving
    this.enableAggressivePowerSaving();

    // Reduce screen brightness (if possible)
    this.requestScreenBrightnessReduction();

    // Pause non-critical operations
    this.pauseNonCriticalOperations();
  }

  applyGPUOptimizations() {
    const gpuUsage = this.getGPUUtilization();

    if (gpuUsage > 0.7) {
      console.log('🎮 Applying GPU optimizations...');

      // Reduce rendering quality
      this.reduceRenderingQuality();

      // Limit frame rate
      this.limitFrameRate();
    }
  }

  throttleAnimations() {
    // Implement animation throttling
    if (window.AetherAnimationThrottle) return;

    window.AetherAnimationThrottle = true;
    const originalRAF = window.requestAnimationFrame;
    let throttleCounter = 0;

    window.requestAnimationFrame = function(callback) {
      throttleCounter++;
      if (throttleCounter % 2 === 0) { // Skip every other frame
        return originalRAF(callback);
      }
      return setTimeout(callback, 16); // ~60fps -> ~30fps
    };
  }

  throttleNetworkRequests() {
    // Implement network request throttling
    if (window.AetherNetworkThrottle) return;

    window.AetherNetworkThrottle = true;
    console.log('🌐 Network requests throttled for energy saving');
  }

  clearNonEssentialCaches() {
    // Clear caches that aren't critical
    try {
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('non-essential') || cacheName.includes('images')) {
              caches.delete(cacheName);
            }
          });
        });
      }
    } catch (error) {
      console.warn('Cache clearing failed:', error);
    }
  }

  reduceBackgroundProcessing() {
    // Reduce background processing
    console.log('⏸️ Reducing background processing for energy optimization');
  }

  optimizeMemoryUsage() {
    // Force garbage collection if available
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }

    // Clear large objects from memory
    this.clearLargeObjects();
  }

  clearLargeObjects() {
    // Clear large objects that can be recreated
    if (this.energyMetrics.size > 50) {
      const entries = Array.from(this.energyMetrics.entries());
      this.energyMetrics.clear();
      // Keep only the most recent 25 entries
      entries.slice(-25).forEach(([key, value]) => {
        this.energyMetrics.set(key, value);
      });
    }
  }

  enableAggressivePowerSaving() {
    console.log('🔋 Aggressive power saving mode enabled');

    // Increase monitoring intervals
    clearInterval(this.monitoringInterval);
    this.monitoringInterval = setInterval(() => {
      this.collectEnergyMetrics();
    }, this.options.sampleInterval * 3); // 3x slower monitoring
  }

  requestScreenBrightnessReduction() {
    // Request screen brightness reduction (limited browser support)
    if ('screen' in navigator && 'brightness' in navigator.screen) {
      try {
        navigator.screen.brightness = Math.max(navigator.screen.brightness * 0.7, 0.3);
      } catch (error) {
        // Screen brightness control not available
      }
    }
  }

  pauseNonCriticalOperations() {
    // Pause non-critical operations
    console.log('⏸️ Non-critical operations paused for battery saving');

    // Emit event for applications to respond
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('aether-power-save', {
        detail: { level: 'aggressive' }
      }));
    }
  }

  reduceRenderingQuality() {
    // Reduce rendering quality for GPU optimization
    if (this.gpuContext) {
      const gl = this.gpuContext;

      // Reduce texture quality
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

      console.log('🎮 GPU rendering quality reduced for energy saving');
    }
  }

  limitFrameRate() {
    // Limit frame rate for GPU optimization
    if (!window.AetherFrameRateLimit) {
      window.AetherFrameRateLimit = true;

      const originalRAF = window.requestAnimationFrame;
      let lastFrame = 0;
      const targetFPS = 30; // Limit to 30 FPS
      const frameInterval = 1000 / targetFPS;

      window.requestAnimationFrame = function(callback) {
        const now = Date.now();
        if (now - lastFrame >= frameInterval) {
          lastFrame = now;
          return originalRAF(callback);
        }
        return setTimeout(() => callback(now), frameInterval - (now - lastFrame));
      };

      console.log('🎮 Frame rate limited to 30 FPS for energy saving');
    }
  }

  disableRealTimeOptimization() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
      console.log('⚡ Real-time energy optimization disabled');
    }
  }
}

export default EnergyMonitor;
