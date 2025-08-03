# Getting Started with Aether.js

Welcome to the **Resilient-First** development paradigm! This guide will help you build your first Aether.js application in minutes.

## 🎯 **What You'll Build**

By the end of this guide, you'll have created a fully functional, offline-capable todo application that demonstrates all core Aether.js concepts:

- ✅ **Reactive state management** with AetherStore
- ✅ **Automatic persistence** with PersistentStore  
- ✅ **Offline-aware components** with AetherComponent
- ✅ **Intelligent synchronization** with SyncEngine
- ✅ **Service Worker caching** for instant loading

## 📋 **Prerequisites**

- Node.js 16+ installed
- Basic knowledge of JavaScript/ES6
- Understanding of web development concepts

## 🚀 **Installation**

### **Option 1: Quick Start (Recommended)**

```bash
# Create a new Aether.js project
npx create-aether-app my-todo-app
cd my-todo-app
npm run dev
```

### **Option 2: Manual Installation**

```bash
# Create a new project
mkdir my-todo-app
cd my-todo-app
npm init -y

# Install Aether.js framework
npm install aether-framework

# Install development dependencies
npm install --save-dev vite @vitejs/plugin-legacy
```

## 🏗️ **Project Structure**

After installation, your project structure will look like this:

```
my-todo-app/
├── src/
│   ├── components/
│   │   └── TodoApp.js
│   ├── stores/
│   │   └── todoStore.js
│   ├── main.js
│   └── index.html
├── public/
│   ├── manifest.json
│   └── sw.js
├── package.json
└── vite.config.js
```

## 📝 **Building Your First Component**

### **Step 1: Create the Todo Store**

Create `src/stores/todoStore.js`:

```javascript
import { PersistentStore } from 'aether-framework';

// Create a persistent store that automatically saves to IndexedDB
export const todoStore = new PersistentStore('todos', []);

// Helper functions for todo operations
export const todoActions = {
  addTodo: (text) => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    todoStore.update(todos => [...todos, newTodo]);
  },

  toggleTodo: (id) => {
    todoStore.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  },

  deleteTodo: (id) => {
    todoStore.update(todos => todos.filter(todo => todo.id !== id));
  },

  clearCompleted: () => {
    todoStore.update(todos => todos.filter(todo => !todo.completed));
  }
};
```

### **Step 2: Create the Todo Component**

Create `src/components/TodoApp.js`:

```javascript
import { AetherComponent } from 'aether-framework';
import { todoStore, todoActions } from '../stores/todoStore.js';

export class TodoApp extends AetherComponent {
  constructor() {
    super();
    
    // Initialize component state
    this.todos = [];
    this.newTodoText = '';
    this.isOffline = !navigator.onLine;
    this.syncStatus = 'idle';
    
    // Subscribe to store changes
    this.unsubscribe = todoStore.subscribe(todos => {
      this.todos = todos;
      this.render();
    });
    
    // Setup sync engine for server synchronization
    this.setupSync();
  }

  // Lifecycle hook: Called when going offline
  onOffline() {
    this.isOffline = true;
    this.syncStatus = 'offline';
    this.render();
    console.log('📱 App is now offline - continuing to work locally');
  }

  // Lifecycle hook: Called when coming online
  onOnline() {
    this.isOffline = false;
    this.syncStatus = 'syncing';
    this.render();
    console.log('🌐 App is back online - syncing data');
    
    // Trigger sync when coming back online
    this.syncEngine.processQueue();
  }

  // Lifecycle hook: Called when sync state changes
  onSyncStateChange(state) {
    this.syncStatus = state.status;
    this.render();
  }

  setupSync() {
    // Import and setup sync engine
    import('aether-framework').then(({ SyncEngine }) => {
      this.syncEngine = new SyncEngine({
        conflictStrategy: 'LastWriteWins'
      });

      // Listen for todo changes and queue sync mutations
      todoStore.subscribe(async (todos) => {
        if (todos.length > 0) {
          const lastTodo = todos[todos.length - 1];
          if (lastTodo && !lastTodo.synced) {
            await this.syncEngine.addMutation({
              type: 'SYNC_TODOS',
              payload: todos
            });
          }
        }
      });
    });
  }

  // Event handlers
  handleAddTodo(e) {
    e.preventDefault();
    if (this.newTodoText.trim()) {
      todoActions.addTodo(this.newTodoText.trim());
      this.newTodoText = '';
      this.render();
    }
  }

  handleInputChange(e) {
    this.newTodoText = e.target.value;
  }

  // Render method
  render() {
    const container = document.getElementById('app');
    if (!container) return;

    const completedCount = this.todos.filter(todo => todo.completed).length;
    const activeCount = this.todos.length - completedCount;

    container.innerHTML = `
      <div class="todo-app">
        <header class="header">
          <h1>Aether.js Todos</h1>
          <div class="status-bar">
            <span class="connection-status ${this.isOffline ? 'offline' : 'online'}">
              ${this.isOffline ? '📱 Offline' : '🌐 Online'}
            </span>
            <span class="sync-status">
              Sync: ${this.syncStatus}
            </span>
          </div>
        </header>

        <form class="todo-form" id="todoForm">
          <input
            type="text"
            id="newTodo"
            placeholder="What needs to be done?"
            value="${this.newTodoText}"
            class="new-todo"
          />
          <button type="submit">Add Todo</button>
        </form>

        <div class="todo-list">
          ${this.todos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}">
              <input
                type="checkbox"
                ${todo.completed ? 'checked' : ''}
                onchange="todoApp.toggleTodo(${todo.id})"
              />
              <span class="todo-text">${todo.text}</span>
              <button onclick="todoApp.deleteTodo(${todo.id})" class="delete-btn">
                ❌
              </button>
            </div>
          `).join('')}
        </div>

        <footer class="footer">
          <span class="todo-count">
            ${activeCount} ${activeCount === 1 ? 'item' : 'items'} left
          </span>
          ${completedCount > 0 ? `
            <button onclick="todoApp.clearCompleted()" class="clear-completed">
              Clear completed (${completedCount})
            </button>
          ` : ''}
        </footer>
      </div>
    `;

    // Attach event listeners
    const form = document.getElementById('todoForm');
    const input = document.getElementById('newTodo');
    
    if (form) {
      form.onsubmit = (e) => this.handleAddTodo(e);
    }
    
    if (input) {
      input.oninput = (e) => this.handleInputChange(e);
    }
  }

  // Public methods for global access
  toggleTodo(id) {
    todoActions.toggleTodo(id);
  }

  deleteTodo(id) {
    todoActions.deleteTodo(id);
  }

  clearCompleted() {
    todoActions.clearCompleted();
  }

  // Cleanup
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```

### **Step 3: Create the Main Application**

Create `src/main.js`:

```javascript
import { TodoApp } from './components/TodoApp.js';
import './style.css';

