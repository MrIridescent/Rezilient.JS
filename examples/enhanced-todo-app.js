// examples/enhanced-todo-app.js

/**
 * Enhanced Todo Application demonstrating all new Aether.js features:
 * - Enhanced sync state management
 * - Real-time progress tracking
 * - Intelligent error handling and retry
 * - Hook-based API integration
 * - Advanced component lifecycle
 */

import {
  AetherComponent,
  PersistentStore,
  SyncEngine,
  SYNC_STATUS,
  SYNC_EVENTS,
  useAetherStore,
  useSyncEngine,
  useNetworkState
} from 'aether-framework';

/**
 * Enhanced Todo Application with full sync state management
 */
class EnhancedTodoApp extends AetherComponent {
  constructor() {
    super({
      autoSync: true,
      syncOnOnline: true,
      trackSyncState: true
    });

    // Initialize stores
    this.todoStore = new PersistentStore('enhanced-todos', []);
    this.settingsStore = new PersistentStore('todo-settings', {
      theme: 'light',
      autoSync: true,
      notifications: true
    });

    // Initialize enhanced sync engine
    this.syncEngine = new SyncEngine({
      conflictStrategy: 'LastWriteWins',
      retryAttempts: 3,
      retryDelay: 1000,
      enableProgressTracking: true
    });

    // Connect sync engine to component
    this.connectSyncEngine(this.syncEngine);

    // Setup store integrations
    this.setupStoreIntegrations();
    
    // Setup UI state
    this.uiState = {
      newTodoText: '',
      filter: 'all', // all, active, completed
      showSyncDetails: false
    };

    // Subscribe to store changes
    this.todoStore.subscribe(todos => this.render());
    this.settingsStore.subscribe(settings => this.render());
  }

  /**
   * Setup integration between stores and sync engine
   */
  setupStoreIntegrations() {
    // Sync todos when they change
    this.todoStore.subscribe(async (todos) => {
      if (todos.length > 0) {
        const lastTodo = todos[todos.length - 1];
        if (lastTodo && !lastTodo.synced) {
          await this.syncEngine.addMutation({
            type: 'SYNC_TODOS',
            payload: todos,
            entityType: 'todos'
          });
        }
      }
    });

    // Sync settings when they change
    this.settingsStore.subscribe(async (settings) => {
      await this.syncEngine.addMutation({
        type: 'SYNC_SETTINGS',
        payload: settings,
        entityType: 'settings'
      });
    });
  }

  /**
   * Enhanced lifecycle hooks with detailed logging
   */
  onOffline() {
    console.log('📱 Enhanced Todo App: Now working offline');
    this.showNotification('Working offline - changes will sync when reconnected', 'info');
    this.render();
  }

  onOnline() {
    console.log('🌐 Enhanced Todo App: Back online, syncing data');
    this.showNotification('Back online - syncing your changes', 'success');
    this.render();
  }

  onSyncStateChange(state) {
    console.log('🔄 Sync state changed:', state);
    this.render();
  }

  onSyncStatusChange(status, fullState) {
    const statusMessages = {
      [SYNC_STATUS.IDLE]: 'Ready to sync',
      [SYNC_STATUS.SYNCING]: 'Syncing your changes...',
      [SYNC_STATUS.SYNCED]: 'All changes synced',
      [SYNC_STATUS.ERROR]: 'Sync error occurred',
      [SYNC_STATUS.OFFLINE]: 'Working offline'
    };

    console.log(`📊 Sync status: ${statusMessages[status]}`);
    
    if (status === SYNC_STATUS.SYNCED && fullState.pending === 0) {
      this.showNotification('All changes synced successfully', 'success');
    }
  }

  onSyncProgress(progress) {
    console.log(`📈 Sync progress: ${progress.current}/${progress.total} (${progress.percentage}%)`);
    this.render();
  }

  onSyncError(error) {
    console.error('❌ Sync error:', error);
    this.showNotification(`Sync error: ${error.error.message}`, 'error');
    this.render();
  }

  onMutationSynced(result) {
    console.log('✅ Mutation synced:', result.mutation.type);
    
    // Mark todos as synced if this was a todo sync
    if (result.mutation.type === 'SYNC_TODOS') {
      this.todoStore.update(todos => 
        todos.map(todo => ({ ...todo, synced: true }))
      );
    }
  }

  /**
   * Todo management methods
   */
  addTodo(text) {
    if (!text.trim()) return;

    const newTodo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      synced: false
    };

