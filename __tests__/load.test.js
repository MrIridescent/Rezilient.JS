/**
 * Load Testing for Rezilient.js
 * Tests framework performance under heavy concurrent load
 */

import { AetherStore, AetherComponent, SyncEngine, CarbonAwareScheduler } from '../src/index.js';

describe('Load Testing', () => {
  let loadResults = {};

  afterAll(() => {
    console.log('\n⚡ Load Test Results:');
    console.table(loadResults);
  });

  describe('Concurrent User Simulation', () => {
    test('should handle 100 concurrent users', async () => {
      const userCount = 100;
      const actionsPerUser = 10;
      const stores = [];
      const components = [];
      
      const startTime = performance.now();
      
      // Create 100 simulated users
      for (let i = 0; i < userCount; i++) {
        const userStore = new AetherStore({ 
          userId: i, 
          actions: 0, 
          data: [] 
        });
        
        const userComponent = new (class extends AetherComponent {
          constructor() {
            super();
            this.state = { active: true };
            this.store = userStore;
          }
          
          performAction() {
            this.store.update(state => ({
              ...state,
              actions: state.actions + 1,
              data: [...state.data, `action-${state.actions}`]
            }));
          }
        })();
        
        stores.push(userStore);
        components.push(userComponent);
      }
      
      // Simulate concurrent user actions
      const userPromises = components.map(async (component, index) => {
        const actions = [];
        
        for (let j = 0; j < actionsPerUser; j++) {
          actions.push(
            new Promise(resolve => {
              setTimeout(() => {
                component.performAction();
                resolve();
              }, Math.random() * 100); // Random delay 0-100ms
            })
          );
        }
        
        return Promise.all(actions);
      });
      
      await Promise.all(userPromises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const totalActions = userCount * actionsPerUser;
      const actionsPerSecond = Math.round(totalActions / (duration / 1000));
      
      // Verify all actions completed
      const completedActions = stores.reduce((sum, store) => sum + store.get().actions, 0);
      
      loadResults['Concurrent Users'] = {
        'Users': userCount,
        'Actions/User': actionsPerUser,
        'Total Actions': totalActions,
        'Completed': completedActions,
        'Duration (ms)': Math.round(duration),
        'Actions/sec': actionsPerSecond,
        'Status': completedActions === totalActions ? '✅ SUCCESS' : '❌ FAILED'
      };
      
      expect(completedActions).toBe(totalActions);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle rapid state updates', async () => {
      const store = new AetherStore({ counter: 0, updates: [] });
      const updateCount = 1000;
      const concurrentUpdaters = 10;
      
      const startTime = performance.now();
      
      // Create concurrent updaters
      const updaterPromises = Array.from({ length: concurrentUpdaters }, (_, updaterId) => {
        return new Promise(resolve => {
          let updatesCompleted = 0;
          
          const performUpdate = () => {
            if (updatesCompleted >= updateCount / concurrentUpdaters) {
              resolve();
              return;
            }
            
            store.update(state => ({
              ...state,
              counter: state.counter + 1,
              updates: [...state.updates, `updater-${updaterId}-${updatesCompleted}`]
            }));
            
            updatesCompleted++;
            
            // Use setTimeout to prevent blocking
            setTimeout(performUpdate, 0);
          };
          
          performUpdate();
        });
      });
      
      await Promise.all(updaterPromises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const finalState = store.get();
      
      loadResults['Rapid Updates'] = {
        'Target Updates': updateCount,
        'Actual Updates': finalState.counter,
        'Concurrent Updaters': concurrentUpdaters,
        'Duration (ms)': Math.round(duration),
        'Updates/sec': Math.round(updateCount / (duration / 1000)),
        'Status': finalState.counter === updateCount ? '✅ SUCCESS' : '❌ FAILED'
      };
      
      expect(finalState.counter).toBe(updateCount);
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Memory Stress Testing', () => {
    test('should handle large dataset operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const store = new AetherStore({ items: [] });
      
      const startTime = performance.now();
      
      // Create large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`.repeat(10),
        metadata: {
          created: new Date().toISOString(),
          tags: [`tag-${i % 10}`, `category-${i % 5}`],
          data: new Array(50).fill(i)
        }
      }));
      
      // Perform operations on large dataset
      store.set({ items: largeDataset });
      
      // Simulate filtering and sorting operations
      const filtered = store.get().items.filter(item => item.id % 2 === 0);
      const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      
      store.update(state => ({
        ...state,
        filtered: filtered.slice(0, 1000),
        sorted: sorted.slice(0, 1000)
      }));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
      
      loadResults['Large Dataset'] = {
        'Dataset Size': largeDataset.length,
        'Operations': 'Create, Filter, Sort, Update',
        'Duration (ms)': Math.round(duration),
        'Memory Increase (MB)': Math.round(memoryIncrease * 100) / 100,
        'Status': duration < 3000 && memoryIncrease < 200 ? '✅ EFFICIENT' : '❌ SLOW'
      };
      
      expect(duration).toBeLessThan(5000);
      expect(memoryIncrease).toBeLessThan(300); // Should use less than 300MB
      expect(store.get().items).toHaveLength(10000);
    });

    test('should handle memory cleanup properly', () => {
      const stores = [];
      const components = [];
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create many objects
      for (let i = 0; i < 1000; i++) {
        const store = new AetherStore({ 
          data: new Array(100).fill(`data-${i}`) 
        });
        
        const component = new (class extends AetherComponent {
          constructor() {
            super();
            this.state = { items: new Array(50).fill(i) };
          }
        })();
        
        stores.push(store);
        components.push(component);
      }
      
      const peakMemory = process.memoryUsage().heapUsed;
      
      // Clear references
      stores.length = 0;
      components.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryRecovered = (peakMemory - finalMemory) / 1024 / 1024; // MB
      const totalMemoryUsed = (peakMemory - initialMemory) / 1024 / 1024; // MB
      
      loadResults['Memory Cleanup'] = {
        'Objects Created': 1000,
        'Peak Memory (MB)': Math.round(totalMemoryUsed * 100) / 100,
        'Memory Recovered (MB)': Math.round(memoryRecovered * 100) / 100,
        'Recovery Rate': `${Math.round(memoryRecovered / totalMemoryUsed * 100)}%`,
        'Status': memoryRecovered > 0 ? '✅ GOOD' : '❌ POOR'
      };
      
      expect(memoryRecovered).toBeGreaterThan(0);
    });
  });

  describe('Sync Engine Load Testing', () => {
    test('should handle high-frequency sync operations', async () => {
      const syncEngine = new SyncEngine({
        endpoint: 'http://localhost:3000/sync',
        batchSize: 50,
        maxRetries: 3
      });
      
      // Mock successful sync
      let syncCallCount = 0;
      syncEngine.syncToServer = jest.fn().mockImplementation(() => {
        syncCallCount++;
        return Promise.resolve({ success: true, synced: 50 });
      });
      
      const startTime = performance.now();
      const mutationCount = 2000;
      
      // Queue many mutations rapidly
      for (let i = 0; i < mutationCount; i++) {
        syncEngine.queueMutation({
          type: 'UPDATE',
          payload: { id: i, data: `data-${i}` },
          timestamp: Date.now()
        });
      }
      
      // Process all batches
      const batchPromises = [];
      while (syncEngine.getPendingMutations().length > 0) {
        batchPromises.push(syncEngine.processBatch());
      }
      
      await Promise.all(batchPromises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const expectedBatches = Math.ceil(mutationCount / 50);
      
      loadResults['High-Frequency Sync'] = {
        'Mutations': mutationCount,
        'Batch Size': 50,
        'Expected Batches': expectedBatches,
        'Actual Sync Calls': syncCallCount,
        'Duration (ms)': Math.round(duration),
        'Mutations/sec': Math.round(mutationCount / (duration / 1000)),
        'Status': syncCallCount >= expectedBatches ? '✅ SUCCESS' : '❌ FAILED'
      };
      
      expect(syncCallCount).toBeGreaterThanOrEqual(expectedBatches);
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Carbon Scheduler Load Testing', () => {
    test('should handle massive task scheduling', async () => {
      const scheduler = new CarbonAwareScheduler();
      const taskCount = 500;
      
      const startTime = performance.now();
      
      // Create many tasks with different priorities
      const tasks = Array.from({ length: taskCount }, (_, i) => {
        const priority = ['low', 'normal', 'high'][i % 3];
        const carbonThreshold = ['low', 'medium', 'high'][i % 3];
        
        return scheduler.schedule(
          () => Promise.resolve(`task-${i}-result`),
          { priority, carbonThreshold }
        );
      });
      
      const results = await Promise.all(tasks);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const tasksPerSecond = Math.round(taskCount / (duration / 1000));
      
      loadResults['Task Scheduling'] = {
        'Tasks Scheduled': taskCount,
        'Tasks Completed': results.length,
        'Duration (ms)': Math.round(duration),
        'Tasks/sec': tasksPerSecond,
        'Success Rate': `${Math.round(results.length / taskCount * 100)}%`,
        'Status': results.length === taskCount ? '✅ SUCCESS' : '❌ FAILED'
      };
      
      expect(results).toHaveLength(taskCount);
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Component Rendering Load', () => {
    test('should handle rapid component updates', () => {
      class LoadTestComponent extends AetherComponent {
        constructor() {
          super();
          this.state = { 
            counter: 0, 
            items: [],
            renderCount: 0
          };
        }
        
        render() {
          this.setState({ renderCount: this.state.renderCount + 1 });
          
          return `
            <div>
              <h1>Counter: ${this.state.counter}</h1>
              <ul>
                ${this.state.items.map(item => `<li>${item}</li>`).join('')}
              </ul>
              <p>Renders: ${this.state.renderCount}</p>
            </div>
          `;
        }
      }
      
      const component = new LoadTestComponent();
      const updateCount = 500;
      
      const startTime = performance.now();
      
      // Perform rapid updates
      for (let i = 0; i < updateCount; i++) {
        component.setState({
          counter: i,
          items: [...component.state.items, `item-${i}`]
        });
        
        // Trigger render
        component.render();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const updatesPerSecond = Math.round(updateCount / (duration / 1000));
      
      loadResults['Component Updates'] = {
        'Updates': updateCount,
        'Final Counter': component.state.counter,
        'Items Created': component.state.items.length,
        'Duration (ms)': Math.round(duration),
        'Updates/sec': updatesPerSecond,
        'Status': component.state.counter === updateCount - 1 ? '✅ SUCCESS' : '❌ FAILED'
      };
      
      expect(component.state.counter).toBe(updateCount - 1);
      expect(component.state.items).toHaveLength(updateCount);
      expect(duration).toBeLessThan(3000);
    });
  });
});
