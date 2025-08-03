# Aether.js API Reference

Complete reference for all Aether.js classes, methods, and utilities.

## 📚 **Table of Contents**

- [AetherStore](#aetherstore) - Reactive state management
- [PersistentStore](#persistentstore) - Automatic persistence
- [AetherComponent](#aethercomponent) - Offline-aware components
- [SyncEngine](#syncengine) - Intelligent synchronization
- [Utilities](#utilities) - Helper functions and constants

---

## 🗄️ **AetherStore**

Lightweight, reactive state container for managing application state.

### **Constructor**

```javascript
new AetherStore(initialState)
```

**Parameters:**
- `initialState` (any): Initial state value

**Example:**
```javascript
import { AetherStore } from 'aether-framework';

const counterStore = new AetherStore(0);
const userStore = new AetherStore({ name: '', email: '' });
const todosStore = new AetherStore([]);
```

### **Methods**

#### **get()**

Returns the current state value.

```javascript
get(): any
```

**Example:**
```javascript
const currentValue = store.get();
console.log('Current state:', currentValue);
```

#### **set(newState)**

Updates the state and notifies all subscribers.

```javascript
set(newState: any): void
```

**Parameters:**
- `newState` (any): New state value

**Example:**
```javascript
store.set(42);
store.set({ name: 'Alice', email: 'alice@example.com' });
```

#### **update(updaterFunction)**

Updates state using an updater function.

```javascript
update(updater: (currentState) => newState): void
```

**Parameters:**
- `updater` (function): Function that receives current state and returns new state

**Example:**
```javascript
// Increment counter
counterStore.update(count => count + 1);

// Add item to array
todosStore.update(todos => [...todos, newTodo]);

// Update object property
userStore.update(user => ({ ...user, name: 'Bob' }));
```

#### **subscribe(callback)**

Subscribes to state changes. Returns unsubscribe function.

```javascript
subscribe(callback: (state) => void): () => void
```

**Parameters:**
- `callback` (function): Function called when state changes

**Returns:**
- `unsubscribe` (function): Call to stop receiving updates

**Example:**
```javascript
const unsubscribe = store.subscribe(state => {
  console.log('State changed:', state);
});

// Later, stop listening
unsubscribe();
```

---

## 💾 **PersistentStore**

Extends AetherStore with automatic IndexedDB persistence.

### **Constructor**

```javascript
new PersistentStore(key, initialState)
```

**Parameters:**
- `key` (string): Unique key for IndexedDB storage
- `initialState` (any): Initial state value (used if no saved data exists)

**Example:**
```javascript
import { PersistentStore } from 'aether-framework';

const settingsStore = new PersistentStore('app-settings', {
  theme: 'light',
  language: 'en'
});
```

### **Properties**

#### **key**

The storage key used for IndexedDB persistence.

```javascript
key: string (readonly)
```

### **Methods**

Inherits all methods from [AetherStore](#aetherstore) with automatic persistence:

- `get()` - Returns current state
- `set(newState)` - Updates state and saves to IndexedDB
- `update(updater)` - Updates state and saves to IndexedDB
- `subscribe(callback)` - Subscribe to changes

**Persistence Behavior:**
- Data is automatically loaded from IndexedDB on initialization
- All `set()` and `update()` calls automatically save to IndexedDB
- Persistence is asynchronous and non-blocking

**Example:**
```javascript
const userStore = new PersistentStore('user-profile', {
  name: '',
  preferences: {}
});

// This will be automatically saved to IndexedDB
userStore.set({
  name: 'Alice',
  preferences: { theme: 'dark', notifications: true }
});

// On page reload, the data will be automatically restored
```

---

## 🧩 **AetherComponent**

Base class for creating offline-aware UI components.

### **Constructor**

```javascript
new AetherComponent()
```

**Example:**
```javascript
import { AetherComponent } from 'aether-framework';

class MyComponent extends AetherComponent {
  constructor() {
    super();
    // Your initialization code
  }
}
```

### **Lifecycle Hooks**

Override these methods to handle connectivity and sync events:

#### **onOffline()**

Called when the application goes offline.

```javascript
onOffline(): void
```

**Example:**
```javascript
class MyComponent extends AetherComponent {
  onOffline() {
    this.showOfflineIndicator();
    this.enableOfflineMode();
  }
}
```

#### **onOnline()**

Called when the application comes back online.

```javascript
onOnline(): void
```

**Example:**
```javascript
class MyComponent extends AetherComponent {
  onOnline() {
    this.hideOfflineIndicator();
    this.syncPendingChanges();
  }
}
```

#### **onSyncStateChange(state)**

Called when synchronization state changes.

```javascript
onSyncStateChange(state: SyncState): void
```

**Parameters:**
- `state` (object): Sync state information
  - `status` (string): Current sync status ('idle', 'syncing', 'error', 'synced')
  - `pending` (number): Number of pending mutations
  - `error` (Error|null): Last sync error, if any

**Example:**
```javascript
class MyComponent extends AetherComponent {
  onSyncStateChange(state) {
    if (state.status === 'syncing') {
      this.showSyncSpinner();
    } else if (state.status === 'error') {
      this.showSyncError(state.error);
    } else if (state.status === 'synced') {
      this.showSyncSuccess();
    }
  }
}
```

### **Event Handling**

AetherComponent automatically registers for online/offline events. The lifecycle hooks are called automatically when these events occur.

---

## 🔄 **SyncEngine**

Manages offline mutations and intelligent synchronization with conflict resolution.

### **Constructor**

```javascript
new SyncEngine(options?)
```

**Parameters:**
- `options` (object, optional): Configuration options
  - `conflictStrategy` (string|function): Conflict resolution strategy

**Conflict Strategies:**
- `'LastWriteWins'` (default): Local changes always win
- `'ServerWins'`: Server changes always win  
- Custom function: `(localMutation, serverState) => resolvedMutation`

**Example:**
```javascript
import { SyncEngine } from 'aether-framework';

// Default strategy
const syncEngine = new SyncEngine();

// Server wins strategy
const syncEngine = new SyncEngine({
  conflictStrategy: 'ServerWins'
});

// Custom conflict resolution
const syncEngine = new SyncEngine({
  conflictStrategy: (localMutation, serverState) => {
    // Custom logic to resolve conflicts
    return resolvedMutation;
  }
});
```

### **Properties**

#### **isSyncing**

Whether the sync engine is currently processing the queue.

```javascript
isSyncing: boolean (readonly)
```

#### **conflictStrategy**

Current conflict resolution strategy.

```javascript
conflictStrategy: string | function (readonly)
```

### **Methods**

#### **addMutation(mutation)**

Adds a mutation to the sync queue.

```javascript
addMutation(mutation: Mutation): Promise<void>
```

**Parameters:**
- `mutation` (object): Mutation to queue
  - `type` (string): Mutation type identifier
  - `payload` (any): Mutation data
  - `timestamp` (number, optional): Mutation timestamp

**Example:**
```javascript
await syncEngine.addMutation({
  type: 'ADD_TODO',
  payload: { id: 1, text: 'Learn Aether.js', completed: false }
});

await syncEngine.addMutation({
  type: 'UPDATE_USER',
  payload: { id: 123, name: 'Alice' },
  timestamp: Date.now()
});
```

#### **processQueue()**

Processes all pending mutations in the queue.

```javascript
processQueue(): Promise<void>
```

**Behavior:**
- Only runs when online (`navigator.onLine === true`)
- Skips if already syncing (`isSyncing === true`)
- Processes mutations sequentially
- Handles conflicts using configured strategy
- Clears queue on successful sync

**Example:**
```javascript
// Manually trigger sync
await syncEngine.processQueue();

// Automatically triggered when coming online
window.addEventListener('online', () => {
  syncEngine.processQueue();
});
```

#### **getQueue()**

Returns the current mutation queue.

```javascript
getQueue(): Promise<Mutation[]>
```

**Returns:**
- Array of pending mutations

**Example:**
```javascript
const pendingMutations = await syncEngine.getQueue();
console.log(`${pendingMutations.length} mutations pending`);
```

### **Custom Sync Methods**

These methods can be overridden for custom sync behavior:

#### **syncMutation(mutation)**

Override to implement custom sync logic.

```javascript
syncMutation(mutation: Mutation): Promise<void>
```

#### **fetchServerState(mutation)**

Override to fetch server state for conflict resolution.

```javascript
fetchServerState(mutation: Mutation): Promise<any>
```

#### **hasConflict(mutation, serverState)**

Override to implement custom conflict detection.

```javascript
hasConflict(mutation: Mutation, serverState: any): boolean
```

---

## 🛠️ **Utilities**

### **Constants**

```javascript
import { SYNC_STATUS, CONFLICT_STRATEGIES } from 'aether-framework';

// Sync status constants
SYNC_STATUS.IDLE        // 'idle'
SYNC_STATUS.SYNCING     // 'syncing'
SYNC_STATUS.ERROR       // 'error'
SYNC_STATUS.SYNCED      // 'synced'

// Conflict strategy constants
CONFLICT_STRATEGIES.LAST_WRITE_WINS  // 'LastWriteWins'
CONFLICT_STRATEGIES.SERVER_WINS      // 'ServerWins'
```

### **Type Definitions**

```typescript
// Mutation interface
interface Mutation {
  type: string;
  payload: any;
  timestamp?: number;
}

// Sync state interface
interface SyncState {
  status: 'idle' | 'syncing' | 'error' | 'synced';
  pending: number;
  error: Error | null;
}

// Conflict resolver function
type ConflictResolver = (
  localMutation: Mutation,
  serverState: any
) => Mutation;
```

---

## 📖 **Usage Patterns**

### **Store Integration**

```javascript
// Create stores
const todoStore = new PersistentStore('todos', []);
const syncEngine = new SyncEngine();

// Connect store to sync engine
todoStore.subscribe(async (todos) => {
  await syncEngine.addMutation({
    type: 'SYNC_TODOS',
    payload: todos
  });
});
```

### **Component Integration**

```javascript
class TodoApp extends AetherComponent {
  constructor() {
    super();
    this.store = new PersistentStore('todos', []);
    this.syncEngine = new SyncEngine();
    
    // Subscribe to store changes
    this.store.subscribe(state => this.render(state));
  }

  onOnline() {
    this.syncEngine.processQueue();
  }

  onSyncStateChange(state) {
    this.updateSyncIndicator(state);
  }
}
```

---

**Next:** [Architecture Guide](./architecture.md) | [Examples](./examples.md)
