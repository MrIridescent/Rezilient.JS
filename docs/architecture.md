# Aether.js Architecture Guide

Deep dive into the **Resilient-First** architecture that powers Aether.js applications.

## 🏗️ **Architectural Overview**

Aether.js implements a revolutionary **Local-First** architecture where the user's device is the primary source of truth, and the network serves as an enhancement rather than a requirement.

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ AetherComponent │  │ AetherComponent │  │     ...     │ │
│  │   (Offline-     │  │   (Reactive     │  │             │ │
│  │    Aware)       │  │   Lifecycle)    │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Management Layer                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   AetherStore   │  │ PersistentStore │  │ SyncEngine  │ │
│  │   (Reactive     │  │   (IndexedDB    │  │ (Conflict   │ │
│  │    State)       │  │  Persistence)   │  │ Resolution) │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Service Worker Kernel                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Cache Strategy  │  │ Background Sync │  │ Network     │ │
│  │   Management    │  │   Processing    │  │ Resilience  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Browser Platform                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   IndexedDB     │  │ Service Workers │  │ Background  │ │
│  │  (Local DB)     │  │  (Persistence)  │  │    Sync     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🧠 **Core Principles**

### **1. Local-First Data Flow**

Traditional web applications follow a **Server-First** model:
```
User Action → Network Request → Server Processing → Response → UI Update
```

Aether.js follows a **Local-First** model:
```
User Action → Local State Update → UI Update → Background Sync
```

**Benefits:**
- ⚡ **Instant responsiveness** - no network latency
- 🛡️ **Zero data loss** - changes saved locally first
- 🌐 **Network independence** - works offline seamlessly

### **2. Reactive State Management**

Aether.js uses a **subscription-based** reactive system:

```javascript
// State changes flow through the system
Store.set(newData) 
  → Notify Subscribers 
  → Update Components 
  → Trigger Sync (if needed)
```

**Key Features:**
- **Fine-grained reactivity** - only affected components re-render
- **Automatic persistence** - state changes saved to IndexedDB
- **Conflict-free updates** - intelligent merge strategies

### **3. Intelligent Synchronization**

The SyncEngine implements a sophisticated **mutation-based** sync system:

```javascript
// Offline mutations are queued
addMutation({ type: 'ADD_TODO', payload: todo })
  → Queue in IndexedDB
  → Process when online
  → Resolve conflicts
  → Update local state
```

## 📊 **Data Flow Architecture**

### **Read Operations (Query Flow)**

```mermaid
graph TD
    A[Component] --> B[Store.get()]
    B --> C{Data in Memory?}
    C -->|Yes| D[Return Immediately]
    C -->|No| E[Load from IndexedDB]
    E --> F[Update Memory Cache]
    F --> D
    D --> G[Render Component]
```

### **Write Operations (Command Flow)**

```mermaid
graph TD
    A[User Action] --> B[Store.set/update()]
    B --> C[Update Memory State]
    C --> D[Notify Subscribers]
    D --> E[Re-render Components]
    C --> F[Save to IndexedDB]
    C --> G[Queue Sync Mutation]
    G --> H{Online?}
    H -->|Yes| I[Process Immediately]
    H -->|No| J[Queue for Later]
    I --> K[Sync with Server]
    J --> L[Wait for Online Event]
    L --> K
```

## 🔄 **Synchronization Strategies**

### **Conflict Resolution**

Aether.js provides three built-in conflict resolution strategies:

#### **1. LastWriteWins (Default)**
```javascript
const syncEngine = new SyncEngine({
  conflictStrategy: 'LastWriteWins'
});

// Local changes always take precedence
// Simple and predictable for most use cases
```

#### **2. ServerWins**
```javascript
const syncEngine = new SyncEngine({
  conflictStrategy: 'ServerWins'
});

// Server state takes precedence
// Useful for authoritative data sources
```

#### **3. Custom Resolution**
```javascript
const syncEngine = new SyncEngine({
  conflictStrategy: (localMutation, serverState) => {
    // Custom logic based on your business rules
    if (localMutation.payload.priority > serverState.priority) {
      return localMutation; // Keep local change
    } else {
      return null; // Discard local change
    }
  }
});
```

### **Sync Queue Management**

The SyncEngine maintains a persistent queue of mutations:

```javascript
// Queue structure in IndexedDB
{
  "aether-mutation-queue": [
    {
      type: "ADD_TODO",
      payload: { id: 1, text: "Learn Aether.js" },
      timestamp: 1640995200000
    },
    {
      type: "UPDATE_USER",
      payload: { id: 123, name: "Alice" },
      timestamp: 1640995260000
    }
  ]
}
```

**Queue Processing:**
1. **Batch Processing** - Multiple mutations processed together
2. **Sequential Execution** - Mutations applied in order
3. **Error Handling** - Failed mutations remain in queue
4. **Automatic Retry** - Retry on network restoration

## 🛡️ **Service Worker Kernel**

The Service Worker acts as the **resilience kernel** of Aether.js applications:

### **Caching Strategies**

