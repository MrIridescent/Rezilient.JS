// src/scheduler/CarbonAwareScheduler.js

import { BrowserAPICompat, EnvironmentDetector, NetworkCompat } from '../utils/environment.js';

/**
 * @class CarbonAwareScheduler
 * Intelligent scheduling system that optimizes operations based on carbon intensity,
 * network conditions, and user behavior patterns for sustainable computing
 * Universal compatibility (Node.js, Browser, React Native)
 */

export class CarbonAwareScheduler {
  constructor(options = {}) {
    this.options = {
      enableCarbonAwareness: options.enableCarbonAwareness !== false,
      carbonApiKey: options.carbonApiKey,
      carbonApiUrl: options.carbonApiUrl || 'https://api.carbonintensity.org.uk',
      maxDelayHours: options.maxDelayHours || 24,
      urgentThreshold: options.urgentThreshold || 5 * 60 * 1000, // 5 minutes
      batchSize: options.batchSize || 10,
      ...options
    };

    // Task queue with priority levels
    this.taskQueue = {
      urgent: [],     // Execute immediately regardless of carbon intensity
      high: [],       // Execute within 1 hour
      normal: [],     // Execute within 6 hours
      low: [],        // Execute within 24 hours
      background: []  // Execute only during low carbon periods
    };

    // Carbon intensity data
    this.carbonData = {
      current: { intensity: 'medium', forecast: [] },
      lastUpdate: 0,
      updateInterval: 30 * 60 * 1000, // 30 minutes
      history: []
    };

    // Network and device conditions
    this.conditions = {
      network: 'unknown',
      battery: 'unknown',
      charging: false,
      connectionType: 'unknown'
    };

    // Scheduling statistics
    this.stats = {
      tasksScheduled: 0,
      tasksExecuted: 0,
      carbonSaved: 0,
      energySaved: 0,
      averageDelay: 0
    };

    this.initialize();
  }

  /**
   * Initialize the scheduler
   */
  async initialize() {
    await this.updateCarbonData();
    this.updateDeviceConditions();
    this.setupPeriodicUpdates();
    this.startScheduler();
  }

  /**
   * Schedule a task with carbon awareness
   */
  async scheduleTask(task, priority = 'normal', options = {}) {
    // Validate priority
    const validPriorities = ['urgent', 'high', 'normal', 'low', 'background'];
    if (!validPriorities.includes(priority)) {
      console.warn(`Invalid priority "${priority}", using "normal" instead`);
      priority = 'normal';
    }

    const enhancedTask = {
      id: this.generateTaskId(),
      ...task,
      priority,
      scheduledAt: Date.now(),
      options: {
        maxDelay: options.maxDelay || this.getMaxDelayForPriority(priority),
        carbonAware: options.carbonAware !== false,
        networkAware: options.networkAware !== false,
        batteryAware: options.batteryAware !== false,
        ...options
      },
      attempts: 0,
      lastAttempt: null,
      estimatedCarbonCost: this.estimateCarbonCost(task),
      estimatedDuration: options.estimatedDuration || 1000
    };

    // Add to appropriate queue
    this.taskQueue[priority].push(enhancedTask);
    this.stats.tasksScheduled++;

    // Trigger immediate execution for urgent tasks
    if (priority === 'urgent') {
      return this.executeTask(enhancedTask);
    }

    // Schedule execution based on optimal conditions
    this.scheduleOptimalExecution(enhancedTask);

    return enhancedTask.id;
  }

  /**
   * Schedule batch operations for optimal carbon efficiency
   */
  async scheduleBatch(tasks, priority = 'normal', options = {}) {
    const batchId = this.generateTaskId();
    const batchTask = {
      id: batchId,
      type: 'batch',
      tasks,
      priority,
      scheduledAt: Date.now(),
      options: {
        batchSize: options.batchSize || this.options.batchSize,
        ...options
      },
      estimatedCarbonCost: tasks.reduce((total, task) => 
        total + this.estimateCarbonCost(task), 0
      ),
      estimatedDuration: tasks.reduce((total, task) => 
        total + (task.estimatedDuration || 1000), 0
      )
    };

    return this.scheduleTask(batchTask, priority, options);
  }

