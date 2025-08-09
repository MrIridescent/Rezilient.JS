import { AetherComponent, AetherStore, initializeAether } from 'rezilient.js';

// Initialize framework
initializeAether({
  carbonAware: true,
  offlineFirst: true,
  aiAware: true
});

class demovanillaApp extends AetherComponent {
  constructor() {
    super();
    this.store = new AetherStore({ count: 0, items: [] });
    this.init();
  }

  async init() {
    await this.render();
    this.setupEventListeners();
  }

  async render() {
    const state = this.store.get();
    
    document.getElementById('app').innerHTML = `
      <div class="app">
        <h1>🌟 demo-vanilla</h1>
        <p>Production-ready resilient application</p>
        
        <div class="counter">
          <button id="decrement">-</button>
          <span>${state.count}</span>
          <button id="increment">+</button>
        </div>
        
        <div class="status">
          <p>Carbon Impact: ${this.getCarbonStatus()}</p>
          <p>Online: ${this.isOnline ? '✅' : '❌'}</p>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    document.getElementById('increment')?.addEventListener('click', () => {
      this.store.update(state => ({ ...state, count: state.count + 1 }));
      this.render();
    });

    document.getElementById('decrement')?.addEventListener('click', () => {
      this.store.update(state => ({ ...state, count: state.count - 1 }));
      this.render();
    });
  }

  getCarbonStatus() {
    const impact = this.carbonAwareScheduler.getCurrentCarbonIntensity();
    return impact > 0.7 ? '🔴 High' : impact > 0.4 ? '🟡 Medium' : '🟢 Low';
  }
}

// Initialize app
new demovanillaApp();