```javascript
// Application Shell - Cache First
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/static/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

// API Data - Stale While Revalidate
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open('api-cache').then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        });
      })
    );
  }
});
```

### **Background Sync**

```javascript
// Register background sync
self.addEventListener('sync', event => {
  if (event.tag === 'aether-sync') {
    event.waitUntil(
      // Process pending mutations
      processOfflineQueue()
    );
  }
});

// Trigger sync when online
self.addEventListener('online', () => {
  self.registration.sync.register('aether-sync');
});
```

## 🏗️ **Component Architecture**

### **AetherComponent Lifecycle**

```javascript
class MyComponent extends AetherComponent {
  constructor() {
    super(); // Registers offline/online listeners
    this.initializeStores();
    this.setupSubscriptions();
  }

  // Automatic lifecycle hooks
  onOffline() {
    // Handle offline state
    this.updateUI({ offline: true });
  }

  onOnline() {
    // Handle online state
    this.updateUI({ offline: false });
    this.triggerSync();
  }

  onSyncStateChange(state) {
    // Handle sync state changes
    this.updateSyncIndicator(state);
  }
}
```

### **Store Integration Patterns**

#### **Single Store Pattern**
```javascript
class SimpleComponent extends AetherComponent {
  constructor() {
    super();
    this.store = new PersistentStore('component-data', {});
    this.store.subscribe(data => this.render(data));
  }
}
```

#### **Multiple Store Pattern**
```javascript
class ComplexComponent extends AetherComponent {
  constructor() {
    super();
    this.userStore = new PersistentStore('user', {});
    this.settingsStore = new PersistentStore('settings', {});
    
    // Combine multiple stores
    this.combinedState = {};
    this.userStore.subscribe(user => {
      this.combinedState.user = user;
      this.render();
    });
    this.settingsStore.subscribe(settings => {
      this.combinedState.settings = settings;
      this.render();
    });
  }
}
```

#### **Computed Store Pattern**
```javascript
class DerivedComponent extends AetherComponent {
  constructor() {
    super();
    this.todosStore = new PersistentStore('todos', []);
    
    // Create computed values
    this.todosStore.subscribe(todos => {
      this.completedCount = todos.filter(t => t.completed).length;
      this.activeCount = todos.length - this.completedCount;
      this.render();
    });
  }
}
```

## 🔧 **Performance Optimizations**

### **Memory Management**

```javascript
class OptimizedComponent extends AetherComponent {
  constructor() {
    super();
    this.subscriptions = [];
  }

  addSubscription(store, callback) {
    const unsubscribe = store.subscribe(callback);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  destroy() {
    // Clean up all subscriptions
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
}
```

### **Selective Updates**

```javascript
// Only update when specific properties change
this.store.subscribe(state => {
  if (this.lastRenderedId !== state.id) {
    this.lastRenderedId = state.id;
    this.render();
  }
});
```

### **Batch Operations**

```javascript
// Batch multiple updates
this.store.update(state => ({
  ...state,
  property1: newValue1,
  property2: newValue2,
  property3: newValue3
}));
// Only triggers one re-render and one sync mutation
```

## 🌐 **Network Resilience**

### **Connection State Management**

```javascript
class NetworkAwareComponent extends AetherComponent {
  constructor() {
    super();
    this.connectionState = {
      isOnline: navigator.onLine,
      lastOnline: Date.now(),
      syncStatus: 'idle'
    };
  }

  onOffline() {
    this.connectionState.isOnline = false;
    this.connectionState.lastOffline = Date.now();
    this.showOfflineIndicator();
  }

  onOnline() {
    this.connectionState.isOnline = true;
    this.connectionState.lastOnline = Date.now();
    this.hideOfflineIndicator();
    this.syncPendingChanges();
  }
}
```

### **Progressive Enhancement**

```javascript
// Feature detection and graceful degradation
if ('serviceWorker' in navigator) {
  // Full offline capability
  this.enableOfflineMode();
} else {
  // Fallback to basic caching
  this.enableBasicCaching();
}

if ('indexedDB' in window) {
  // Use PersistentStore
  this.store = new PersistentStore('data', {});
} else {
  // Fallback to memory-only store
  this.store = new AetherStore({});
}
```

## 📈 **Scalability Considerations**

### **Large Dataset Handling**

```javascript
// Pagination and virtual scrolling
class LargeListComponent extends AetherComponent {
  constructor() {
    super();
    this.pageSize = 50;
    this.currentPage = 0;
    this.store = new PersistentStore('large-dataset', []);
  }

  loadPage(page) {
    const start = page * this.pageSize;
    const end = start + this.pageSize;
    const pageData = this.store.get().slice(start, end);
    this.renderPage(pageData);
  }
}
```

### **Memory-Efficient Updates**

```javascript
// Use update() for large objects to avoid full replacement
this.store.update(largeObject => {
  // Only modify what changed
  largeObject.specificProperty = newValue;
  return largeObject;
});
```

---

**Next:** [Examples & Tutorials](./examples.md) | [Deployment Guide](./deployment.md)