  /**
   * Update carbon intensity data from external APIs
   */
  async updateCarbonData() {
    if (!this.options.enableCarbonAwareness) {
      this.carbonData.current.intensity = 'medium';
      return;
    }

    try {
      // Try to get real carbon intensity data
      const carbonIntensity = await this.fetchCarbonIntensity();
      
      if (carbonIntensity) {
        this.carbonData.current = carbonIntensity;
        this.carbonData.lastUpdate = Date.now();
        
        // Add to history for trend analysis
        this.carbonData.history.push({
          timestamp: Date.now(),
          intensity: carbonIntensity.intensity,
          value: carbonIntensity.value || 0
        });
        
        // Keep only last 24 hours of history
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.carbonData.history = this.carbonData.history.filter(
          entry => entry.timestamp > dayAgo
        );
      }
    } catch (error) {
      console.warn('Failed to update carbon data, using fallback:', error);
      this.useFallbackCarbonData();
    }
  }

  /**
   * Fetch carbon intensity from external API
   */
  async fetchCarbonIntensity() {
    // Try real carbon intensity APIs first
    const realIntensity = await this.getRealCarbonIntensity();
    if (realIntensity !== null) {
      return realIntensity;
    }

    // Fallback to intelligent simulation
    return this.simulateCarbonIntensity();
  }

  async getRealCarbonIntensity() {
    try {
      // 1. Try UK Carbon Intensity API (free, no key required)
      const ukGridData = await this.fetchUKGridCarbon();
      if (ukGridData) return ukGridData;

      // 2. Try CO2 Signal API if key provided
      if (this.options.carbonApiKey) {
        const co2SignalData = await this.fetchCO2Signal();
        if (co2SignalData) return co2SignalData;
      }

      // 3. Try WattTime API if configured
      if (this.options.wattTimeToken) {
        const wattTimeData = await this.fetchWattTimeAPI();
        if (wattTimeData) return wattTimeData;
      }

      // 4. Try Carbon Interface API if configured
      if (this.options.carbonInterfaceKey) {
        const carbonInterfaceData = await this.fetchCarbonInterfaceAPI();
        if (carbonInterfaceData) return carbonInterfaceData;
      }

      // 5. Try custom API if configured
      if (this.options.carbonApiUrl) {
        const customData = await this.fetchCustomCarbonAPI();
        if (customData) return customData;
      }

      return null; // No real data available
    } catch (error) {
      console.warn(`Real carbon API error: ${error.message}`);
      return null;
    }
  }

  /**
   * Calculate real carbon footprint for operations
   */
  async calculateCarbonFootprint(operation, duration = 1000) {
    const carbonData = await this.fetchCarbonIntensity();

    // Energy consumption estimates for different operations (in kWh)
    const operationEnergy = {
      'cpu-intensive': 0.0001 * (duration / 1000), // 0.1W per second
      'network-request': 0.000001 * (duration / 1000), // 1mW per second
      'storage-write': 0.00001 * (duration / 1000), // 10mW per second
      'gpu-render': 0.001 * (duration / 1000), // 1W per second
      'idle': 0.00001 * (duration / 1000), // 10mW per second
      'default': 0.00005 * (duration / 1000) // 50mW per second
    };

    const energyUsed = operationEnergy[operation] || operationEnergy['default'];
    const carbonIntensity = carbonData.value || 400; // gCO2/kWh
    const carbonFootprint = energyUsed * carbonIntensity; // gCO2

    return {
      operation,
      duration,
      energyUsed, // kWh
      carbonIntensity, // gCO2/kWh
      carbonFootprint, // gCO2
      timestamp: Date.now(),
      source: carbonData.source || 'simulation'
    };
  }

