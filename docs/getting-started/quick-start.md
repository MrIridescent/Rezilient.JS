# ⚡ Quick Start Tutorial

Build your first Aether.js application in just 5 minutes! This tutorial will show you the power of the revolutionary framework.

## 🎯 What We'll Build

A **Smart Todo App** that demonstrates:
- ✅ Offline-first data persistence
- ✅ Real-time synchronization
- ✅ AI-powered task suggestions
- ✅ Carbon-aware scheduling
- ✅ Biometric wellness integration

## 🚀 Step 1: Create Your App

```bash
# Create a new Aether.js application
create-aether-app smart-todo --template ai --features ai,carbon,biometric

# Navigate to your project
cd smart-todo

# Start the development server
aether dev
```

Your app will be available at `http://localhost:3000` 🎉

## 📝 Step 2: Understanding the Structure

```
smart-todo/
├── src/
│   ├── main.js          # Application entry point
│   ├── components/      # Reusable components
│   ├── stores/          # Data stores
│   └── styles.css       # Styling
├── index.html           # HTML template
├── package.json         # Dependencies
└── aether.config.js     # Framework configuration
```

## 🧠 Step 3: Create a Smart Todo Component

Create `src/components/SmartTodo.js`:

```javascript
import { AetherComponent, PersistentStore, useAetherStore } from '@aether/framework';
import { AetherAI, CarbonAwareScheduler, BiometricAware } from '@aether/framework';

export class SmartTodo extends AetherComponent {
  constructor() {
    super();
    
    // Initialize data store
    this.todoStore = new PersistentStore('todos', []);
    
    // Initialize revolutionary features
    this.ai = new AetherAI({ enableCodeGeneration: true });
    this.carbonScheduler = new CarbonAwareScheduler();
    this.biometric = new BiometricAware({ enableStressDetection: true });
    
    this.init();
  }
  
  async init() {
    // Subscribe to store changes
    this.todoStore.subscribe((todos) => {
      this.render(todos);
    });
    
    // Subscribe to wellness state
    this.biometric.onWellnessChange = (wellness) => {
      this.adaptToWellness(wellness);
    };
    
    // Initial render
    this.render(this.todoStore.get());
  }
  
  async addTodo(text) {
    const todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date(),
      priority: await this.calculatePriority(text),
      carbonOptimal: await this.checkCarbonOptimal()
    };
    
    // Add to store (automatically syncs)
    this.todoStore.update(todos => [...todos, todo]);
    
    // Schedule with carbon awareness
    if (todo.priority === 'low') {
      await this.carbonScheduler.scheduleTask({
        type: 'todo-reminder',
        execute: () => this.remindTodo(todo.id),
        estimatedDuration: 1000
      }, 'background');
    }
  }
  
  async calculatePriority(text) {
    // Use AI to determine task priority
    const analysis = await this.ai.assessCodeQuality(text);
    return analysis.overall > 0.7 ? 'high' : 'normal';
  }
  
  async checkCarbonOptimal() {
    const stats = this.carbonScheduler.getStats();
    return stats.carbonIntensity === 'low';
  }
  
  adaptToWellness(wellness) {
    // Adapt UI based on user wellness
    if (wellness.currentStress > 70) {
      // Simplify interface when user is stressed
      document.body.classList.add('stress-mode');
    } else {
      document.body.classList.remove('stress-mode');
    }
  }
  
  toggleTodo(id) {
    this.todoStore.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }
  
  deleteTodo(id) {
    this.todoStore.update(todos =>
      todos.filter(todo => todo.id !== id)
    );
  }
  
  render(todos) {
    const app = document.getElementById('app');
    if (!app) return;
    
    const completedCount = todos.filter(t => t.completed).length;
    const totalCount = todos.length;
    const carbonStats = this.carbonScheduler.getStats();
    
    app.innerHTML = `
      <div class="smart-todo">
        <header class="todo-header">
          <h1>🧠 Smart Todo App</h1>
          <p class="subtitle">Powered by Aether.js Revolutionary Framework</p>
          
          <div class="stats">
            <div class="stat">
              <span class="label">Tasks:</span>
              <span class="value">${completedCount}/${totalCount}</span>
            </div>
            <div class="stat">
              <span class="label">Carbon Saved:</span>
              <span class="value">${carbonStats.carbonSaved.toFixed(1)}g CO₂</span>
            </div>
            <div class="stat">
              <span class="label">Network:</span>
              <span class="value ${this.getNetworkState().isOnline ? 'online' : 'offline'}">
                ${this.getNetworkState().isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </header>
        
        <main class="todo-main">
          <form class="add-todo-form" onsubmit="smartTodo.handleSubmit(event)">
            <input 
              type="text" 
              placeholder="Add a smart todo..." 
              class="todo-input"
              id="todoInput"
              required
            />
            <button type="submit" class="add-btn">
              ✨ Add Smart Todo
            </button>
          </form>
          
          <div class="todo-list">
            ${todos.map(todo => `
              <div class="todo-item ${todo.completed ? 'completed' : ''} ${todo.priority === 'high' ? 'high-priority' : ''}">
                <input 
                  type="checkbox" 
                  ${todo.completed ? 'checked' : ''}
                  onchange="smartTodo.toggleTodo(${todo.id})"
                  class="todo-checkbox"
                />
                <span class="todo-text">${todo.text}</span>
                <div class="todo-meta">
                  <span class="priority priority-${todo.priority}">${todo.priority}</span>
                  ${todo.carbonOptimal ? '<span class="carbon-optimal">🌱 Carbon Optimal</span>' : ''}
                </div>
                <button 
                  onclick="smartTodo.deleteTodo(${todo.id})"
                  class="delete-btn"
                  aria-label="Delete todo"
                >
                  🗑️
                </button>
              </div>
            `).join('')}
          </div>
          
          ${todos.length === 0 ? `
            <div class="empty-state">
              <h3>🎯 Ready to be productive?</h3>
              <p>Add your first smart todo above. The AI will help prioritize and schedule it optimally!</p>
            </div>
          ` : ''}
          
          <div class="revolutionary-features">
            <h3>🌟 Revolutionary Features Active</h3>
            <div class="feature-list">
              <div class="feature">🧠 AI Priority Detection</div>
              <div class="feature">🌱 Carbon-Aware Scheduling</div>
              <div class="feature">🫀 Wellness Adaptation</div>
              <div class="feature">⚡ Offline-First Sync</div>
            </div>
          </div>
        </main>
      </div>
    `;
  }
  
  handleSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (text) {
      this.addTodo(text);
      input.value = '';
    }
  }
  
  // Lifecycle hooks
  onOnline() {
    console.log('📶 Back online! Syncing todos...');
    this.render(this.todoStore.get());
  }
  
  onOffline() {
    console.log('📱 Working offline - todos saved locally');
    this.render(this.todoStore.get());
  }
  
  onSyncStateChange(state) {
    console.log('🔄 Sync state:', state.status);
  }
}

// Initialize and make globally available
const smartTodo = new SmartTodo();
window.smartTodo = smartTodo;
```

## 🎨 Step 4: Add Smart Styling

Update `src/styles.css`:

```css
/* Smart Todo Styles */
:root {
  --primary: #667eea;
  --primary-dark: #5a67d8;
  --success: #38a169;
  --warning: #d69e2e;
  --danger: #e53e3e;
  --bg-primary: #ffffff;
  --bg-secondary: #f7fafc;
  --text-primary: #2d3748;
  --text-secondary: #4a5568;
  --border: #e2e8f0;
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --radius: 8px;
}

.smart-todo {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.todo-header {
  text-align: center;
  margin-bottom: 2rem;
}

.todo-header h1 {
  color: var(--primary);
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  min-width: 120px;
}

.stat .label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.stat .value {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--primary);
}

.stat .value.online {
  color: var(--success);
}

.stat .value.offline {
  color: var(--warning);
}

.add-todo-form {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.todo-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.todo-input:focus {
  outline: none;
  border-color: var(--primary);
}

.add-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background: var(--primary-dark);
}

.todo-list {
  space-y: 1rem;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  margin-bottom: 1rem;
  transition: all 0.2s;
}

.todo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.todo-item.completed {
  opacity: 0.7;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
}

.todo-item.high-priority {
  border-left: 4px solid var(--danger);
}

.todo-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.todo-text {
  flex: 1;
  font-size: 1rem;
  color: var(--text-primary);
}

.todo-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.priority {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-high {
  background: #fed7d7;
  color: var(--danger);
}

.priority-normal {
  background: #e6fffa;
  color: var(--success);
}

.carbon-optimal {
  padding: 0.25rem 0.5rem;
  background: #f0fff4;
  color: var(--success);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.delete-btn:hover {
  background: #fed7d7;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.empty-state h3 {
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.revolutionary-features {
  margin-top: 3rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: var(--radius);
  text-align: center;
}

.revolutionary-features h3 {
  margin-bottom: 1rem;
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.feature {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-weight: 500;
}

/* Stress mode adaptations */
body.stress-mode .smart-todo {
  filter: sepia(0.1);
}

body.stress-mode .add-todo-form,
body.stress-mode .todo-item {
  box-shadow: none;
  border: 1px solid var(--border);
}

body.stress-mode .revolutionary-features {
  background: var(--text-secondary);
}

/* Responsive design */
@media (max-width: 768px) {
  .stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .add-todo-form {
    flex-direction: column;
  }
  
  .todo-item {
    flex-wrap: wrap;
  }
  
  .feature-list {
    grid-template-columns: 1fr;
  }
}
```

## 🧪 Step 5: Test Your App

1. **Add some todos** and watch the AI prioritize them
2. **Go offline** (disable network) and see offline functionality
3. **Come back online** and watch automatic synchronization
4. **Check the console** for revolutionary features in action

## 🎯 Step 6: Explore Revolutionary Features

### AI-Powered Insights
```javascript
// Get AI suggestions for your todos
const suggestions = await smartTodo.ai.suggestComponents({
  type: 'productivity',
  context: 'todo-management'
});
```

### Carbon Awareness
```javascript
// Check carbon optimal times
const carbonStats = smartTodo.carbonScheduler.getStats();
console.log('Carbon intensity:', carbonStats.carbonIntensity);
console.log('Renewable percentage:', carbonStats.renewablePercentage);
```

### Biometric Adaptation
```javascript
// Monitor wellness state
smartTodo.biometric.getWellnessReport().then(wellness => {
  console.log('Current stress level:', wellness.currentState.currentStress);
  console.log('Focus level:', wellness.currentState.focusLevel);
});
```

## 🚀 What's Next?

Congratulations! You've built your first revolutionary Aether.js application. Here's what to explore next:

### 📚 Learn More
- **[Core Concepts](./core-concepts.md)** - Deep dive into framework fundamentals
- **[Revolutionary Features](../revolutionary/)** - Explore all 8 industry firsts
- **[Architecture Guide](../architecture/overview.md)** - Understand the framework design

### 🛠️ Build More
- **[Enterprise App Tutorial](../examples/enterprise.md)** - Build a full business application
- **[Spatial App Tutorial](../examples/spatial.md)** - Create AR/VR experiences
- **[AI-Powered App Tutorial](../examples/ai-powered.md)** - Leverage machine learning

### 🌟 Advanced Features
- **[Quantum Security](../revolutionary/quantum-ready.md)** - Implement post-quantum cryptography
- **[Neuromorphic Computing](../revolutionary/neuromorphic.md)** - Add brain-computer interfaces
- **[Edge AI](../revolutionary/edge-ai.md)** - Deploy machine learning models

## 💡 Pro Tips

1. **Use the browser dev tools** to see Aether.js in action
2. **Check the Network tab** to see offline synchronization
3. **Monitor the Console** for revolutionary feature logs
4. **Try the app on mobile** to see responsive design
5. **Test offline mode** by disabling network connectivity

---

**You've just experienced the future of web development! 🌟**

The Smart Todo App demonstrates how Aether.js makes revolutionary features accessible and easy to use. Every line of code you wrote leverages industry-first capabilities that no other framework provides.

Ready to build something even more amazing? Let's continue the journey! 🚀