// Initialize the application
const todoApp = new TodoApp();

// Make it globally accessible for event handlers
window.todoApp = todoApp;

// Initial render
todoApp.render();

// Register service worker for offline capability
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('✅ Service Worker registered:', registration);
    })
    .catch(error => {
      console.log('❌ Service Worker registration failed:', error);
    });
}
```

### **Step 4: Add Styling**

Create `src/style.css`:

```css
/* Aether.js Todo App Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.todo-app {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  overflow: hidden;
}

.header {
  background: #4a5568;
  color: white;
  padding: 20px;
  text-align: center;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 10px;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  opacity: 0.9;
}

.connection-status.offline {
  color: #fed7d7;
}

.connection-status.online {
  color: #c6f6d5;
}

.todo-form {
  padding: 20px;
  display: flex;
  gap: 10px;
}

.new-todo {
  flex: 1;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
}

.new-todo:focus {
  outline: none;
  border-color: #667eea;
}

button {
  padding: 12px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  background: #5a67d8;
}

.todo-list {
  max-height: 400px;
  overflow-y: auto;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e2e8f0;
  gap: 12px;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  opacity: 0.6;
}

.todo-text {
  flex: 1;
  font-size: 1rem;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px;
}

.footer {
  padding: 15px 20px;
  background: #f7fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #4a5568;
}

.clear-completed {
  background: #e53e3e;
  font-size: 0.8rem;
  padding: 6px 12px;
}

.clear-completed:hover {
  background: #c53030;
}
```

## 🎉 **Running Your Application**

```bash
# Start the development server
npm run dev

# Open your browser to http://localhost:3000
```

## 🧪 **Testing Offline Functionality**

1. **Open Developer Tools** (F12)
2. **Go to Network tab**
3. **Check "Offline" checkbox**
4. **Try adding/editing todos** - they still work!
5. **Uncheck "Offline"** - data syncs automatically

## 🎯 **What You've Accomplished**

Congratulations! You've built a fully functional, offline-capable application with:

- ✅ **Instant responsiveness** - no network delays
- ✅ **Automatic persistence** - data never lost
- ✅ **Offline capability** - works without internet
- ✅ **Intelligent sync** - automatic conflict resolution
- ✅ **Real-time updates** - reactive state management

## 🚀 **Next Steps**

- [**API Reference**](./api-reference.md) - Explore all Aether.js features
- [**Architecture Guide**](./architecture.md) - Understand the framework deeply
- [**Examples**](./examples.md) - See more complex applications
- [**Deployment Guide**](./deployment.md) - Ship your app to production

---

**Welcome to the Resilient-First paradigm!** 🌟
