// Production Demo - Resilient.js
// This demo showcases ONLY production-ready features

import {
  AetherStore,
  PersistentStore,
  SyncEngine,
  CarbonAwareScheduler,
  CacheManager,
  SYNC_STATUS
} from '../../dist/aether.esm.js';

class ProductionDemo {
  constructor() {
    this.initializeFramework();
    this.setupUI();
    this.startMonitoring();
  }

  async initializeFramework() {
    // Initialize core store
    this.store = new AetherStore({
      todos: [],
      metrics: {
        storeOps: 0,
        cacheHits: 0,
        syncCount: 0,
        errors: 0
      }
    });

    // Add persistence
    this.persistentStore = new PersistentStore(this.store, 'resilient-demo');
    await this.persistentStore.initialize();

    // Initialize sync engine
    this.syncEngine = new SyncEngine({
      endpoint: 'https://jsonplaceholder.typicode.com/posts', // Demo endpoint
      store: this.persistentStore,
      retryAttempts: 3,
      retryDelay: 1000
    });

    // Initialize carbon-aware scheduler
    this.carbonScheduler = new CarbonAwareScheduler({
      region: 'US-EAST-1',
      checkInterval: 30000 // 30 seconds
    });

    // Initialize cache manager
    this.cacheManager = new CacheManager({
      maxSize: 50,
      ttl: 300000 // 5 minutes
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Store change listeners
    this.store.subscribe('todos', (todos) => {
      this.updateTodoList(todos);
      this.incrementMetric('storeOps');
    });

    // Sync engine events
    this.syncEngine.on('sync:start', () => {
      this.updateSyncStatus('Syncing...', 'syncing');
    });

    this.syncEngine.on('sync:success', () => {
      this.updateSyncStatus('Synced', 'success');
      this.incrementMetric('syncCount');
      this.updateLastSync();
    });

    this.syncEngine.on('sync:error', (error) => {
      this.updateSyncStatus('Error', 'error');
      this.incrementMetric('errors');
      console.error('Sync error:', error);
    });

    // Network status
    window.addEventListener('online', () => {
      this.updateNetworkStatus(true);
      this.syncEngine.processQueue();
    });

    window.addEventListener('offline', () => {
      this.updateNetworkStatus(false);
    });

    // Carbon scheduler events
    this.carbonScheduler.on('intensity:update', (data) => {
      this.updateCarbonInfo(data);
    });
  }

  setupUI() {
    // Initialize network status
    this.updateNetworkStatus(navigator.onLine);

    // Load existing todos
    const todos = this.store.getState('todos');
    this.updateTodoList(todos);

    // Start carbon monitoring
    this.carbonScheduler.start();

    // Set up keyboard listener for todo input
    const todoInput = document.getElementById('todo-input');
    todoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addTodo();
      }
    });
  }

  addTodo() {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    
    if (!text) return;

    const todo = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
      synced: false
    };

    // Add to store (automatically persisted)
    const currentTodos = this.store.getState('todos');
    this.store.setState('todos', [...currentTodos, todo]);

    // Queue for sync
    this.syncEngine.queueMutation({
      type: 'ADD_TODO',
      payload: todo,
      timestamp: Date.now()
    });

    // Clear input
    input.value = '';

    // Update queue display
    this.updateSyncQueue();
  }

  updateTodoList(todos) {
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';

    todos.forEach(todo => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      li.innerHTML = `
        <span>${todo.text}</span>
        <span style="font-size: 0.8rem; opacity: 0.7;">
          ${todo.synced ? '✅ Synced' : '⏳ Pending'}
        </span>
      `;
      todoList.appendChild(li);
    });
  }

  updateNetworkStatus(isOnline) {
    const statusEl = document.getElementById('network-status');
    const textEl = document.getElementById('network-text');
    
    if (isOnline) {
      statusEl.className = 'status-item online';
      textEl.textContent = 'Online';
    } else {
      statusEl.className = 'status-item offline';
      textEl.textContent = 'Offline';
    }
  }

  updateSyncStatus(text, type) {
    const textEl = document.getElementById('sync-text');
    textEl.textContent = text;
    
    const statusEl = document.getElementById('sync-status');
    statusEl.className = `status-item ${type}`;
  }

  updateSyncQueue() {
    const queueSize = this.syncEngine.getQueueSize();
    document.getElementById('queue-size').textContent = queueSize;

    const queueEl = document.getElementById('sync-queue');
    const queue = this.syncEngine.getQueue();
    
    queueEl.innerHTML = '';
    queue.slice(-5).forEach(item => {
      const div = document.createElement('div');
      div.className = 'queue-item';
      div.textContent = `${item.type}: ${JSON.stringify(item.payload).substring(0, 50)}...`;
      queueEl.appendChild(div);
    });
  }

  updateLastSync() {
    const now = new Date().toLocaleTimeString();
    document.getElementById('last-sync').textContent = now;
  }

  updateCarbonInfo(data) {
    document.getElementById('carbon-intensity').textContent = `${data.intensity} gCO2/kWh`;
    document.getElementById('next-low').textContent = data.nextLowPeriod || 'Unknown';
    
    const deferredTasks = this.carbonScheduler.getDeferredTaskCount();
    document.getElementById('deferred-tasks').textContent = deferredTasks;
  }

  scheduleTask() {
    const task = {
      id: `task-${Date.now()}`,
      name: 'Heavy Computation',
      priority: 'low',
      estimatedDuration: 5000 // 5 seconds
    };

    this.carbonScheduler.scheduleTask(task, () => {
      console.log('Executing carbon-optimized task:', task.name);
      // Simulate heavy computation
      return new Promise(resolve => {
        setTimeout(() => {
          console.log('Task completed:', task.name);
          resolve();
        }, 1000);
      });
    });

    this.updateCarbonInfo(this.carbonScheduler.getCurrentData());
  }

  incrementMetric(metric) {
    const metrics = this.store.getState('metrics');
    metrics[metric]++;
    this.store.setState('metrics', metrics);
    
    // Update UI
    document.getElementById('store-ops').textContent = metrics.storeOps;
    document.getElementById('cache-hits').textContent = metrics.cacheHits;
    document.getElementById('sync-errors').textContent = metrics.errors;
  }

  startMonitoring() {
    // Update memory usage periodically
    setInterval(() => {
      if (performance.memory) {
        const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        document.getElementById('memory-usage').textContent = `${used} MB`;
      }
    }, 2000);

    // Update sync queue display
    setInterval(() => {
      this.updateSyncQueue();
    }, 1000);
  }
}

// Global functions for demo buttons
window.addTodo = () => demo.addTodo();
window.scheduleTask = () => demo.scheduleTask();

// Initialize demo when page loads
const demo = new ProductionDemo();

// Show framework info in console
console.log('🚀 Resilient.js Production Demo');
console.log('Framework loaded successfully!');
console.log('Try going offline and adding todos - they will sync when you come back online.');