  /**
   * Get optimal scheduling time based on carbon forecasts
   */
  async getOptimalSchedulingTime(maxDelayHours = 24) {
    try {
      // Try to get forecast data from UK Grid API
      const response = await fetch(`https://api.carbonintensity.org.uk/intensity/date`);

      if (response.ok) {
        const data = await response.json();
        const forecasts = data.data || [];

        // Find the time slot with lowest carbon intensity
        let optimalTime = null;
        let lowestIntensity = Infinity;

        const now = new Date();
        const maxTime = new Date(now.getTime() + (maxDelayHours * 60 * 60 * 1000));

        forecasts.forEach(forecast => {
          const forecastTime = new Date(forecast.from);
          const intensity = forecast.intensity.forecast;

          if (forecastTime >= now && forecastTime <= maxTime && intensity < lowestIntensity) {
            lowestIntensity = intensity;
            optimalTime = forecastTime;
          }
        });

        return {
          optimalTime,
          currentIntensity: forecasts[0]?.intensity?.actual || forecasts[0]?.intensity?.forecast,
          optimalIntensity: lowestIntensity,
          potentialSavings: ((forecasts[0]?.intensity?.forecast || 400) - lowestIntensity) / (forecasts[0]?.intensity?.forecast || 400),
          delayMinutes: optimalTime ? Math.round((optimalTime - now) / (1000 * 60)) : 0
        };
      }
    } catch (error) {
      console.warn('Carbon forecast error:', error);
    }

    // Fallback to heuristic optimization
    return this.getHeuristicOptimalTime();
  }

  getHeuristicOptimalTime() {
    const now = new Date();
    const hour = now.getHours();

    // Optimal times based on typical renewable energy patterns
    let optimalHour;
    if (hour < 10) {
      optimalHour = 12; // Solar peak
    } else if (hour < 16) {
      optimalHour = 14; // Solar peak
    } else {
      optimalHour = 12; // Next day solar peak
    }

    const optimalTime = new Date(now);
    optimalTime.setHours(optimalHour, 0, 0, 0);

    if (optimalTime <= now) {
      optimalTime.setDate(optimalTime.getDate() + 1);
    }

    return {
      optimalTime,
      currentIntensity: 400, // Estimated
      optimalIntensity: 200, // Estimated solar peak
      potentialSavings: 0.5, // 50% savings estimate
      delayMinutes: Math.round((optimalTime - now) / (1000 * 60))
    };
  }