    this.todoStore.update(todos => [...todos, newTodo]);
    this.uiState.newTodoText = '';
    this.render();
  }

  toggleTodo(id) {
    this.todoStore.update(todos =>
      todos.map(todo =>
        todo.id === id 
          ? { ...todo, completed: !todo.completed, synced: false }
          : todo
      )
    );
  }

  deleteTodo(id) {
    this.todoStore.update(todos => todos.filter(todo => todo.id !== id));
  }

  clearCompleted() {
    this.todoStore.update(todos => todos.filter(todo => !todo.completed));
  }

  setFilter(filter) {
    this.uiState.filter = filter;
    this.render();
  }

  toggleSyncDetails() {
    this.uiState.showSyncDetails = !this.uiState.showSyncDetails;
    this.render();
  }

  /**
   * Settings management
   */
  updateSetting(key, value) {
    this.settingsStore.update(settings => ({
      ...settings,
      [key]: value
    }));
  }

  /**
   * Manual sync operations
   */
  async forceSyncAll() {
    try {
      await this.triggerSync();
      this.showNotification('Manual sync completed', 'success');
    } catch (error) {
      this.showNotification(`Manual sync failed: ${error.message}`, 'error');
    }
  }

  async clearSyncQueue() {
    try {
      await this.syncEngine.clearQueue();
      this.showNotification('Sync queue cleared', 'info');
    } catch (error) {
      this.showNotification(`Failed to clear queue: ${error.message}`, 'error');
    }
  }

  /**
   * Get filtered todos based on current filter
   */
  getFilteredTodos() {
    const todos = this.todoStore.get();
    
    switch (this.uiState.filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    // In a real app, this would show a toast notification
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    
    // Simple DOM notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      background: ${type === 'error' ? '#e53e3e' : type === 'success' ? '#38a169' : '#3182ce'};
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Enhanced render method with sync state visualization
   */
  render() {
    const todos = this.getFilteredTodos();
    const allTodos = this.todoStore.get();
    const settings = this.settingsStore.get();
    const syncState = this.getSyncState();
    const networkState = this.getNetworkState();

    const activeCount = allTodos.filter(todo => !todo.completed).length;
    const completedCount = allTodos.length - activeCount;
    const unsyncedCount = allTodos.filter(todo => !todo.synced).length;

    const container = document.getElementById('app');
    if (!container) return;

    container.innerHTML = `
      <div class="enhanced-todo-app" data-theme="${settings.theme}">
        <!-- Header with enhanced status -->
        <header class="app-header">
          <h1>Enhanced Aether.js Todos</h1>
          <div class="status-bar">
            <div class="network-status ${networkState.isOnline ? 'online' : 'offline'}">
              ${networkState.isOnline ? '🌐 Online' : '📱 Offline'}
              ${networkState.connectionType !== 'unknown' ? ` (${networkState.connectionType})` : ''}
            </div>
            <div class="sync-status ${syncState ? syncState.status : 'unknown'}">
              ${this.getSyncStatusDisplay(syncState)}
            </div>
          </div>
        </header>

        <!-- Enhanced sync details panel -->
        <div class="sync-panel">
          <button onclick="todoApp.toggleSyncDetails()" class="sync-toggle">
            ${this.uiState.showSyncDetails ? '▼' : '▶'} Sync Details
          </button>
          
          ${this.uiState.showSyncDetails ? `
            <div class="sync-details">
              <div class="sync-stats">
                <div>Status: <strong>${syncState ? syncState.status : 'Unknown'}</strong></div>
                <div>Pending: <strong>${syncState ? syncState.pending : 0}</strong></div>
                <div>Unsynced Todos: <strong>${unsyncedCount}</strong></div>
                ${syncState && syncState.progress.total > 0 ? `
                  <div>Progress: <strong>${syncState.progress.current}/${syncState.progress.total} (${syncState.progress.percentage}%)</strong></div>
                ` : ''}
                ${syncState && syncState.error ? `
                  <div class="error">Error: <strong>${syncState.error.message}</strong></div>
                ` : ''}
              </div>
              
              <div class="sync-actions">
                <button onclick="todoApp.forceSyncAll()" ${!networkState.isOnline || this.isSyncing ? 'disabled' : ''}>
                  Force Sync
                </button>
                <button onclick="todoApp.clearSyncQueue()" ${this.isSyncing ? 'disabled' : ''}>
                  Clear Queue
                </button>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Todo input -->
        <form class="todo-form" onsubmit="event.preventDefault(); todoApp.addTodo(document.getElementById('newTodo').value);">
          <input
            type="text"
            id="newTodo"
            placeholder="What needs to be done?"
            value="${this.uiState.newTodoText}"
            oninput="todoApp.uiState.newTodoText = this.value"
            class="new-todo"
          />
          <button type="submit">Add Todo</button>
        </form>

        <!-- Filter tabs -->
        <div class="filter-tabs">
          <button 
            class="filter-tab ${this.uiState.filter === 'all' ? 'active' : ''}"
            onclick="todoApp.setFilter('all')"
          >
            All (${allTodos.length})
          </button>
          <button 
            class="filter-tab ${this.uiState.filter === 'active' ? 'active' : ''}"
            onclick="todoApp.setFilter('active')"
          >
            Active (${activeCount})
          </button>
          <button 
            class="filter-tab ${this.uiState.filter === 'completed' ? 'active' : ''}"
            onclick="todoApp.setFilter('completed')"
          >
            Completed (${completedCount})
          </button>
        </div>

        <!-- Todo list -->
        <div class="todo-list">
          ${todos.length === 0 ? 
            `<div class="empty-state">No ${this.uiState.filter === 'all' ? '' : this.uiState.filter} todos</div>` :
            todos.map(todo => `
              <div class="todo-item ${todo.completed ? 'completed' : ''} ${!todo.synced ? 'unsynced' : ''}">
                <input
                  type="checkbox"
                  ${todo.completed ? 'checked' : ''}
                  onchange="todoApp.toggleTodo(${todo.id})"
                />
                <span class="todo-text">${todo.text}</span>
                <div class="todo-meta">
                  ${!todo.synced ? '<span class="sync-indicator">●</span>' : ''}
                  <span class="todo-date">${new Date(todo.createdAt).toLocaleDateString()}</span>
                </div>
                <button onclick="todoApp.deleteTodo(${todo.id})" class="delete-btn">
                  ❌
                </button>
              </div>
            `).join('')
          }
        </div>

        <!-- Footer with actions -->
        <footer class="app-footer">
          ${completedCount > 0 ? `
            <button onclick="todoApp.clearCompleted()" class="clear-completed">
              Clear completed (${completedCount})
            </button>
          ` : ''}
          
          <div class="settings">
            <label>
              <input
                type="checkbox"
                ${settings.autoSync ? 'checked' : ''}
                onchange="todoApp.updateSetting('autoSync', this.checked)"
              />
              Auto-sync
            </label>
            <label>
              <input
                type="checkbox"
                ${settings.notifications ? 'checked' : ''}
                onchange="todoApp.updateSetting('notifications', this.checked)"
              />
              Notifications
            </label>
          </div>
        </footer>
      </div>
    `;
  }

  /**
   * Get display text for sync status
   */
  getSyncStatusDisplay(syncState) {
    if (!syncState) return 'Unknown';

    const statusIcons = {
      [SYNC_STATUS.IDLE]: '⏸️',
      [SYNC_STATUS.SYNCING]: '🔄',
      [SYNC_STATUS.SYNCED]: '✅',
      [SYNC_STATUS.ERROR]: '❌',
      [SYNC_STATUS.OFFLINE]: '📱'
    };

    const icon = statusIcons[syncState.status] || '❓';
    const text = syncState.status.charAt(0).toUpperCase() + syncState.status.slice(1);
    
    if (syncState.status === SYNC_STATUS.SYNCING && syncState.progress.total > 0) {
      return `${icon} ${text} (${syncState.progress.percentage}%)`;
    }
    
    return `${icon} ${text}`;
  }
}

// Initialize the enhanced todo app
const todoApp = new EnhancedTodoApp();
window.todoApp = todoApp;

// Initial render
todoApp.render();

// Add some sample data for demonstration
setTimeout(() => {
  if (todoApp.todoStore.get().length === 0) {
    todoApp.addTodo('Learn Aether.js enhanced features');
    todoApp.addTodo('Build a resilient application');
    todoApp.addTodo('Deploy to production');
  }
}, 100);

console.log('🚀 Enhanced Todo App initialized with full sync state management!');
console.log('📊 Available methods:', Object.getOwnPropertyNames(todoApp).filter(name => typeof todoApp[name] === 'function'));
