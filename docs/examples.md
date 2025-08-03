# Aether.js Examples & Tutorials

Real-world examples demonstrating the power of the **Resilient-First** paradigm.

## 📚 **Table of Contents**

- [Basic Examples](#basic-examples)
- [Real-World Applications](#real-world-applications)
- [Advanced Patterns](#advanced-patterns)
- [Integration Examples](#integration-examples)

---

## 🎯 **Basic Examples**

### **1. Counter App - Reactive State**

A simple counter demonstrating reactive state management.

```javascript
import { AetherStore, AetherComponent } from 'aether-framework';

class CounterApp extends AetherComponent {
  constructor() {
    super();
    
    // Create reactive store
    this.counterStore = new AetherStore(0);
    
    // Subscribe to changes
    this.counterStore.subscribe(count => {
      this.render(count);
    });
  }

  increment() {
    this.counterStore.update(count => count + 1);
  }

  decrement() {
    this.counterStore.update(count => count - 1);
  }

  reset() {
    this.counterStore.set(0);
  }

  render(count) {
    document.getElementById('app').innerHTML = `
      <div class="counter-app">
        <h1>Counter: ${count}</h1>
        <button onclick="counter.increment()">+</button>
        <button onclick="counter.decrement()">-</button>
        <button onclick="counter.reset()">Reset</button>
      </div>
    `;
  }
}

// Initialize
const counter = new CounterApp();
window.counter = counter;
```

### **2. User Profile - Persistent Data**

User profile management with automatic persistence.

```javascript
import { PersistentStore, AetherComponent } from 'aether-framework';

class UserProfile extends AetherComponent {
  constructor() {
    super();
    
    // Persistent store automatically saves to IndexedDB
    this.userStore = new PersistentStore('user-profile', {
      name: '',
      email: '',
      avatar: '',
      preferences: {
        theme: 'light',
        notifications: true
      }
    });
    
    this.userStore.subscribe(user => this.render(user));
  }

  updateProfile(field, value) {
    this.userStore.update(user => ({
      ...user,
      [field]: value
    }));
  }

  updatePreference(key, value) {
    this.userStore.update(user => ({
      ...user,
      preferences: {
        ...user.preferences,
        [key]: value
      }
    }));
  }

  render(user) {
    document.getElementById('app').innerHTML = `
      <div class="user-profile">
        <h2>User Profile</h2>
        <form>
          <input 
            type="text" 
            placeholder="Name" 
            value="${user.name}"
            onchange="profile.updateProfile('name', this.value)"
          />
          <input 
            type="email" 
            placeholder="Email" 
            value="${user.email}"
            onchange="profile.updateProfile('email', this.value)"
          />
          <label>
            <input 
              type="checkbox" 
              ${user.preferences.notifications ? 'checked' : ''}
              onchange="profile.updatePreference('notifications', this.checked)"
            />
            Enable Notifications
          </label>
        </form>
      </div>
    `;
  }
}

const profile = new UserProfile();
window.profile = profile;
```

### **3. Shopping Cart - Offline Commerce**

E-commerce cart that works offline with sync capabilities.

```javascript
import { PersistentStore, SyncEngine, AetherComponent } from 'aether-framework';

class ShoppingCart extends AetherComponent {
  constructor() {
    super();
    
    this.cartStore = new PersistentStore('shopping-cart', {
      items: [],
      total: 0
    });
    
    this.syncEngine = new SyncEngine({
      conflictStrategy: 'LastWriteWins'
    });
    
    // Setup sync integration
    this.cartStore.subscribe(async (cart) => {
      await this.syncEngine.addMutation({
        type: 'UPDATE_CART',
        payload: cart
      });
    });
    
    this.cartStore.subscribe(cart => this.render(cart));
  }

  addItem(product) {
    this.cartStore.update(cart => {
      const existingItem = cart.items.find(item => item.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.items.push({ ...product, quantity: 1 });
      }
      
      cart.total = this.calculateTotal(cart.items);
      return cart;
    });
  }

  removeItem(productId) {
    this.cartStore.update(cart => {
      cart.items = cart.items.filter(item => item.id !== productId);
      cart.total = this.calculateTotal(cart.items);
      return cart;
    });
  }

  updateQuantity(productId, quantity) {
    this.cartStore.update(cart => {
      const item = cart.items.find(item => item.id === productId);
      if (item) {
        item.quantity = Math.max(0, quantity);
        if (item.quantity === 0) {
          cart.items = cart.items.filter(item => item.id !== productId);
        }
      }
      cart.total = this.calculateTotal(cart.items);
      return cart;
    });
  }

  calculateTotal(items) {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  onOffline() {
    this.showOfflineMessage();
  }

  onOnline() {
    this.hideOfflineMessage();
    this.syncEngine.processQueue();
  }

  render(cart) {
    document.getElementById('app').innerHTML = `
      <div class="shopping-cart">
        <h2>Shopping Cart</h2>
        <div id="offline-message" style="display: none;">
          📱 You're offline - changes will sync when reconnected
        </div>
        
        ${cart.items.length === 0 ? 
          '<p>Your cart is empty</p>' :
          cart.items.map(item => `
            <div class="cart-item">
              <span>${item.name}</span>
              <span>$${item.price}</span>
              <input 
                type="number" 
                value="${item.quantity}"
                min="0"
                onchange="cart.updateQuantity(${item.id}, parseInt(this.value))"
              />
              <button onclick="cart.removeItem(${item.id})">Remove</button>
            </div>
          `).join('')
        }
        
        <div class="cart-total">
          <strong>Total: $${cart.total.toFixed(2)}</strong>
        </div>
      </div>
    `;
  }

  showOfflineMessage() {
    const msg = document.getElementById('offline-message');
    if (msg) msg.style.display = 'block';
  }

  hideOfflineMessage() {
    const msg = document.getElementById('offline-message');
    if (msg) msg.style.display = 'none';
  }
}

const cart = new ShoppingCart();
window.cart = cart;

// Example products
const sampleProducts = [
  { id: 1, name: 'Laptop', price: 999.99 },
  { id: 2, name: 'Mouse', price: 29.99 },
  { id: 3, name: 'Keyboard', price: 79.99 }
];

// Add sample products
sampleProducts.forEach(product => {
  cart.addItem(product);
});
```

---

## 🏢 **Real-World Applications**

### **1. Field Service Management**

Complete field service app for technicians working in remote locations.

```javascript
import { PersistentStore, SyncEngine, AetherComponent } from 'aether-framework';

class FieldServiceApp extends AetherComponent {
  constructor() {
    super();
    
    // Multiple persistent stores for different data types
    this.workOrdersStore = new PersistentStore('work-orders', []);
    this.inventoryStore = new PersistentStore('inventory', []);
    this.customerStore = new PersistentStore('customers', []);
    
    // Sync engine with custom conflict resolution
    this.syncEngine = new SyncEngine({
      conflictStrategy: this.resolveFieldServiceConflicts.bind(this)
    });
    
    this.setupSyncIntegration();
    this.setupSubscriptions();
  }

  setupSyncIntegration() {
    // Sync work orders
    this.workOrdersStore.subscribe(async (orders) => {
      await this.syncEngine.addMutation({
        type: 'SYNC_WORK_ORDERS',
        payload: orders,
        timestamp: Date.now()
      });
    });

    // Sync inventory updates
    this.inventoryStore.subscribe(async (inventory) => {
      await this.syncEngine.addMutation({
        type: 'SYNC_INVENTORY',
        payload: inventory,
        timestamp: Date.now()
      });
    });
  }

  resolveFieldServiceConflicts(localMutation, serverState) {
    // Business logic for field service conflicts
    if (localMutation.type === 'SYNC_WORK_ORDERS') {
      // Field technician updates always take precedence for work orders
      return localMutation;
    } else if (localMutation.type === 'SYNC_INVENTORY') {
      // Inventory conflicts need careful handling
      return this.mergeInventoryChanges(localMutation, serverState);
    }
    return localMutation;
  }

  mergeInventoryChanges(localMutation, serverState) {
    // Custom inventory merge logic
    const localInventory = localMutation.payload;
    const serverInventory = serverState.inventory;
    
    // Merge based on last update timestamp
    const merged = localInventory.map(localItem => {
      const serverItem = serverInventory.find(s => s.id === localItem.id);
      if (serverItem && serverItem.lastUpdated > localItem.lastUpdated) {
        return serverItem;
      }
      return localItem;
    });
    
    return { ...localMutation, payload: merged };
  }

  // Work order management
  updateWorkOrderStatus(orderId, status, notes = '') {
    this.workOrdersStore.update(orders => 
      orders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status, 
              notes: notes || order.notes,
              lastUpdated: Date.now(),
              updatedBy: 'technician'
            }
          : order
      )
    );
  }

  addInventoryUsage(itemId, quantityUsed, workOrderId) {
    this.inventoryStore.update(inventory => 
      inventory.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              quantity: item.quantity - quantityUsed,
              lastUsed: Date.now(),
              usageHistory: [
                ...item.usageHistory,
                { workOrderId, quantityUsed, timestamp: Date.now() }
              ]
            }
          : item
      )
    );
  }

  onOffline() {
    this.showOfflineMode();
    console.log('📱 Field Service App: Working offline');
  }

  onOnline() {
    this.hideOfflineMode();
    this.syncEngine.processQueue();
    console.log('🌐 Field Service App: Syncing with dispatch');
  }

  onSyncStateChange(state) {
    this.updateSyncStatus(state);
    if (state.status === 'synced') {
      this.showSyncSuccess();
    } else if (state.status === 'error') {
      this.showSyncError(state.error);
    }
  }
}
```

### **2. Healthcare Patient Records**

HIPAA-compliant patient record system that works offline.

```javascript
class HealthcareRecords extends AetherComponent {
  constructor() {
    super();
    
    // Encrypted persistent storage for sensitive data
    this.patientStore = new PersistentStore('patient-records', []);
    this.vitalsStore = new PersistentStore('vital-signs', []);
    
    // Healthcare-specific sync with audit trail
    this.syncEngine = new SyncEngine({
      conflictStrategy: 'ServerWins' // Healthcare data - server is authoritative
    });
    
    this.setupAuditTrail();
    this.setupDataValidation();
  }

  setupAuditTrail() {
    // Track all changes for compliance
    this.patientStore.subscribe(patients => {
      this.logAuditEvent('PATIENT_DATA_MODIFIED', {
        timestamp: Date.now(),
        userId: this.getCurrentUserId(),
        recordCount: patients.length
      });
    });
  }

  addVitalSigns(patientId, vitals) {
    const vitalRecord = {
      id: this.generateId(),
      patientId,
      ...vitals,
      timestamp: Date.now(),
      recordedBy: this.getCurrentUserId(),
      deviceId: this.getDeviceId()
    };

    this.vitalsStore.update(allVitals => [...allVitals, vitalRecord]);
  }

  updatePatientRecord(patientId, updates) {
    // Validate updates before applying
    if (!this.validatePatientData(updates)) {
      throw new Error('Invalid patient data');
    }

    this.patientStore.update(patients => 
      patients.map(patient => 
        patient.id === patientId 
          ? { 
              ...patient, 
              ...updates,
              lastModified: Date.now(),
              modifiedBy: this.getCurrentUserId()
            }
          : patient
      )
    );
  }

  onOffline() {
    this.showOfflineIndicator();
    // In healthcare, offline capability is critical
    console.log('🏥 Healthcare System: Operating offline - all data secure locally');
  }

  onOnline() {
    this.hideOfflineIndicator();
    // Immediate sync for healthcare data
    this.syncEngine.processQueue();
    console.log('🏥 Healthcare System: Syncing patient data securely');
  }
}
```

---

## 🔧 **Advanced Patterns**

### **1. Multi-Store Coordination**

Managing complex state across multiple stores.

```javascript
class MultiStoreCoordinator extends AetherComponent {
  constructor() {
    super();
    
    // Multiple related stores
    this.userStore = new PersistentStore('user', {});
    this.preferencesStore = new PersistentStore('preferences', {});
    this.sessionStore = new AetherStore({}); // Memory-only
    
    // Coordinate changes across stores
    this.setupStoreCoordination();
  }

  setupStoreCoordination() {
    // When user changes, update related data
    this.userStore.subscribe(user => {
      if (user.id !== this.sessionStore.get().userId) {
        this.sessionStore.set({ userId: user.id, loginTime: Date.now() });
        this.loadUserPreferences(user.id);
      }
    });

    // Sync preferences when they change
    this.preferencesStore.subscribe(preferences => {
      this.syncEngine.addMutation({
        type: 'UPDATE_PREFERENCES',
        payload: { userId: this.userStore.get().id, preferences }
      });
    });
  }

  // Computed properties across stores
  get combinedState() {
    return {
      user: this.userStore.get(),
      preferences: this.preferencesStore.get(),
      session: this.sessionStore.get()
    };
  }
}
```

### **2. Custom Sync Strategies**

Implementing domain-specific synchronization logic.

```javascript
class CustomSyncStrategy extends SyncEngine {
  constructor() {
    super({
      conflictStrategy: 'custom'
    });
  }

  // Override sync method for custom behavior
  async syncMutation(mutation) {
    switch (mutation.type) {
      case 'FINANCIAL_TRANSACTION':
        return this.syncFinancialTransaction(mutation);
      case 'INVENTORY_UPDATE':
        return this.syncInventoryUpdate(mutation);
      default:
        return super.syncMutation(mutation);
    }
  }

  async syncFinancialTransaction(mutation) {
    // Financial data requires special handling
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...mutation.payload,
        clientTimestamp: mutation.timestamp,
        checksum: this.calculateChecksum(mutation.payload)
      })
    });

    if (!response.ok) {
      throw new Error(`Transaction sync failed: ${response.statusText}`);
    }

    return response.json();
  }

  calculateChecksum(data) {
    // Simple checksum for data integrity
    return btoa(JSON.stringify(data)).slice(0, 8);
  }
}
```

### **3. Performance Optimization Patterns**

Optimizing for large datasets and complex operations.

```javascript
class OptimizedDataManager extends AetherComponent {
  constructor() {
    super();
    
    // Use multiple stores for different data types
    this.metadataStore = new PersistentStore('metadata', {});
    this.dataChunks = new Map(); // Lazy-loaded data chunks
    
    this.setupLazyLoading();
    this.setupVirtualization();
  }

  setupLazyLoading() {
    // Only load data chunks when needed
    this.loadChunk = async (chunkId) => {
      if (!this.dataChunks.has(chunkId)) {
        const store = new PersistentStore(`chunk-${chunkId}`, []);
        this.dataChunks.set(chunkId, store);
      }
      return this.dataChunks.get(chunkId);
    };
  }

  setupVirtualization() {
    // Virtual scrolling for large lists
    this.visibleRange = { start: 0, end: 50 };
    this.itemHeight = 50;
    this.containerHeight = 500;
  }

  async getVisibleItems() {
    const { start, end } = this.visibleRange;
    const chunkSize = 100;
    const startChunk = Math.floor(start / chunkSize);
    const endChunk = Math.floor(end / chunkSize);
    
    const items = [];
    for (let chunk = startChunk; chunk <= endChunk; chunk++) {
      const chunkStore = await this.loadChunk(chunk);
      const chunkData = chunkStore.get();
      items.push(...chunkData.slice(
        Math.max(0, start - chunk * chunkSize),
        Math.min(chunkSize, end - chunk * chunkSize)
      ));
    }
    
    return items;
  }
}
```

---

## 🔗 **Integration Examples**

### **1. React Integration**

Using Aether.js with React applications.

```javascript
import React, { useState, useEffect } from 'react';
import { PersistentStore } from 'aether-framework';

// Custom hook for Aether.js stores
function useAetherStore(store) {
  const [state, setState] = useState(store.get());
  
  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    return unsubscribe;
  }, [store]);
  
  return state;
}

// React component using Aether.js
function TodoList() {
  const todoStore = new PersistentStore('todos', []);
  const todos = useAetherStore(todoStore);
  
  const addTodo = (text) => {
    todoStore.update(todos => [...todos, { 
      id: Date.now(), 
      text, 
      completed: false 
    }]);
  };
  
  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>{todo.text}</div>
      ))}
    </div>
  );
}
```

### **2. Vue.js Integration**

Using Aether.js with Vue applications.

```javascript
import { ref, onMounted, onUnmounted } from 'vue';
import { PersistentStore } from 'aether-framework';

// Vue composable for Aether.js
export function useAetherStore(store) {
  const state = ref(store.get());
  let unsubscribe;
  
  onMounted(() => {
    unsubscribe = store.subscribe(newState => {
      state.value = newState;
    });
  });
  
  onUnmounted(() => {
    if (unsubscribe) unsubscribe();
  });
  
  return state;
}

// Vue component
export default {
  setup() {
    const todoStore = new PersistentStore('todos', []);
    const todos = useAetherStore(todoStore);
    
    return { todos, todoStore };
  }
};
```

---

**Next:** [Deployment Guide](./deployment.md) | [Migration Guide](./migration.md)