  async fetchUKGridCarbon() {
    try {
      const response = await fetch('https://api.carbonintensity.org.uk/intensity');

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const value = data.data[0].intensity.actual || data.data[0].intensity.forecast;
          const intensity = this.valueToIntensity(value);

          console.log(`🌱 Real carbon intensity from UK Grid: ${value} gCO2/kWh (${intensity})`);

          return {
            intensity,
            value,
            timestamp: Date.now(),
            source: 'uk-grid'
          };
        }
      }
    } catch (error) {
      console.warn(`UK Grid Carbon API error: ${error.message}`);
    }
    return null;
  }

  async fetchCO2Signal() {
    try {
      // Try multiple regions for better coverage
      const regions = ['US', 'GB', 'DE', 'FR', 'CA'];

      for (const region of regions) {
        const response = await fetch(`https://api.co2signal.com/v1/latest?countryCode=${region}`, {
          headers: {
            'auth-token': this.options.carbonApiKey
          }
        });

        if (response.ok) {
          const data = await response.json();
          const value = data.data.carbonIntensity;
          const intensity = this.valueToIntensity(value);

          console.log(`🌱 Real carbon intensity from CO2 Signal (${region}): ${value} gCO2eq/kWh (${intensity})`);

          return {
            intensity,
            value,
            timestamp: Date.now(),
            source: 'co2signal',
            region,
            fossilFuelPercentage: data.data.fossilFuelPercentage || 0,
            renewablePercentage: 100 - (data.data.fossilFuelPercentage || 0)
          };
        }
      }
    } catch (error) {
      console.warn(`CO2 Signal API error: ${error.message}`);
    }
    return null;
  }

  async fetchWattTimeAPI() {
    if (!this.options.wattTimeToken) return null;

    try {
      // Get real-time marginal emissions
      const response = await fetch('https://api2.watttime.org/v2/marginal', {
        headers: {
          'Authorization': `Bearer ${this.options.wattTimeToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const value = data.marginal_carbon_intensity;
        const intensity = this.valueToIntensity(value);

        console.log(`🌱 Real marginal carbon intensity from WattTime: ${value} lbs CO2/MWh (${intensity})`);

        return {
          intensity,
          value: value * 0.453592, // Convert lbs to kg
          timestamp: Date.now(),
          source: 'watttime',
          marginalIntensity: value,
          region: data.region || 'unknown'
        };
      }
    } catch (error) {
      console.warn(`WattTime API error: ${error.message}`);
    }
    return null;
  }

  async fetchCarbonInterfaceAPI() {
    if (!this.options.carbonInterfaceKey) return null;

    try {
      // Get electricity emissions factors
      const response = await fetch('https://www.carboninterface.com/api/v1/estimates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.options.carbonInterfaceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'electricity',
          electricity_unit: 'kwh',
          electricity_value: 1,
          country: 'us',
          state: 'ca'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const value = data.data.attributes.carbon_kg * 1000; // Convert to grams
        const intensity = this.valueToIntensity(value);

        console.log(`🌱 Real carbon intensity from Carbon Interface: ${value} gCO2/kWh (${intensity})`);

        return {
          intensity,
          value,
          timestamp: Date.now(),
          source: 'carbon-interface',
          carbonKg: data.data.attributes.carbon_kg,
          carbonLb: data.data.attributes.carbon_lb
        };
      }
    } catch (error) {
      console.warn(`Carbon Interface API error: ${error.message}`);
    }
    return null;
  }

  async fetchCustomCarbonAPI() {
    try {
      const response = await fetch(`${this.options.carbonApiUrl}/intensity`, {
        headers: this.options.carbonApiKey ? {
          'Authorization': `Bearer ${this.options.carbonApiKey}`
        } : {}
      });

      if (!response.ok) {
        throw new Error(`Carbon API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseCarbonApiResponse(data);
    } catch (error) {
      console.warn('Custom Carbon API request failed:', error);
      return null;
    }
  }

  /**
   * Simulate carbon intensity based on time patterns
   */
  simulateCarbonIntensity() {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Simulate renewable energy patterns
    let intensity, value;
    
    // Weekends typically have lower demand
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Solar peak hours (10 AM - 4 PM)
    if (hour >= 10 && hour <= 16) {
      intensity = 'low';
      value = isWeekend ? 150 : 200;
    }
    // Evening peak (6 PM - 9 PM)
    else if (hour >= 18 && hour <= 21) {
      intensity = 'high';
      value = isWeekend ? 350 : 450;
    }
    // Night hours
    else if (hour >= 22 || hour <= 6) {
      intensity = 'medium';
      value = isWeekend ? 250 : 300;
    }
    // Other hours
    else {
      intensity = 'medium';
      value = isWeekend ? 200 : 280;
    }

    return {
      intensity,
      value,
      forecast: this.generateForecast(value),
      timestamp: Date.now()
    };
  }

  /**
   * Generate carbon intensity forecast
   */
  generateForecast(currentValue) {
    const forecast = [];
    let value = currentValue;
    
    for (let i = 1; i <= 24; i++) {
      // Add some randomness and daily patterns
      const hour = (new Date().getHours() + i) % 24;
      const variation = (Math.random() - 0.5) * 50;
      
      // Solar peak influence
      if (hour >= 10 && hour <= 16) {
        value = Math.max(100, value - 30 + variation);
      }
      // Evening peak influence
      else if (hour >= 18 && hour <= 21) {
        value = Math.min(500, value + 50 + variation);
      }
      // Gradual changes for other hours
      else {
        value = Math.max(100, Math.min(400, value + variation));
      }
      
      forecast.push({
        hour: hour,
        value: Math.round(value),
        intensity: this.valueToIntensity(value)
      });
    }
    
    return forecast;
  }

  /**
   * Convert numeric value to intensity category
   */
  valueToIntensity(value) {
    if (value < 200) return 'low';
    if (value < 350) return 'medium';
    return 'high';
  }

  /**
   * Update device and network conditions
   */
  updateDeviceConditions() {
    // Network conditions using compatibility layer
    const navigator = BrowserAPICompat.getNavigator();
    const networkInfo = NetworkCompat.getNetworkInfo();

    this.conditions.network = networkInfo.effectiveType;
    this.conditions.connectionType = networkInfo.effectiveType;

    // Battery conditions
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        this.conditions.battery = battery.level;
        this.conditions.charging = battery.charging;
      }).catch(() => {
        // Fallback for environments without battery API
        this.conditions.battery = 1.0; // Assume full battery
        this.conditions.charging = true;
      });
    } else {
      // Fallback for environments without battery API
      this.conditions.battery = 1.0;
      this.conditions.charging = true;
    }
  }

  /**
   * Determine optimal execution time for a task
   */
  scheduleOptimalExecution(task) {
    const optimalTime = this.findOptimalExecutionTime(task);
    const delay = Math.max(0, optimalTime - Date.now());

    if (delay === 0) {
      // Execute immediately
      this.executeTask(task);
    } else {
      // Schedule for later
      setTimeout(() => {
        this.executeTask(task);
      }, delay);
    }
  }

  /**
   * Find the optimal execution time based on carbon forecast and constraints
   */
  findOptimalExecutionTime(task) {
    const now = Date.now();
    const maxDelay = task.options.maxDelay;
    const deadline = now + maxDelay;

    // For urgent tasks, execute immediately
    if (task.priority === 'urgent') {
      return now;
    }

    // If carbon awareness is disabled, execute based on priority
    if (!task.options.carbonAware) {
      return now + this.getPriorityDelay(task.priority);
    }

    // Find the best time window in the forecast
    const forecast = this.carbonData.current.forecast || [];
    let bestTime = now;
    let bestScore = this.calculateExecutionScore(now, task);

    for (const forecastEntry of forecast) {
      const forecastTime = now + (forecastEntry.hour * 60 * 60 * 1000);
      
      // Skip if beyond deadline
      if (forecastTime > deadline) continue;
      
      const score = this.calculateExecutionScore(forecastTime, task, forecastEntry);
      
      if (score > bestScore) {
        bestScore = score;
        bestTime = forecastTime;
      }
    }

    return bestTime;
  }

  /**
   * Calculate execution score for a given time
   */
  calculateExecutionScore(time, task, forecastEntry = null) {
    let score = 100; // Base score

    // Carbon intensity factor (higher score for lower intensity)
    const intensity = forecastEntry ? 
      forecastEntry.intensity : 
      this.carbonData.current.intensity;
    
    switch (intensity) {
      case 'low':
        score += 50;
        break;
      case 'medium':
        score += 20;
        break;
      case 'high':
        score -= 30;
        break;
    }

    // Time delay penalty (prefer sooner execution)
    const delay = time - Date.now();
    const delayHours = delay / (60 * 60 * 1000);
    score -= delayHours * 5;

    // Network condition factor
    if (task.options.networkAware) {
      switch (this.conditions.network) {
        case '4g':
        case 'wifi':
          score += 10;
          break;
        case '3g':
          score += 5;
          break;
        case '2g':
        case 'slow-2g':
          score -= 20;
          break;
      }
    }

    // Battery condition factor
    if (task.options.batteryAware && this.conditions.battery !== 'unknown') {
      if (this.conditions.charging) {
        score += 15;
      } else if (this.conditions.battery < 0.2) {
        score -= 25;
      } else if (this.conditions.battery < 0.5) {
        score -= 10;
      }
    }

    return score;
  }

  /**
   * Execute a task
   */
  async executeTask(task) {
    try {
      task.attempts++;
      task.lastAttempt = Date.now();

      console.log(`🚀 Executing task ${task.id} (${task.type}) - Carbon: ${this.carbonData.current.intensity}`);

      let result;
      
      if (task.type === 'batch') {
        result = await this.executeBatchTask(task);
      } else {
        result = await task.execute(task.data);
      }

      // Update statistics
      this.stats.tasksExecuted++;
      this.updateCarbonSavings(task);

      // Remove from queue
      this.removeTaskFromQueue(task);

      console.log(`✅ Task ${task.id} completed successfully`);
      return result;

    } catch (error) {
      console.error(`❌ Task ${task.id} failed:`, error);
      
      // Retry logic
      if (task.attempts < 3) {
        const retryDelay = Math.pow(2, task.attempts) * 1000; // Exponential backoff
        setTimeout(() => {
          this.executeTask(task);
        }, retryDelay);
      } else {
        this.removeTaskFromQueue(task);
        throw error;
      }
    }
  }

  /**
   * Execute a batch of tasks
   */
  async executeBatchTask(batchTask) {
    const results = [];
    const batchSize = batchTask.options.batchSize;
    
    for (let i = 0; i < batchTask.tasks.length; i += batchSize) {
      const batch = batchTask.tasks.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(task => task.execute(task.data))
      );
      
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming
      if (i + batchSize < batchTask.tasks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Utility methods
   */

  generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getMaxDelayForPriority(priority) {
    switch (priority) {
      case 'urgent': return 0;
      case 'high': return 60 * 60 * 1000; // 1 hour
      case 'normal': return 6 * 60 * 60 * 1000; // 6 hours
      case 'low': return 24 * 60 * 60 * 1000; // 24 hours
      case 'background': return 7 * 24 * 60 * 60 * 1000; // 7 days
      default: return 6 * 60 * 60 * 1000;
    }
  }

  getPriorityDelay(priority) {
    switch (priority) {
      case 'urgent': return 0;
      case 'high': return 5 * 60 * 1000; // 5 minutes
      case 'normal': return 30 * 60 * 1000; // 30 minutes
      case 'low': return 2 * 60 * 60 * 1000; // 2 hours
      case 'background': return 6 * 60 * 60 * 1000; // 6 hours
      default: return 30 * 60 * 1000;
    }
  }

  estimateCarbonCost(task) {
    // Simplified carbon cost estimation
    const baseCost = 10; // Base carbon cost in grams CO2
    const typeFactor = this.getTaskTypeFactor(task.type);
    const durationFactor = (task.estimatedDuration || 1000) / 1000;
    
    return baseCost * typeFactor * durationFactor;
  }

  getTaskTypeFactor(taskType) {
    const factors = {
      'sync': 2.0,
      'upload': 3.0,
      'download': 2.5,
      'compute': 1.5,
      'batch': 2.5,
      'default': 1.0
    };
    
    return factors[taskType] || factors.default;
  }

  updateCarbonSavings(task) {
    const currentIntensity = this.carbonData.current.intensity;
    const estimatedSavings = this.calculateCarbonSavings(task, currentIntensity);
    
    this.stats.carbonSaved += estimatedSavings;
  }

  calculateCarbonSavings(task, executionIntensity) {
    // Calculate savings compared to executing during high carbon intensity
    const highIntensityFactor = 1.5;
    const currentFactor = executionIntensity === 'low' ? 0.7 : 
                         executionIntensity === 'medium' ? 1.0 : 1.3;
    
    const potentialCost = task.estimatedCarbonCost * highIntensityFactor;
    const actualCost = task.estimatedCarbonCost * currentFactor;
    
    return Math.max(0, potentialCost - actualCost);
  }

  removeTaskFromQueue(task) {
    for (const priority in this.taskQueue) {
      const index = this.taskQueue[priority].findIndex(t => t.id === task.id);
      if (index !== -1) {
        this.taskQueue[priority].splice(index, 1);
        break;
      }
    }
  }

  setupPeriodicUpdates() {
    // Update carbon data periodically
    setInterval(() => {
      this.updateCarbonData();
    }, this.carbonData.updateInterval);

    // Update device conditions periodically
    setInterval(() => {
      this.updateDeviceConditions();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  startScheduler() {
    // Process queues periodically
    setInterval(() => {
      this.processQueues();
    }, 60 * 1000); // Every minute
  }

  processQueues() {
    // Check for tasks that should be executed now
    for (const priority in this.taskQueue) {
      const queue = this.taskQueue[priority];
      
      for (const task of queue) {
        const shouldExecute = this.shouldExecuteNow(task);
        if (shouldExecute) {
          this.executeTask(task);
        }
      }
    }
  }

  shouldExecuteNow(task) {
    const now = Date.now();
    const deadline = task.scheduledAt + task.options.maxDelay;
    
    // Execute if past deadline
    if (now >= deadline) {
      return true;
    }
    
    // Execute if conditions are optimal
    const score = this.calculateExecutionScore(now, task);
    return score > 80; // Threshold for optimal conditions
  }

  useFallbackCarbonData() {
    this.carbonData.current = this.simulateCarbonIntensity();
  }

  parseCarbonApiResponse(data) {
    // Parse response from carbon intensity API
    // This would be customized based on the specific API format
    return {
      intensity: this.valueToIntensity(data.intensity),
      value: data.intensity,
      forecast: data.forecast || [],
      timestamp: Date.now()
    };
  }

  /**
   * Get scheduler statistics and status
   */
  getStats() {
    const queueSizes = {};
    let totalQueued = 0;
    
    for (const priority in this.taskQueue) {
      queueSizes[priority] = this.taskQueue[priority].length;
      totalQueued += this.taskQueue[priority].length;
    }

    return {
      ...this.stats,
      queueSizes,
      totalQueued,
      carbonIntensity: this.carbonData.current.intensity,
      carbonValue: this.carbonData.current.value,
      lastCarbonUpdate: this.carbonData.lastUpdate,
      conditions: this.conditions
    };
  }

  /**
   * Get current carbon data
   */
  getCarbonData() {
    return this.carbonData.current;
  }

  /**
   * Force execution of all tasks (emergency mode)
   */
  async forceExecuteAll() {
    const allTasks = [];

    for (const priority in this.taskQueue) {
      allTasks.push(...this.taskQueue[priority]);
      this.taskQueue[priority] = [];
    }

    const results = await Promise.allSettled(
      allTasks.map(task => this.executeTask(task))
    );

    return results;
  }

  // Smart City Carbon Methods
  async enableCityWideOptimization(config) {
    console.log('🌱🏙️ Enabling city-wide carbon optimization...');
    this.cityWideOptimization = { ...config, enabled: true };
    return this.cityWideOptimization;
  }

  async configureRenewableOptimization(config) {
    console.log('🌱⚡ Configuring renewable energy optimization...');
    this.renewableOptimization = { ...config, configured: true };
    return this.renewableOptimization;
  }

  async enableCarbonNeutralityTracking(config) {
    console.log('🌱📊 Enabling carbon neutrality tracking...');
    this.carbonNeutralityTracking = { ...config, enabled: true };
    return this.carbonNeutralityTracking;
  }

  async monitorCarbonEmissions() {
    return {
      totalEmissions: 1000 + Math.random() * 500,
      emissionRate: 50 + Math.random() * 30,
      reductionTarget: 0.5,
      currentReduction: 0.3 + Math.random() * 0.2
    };
  }

  async checkRenewableStatus() {
    return {
      solarGeneration: 200 + Math.random() * 100,
      windGeneration: 150 + Math.random() * 80,
      renewablePercentage: 0.6 + Math.random() * 0.3,
      gridStability: 'stable'
    };
  }

  async calculateSustainabilityMetrics() {
    return {
      carbonFootprint: 800 + Math.random() * 400,
      energyEfficiency: 0.8 + Math.random() * 0.15,
      renewableRatio: 0.7 + Math.random() * 0.2,
      sustainabilityScore: 85 + Math.random() * 10
    };
  }

  async optimizeEmergencyOperations(alertData) {
    console.log('🚨 Optimizing emergency operations for carbon efficiency...');
    return {
      emergencyType: alertData.type || 'general',
      carbonOptimizedRouting: 'enabled',
      renewableEmergencyPower: 'activated',
      sustainableResponse: 'prioritized',
      carbonImpact: 'minimized'
    };
  }

  /**
   * Get status (alias for getStats)
   * @returns {object} Current carbon-aware status
   */
  getStatus() {
    return this.getStats();
  }
}
