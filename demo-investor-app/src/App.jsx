import React from 'react';
import { AetherComponent, useAetherStore, usePersistentStore } from 'rezilient.js';
import './App.css';

class App extends AetherComponent {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      isLoading: false
    };
  }

  async componentDidMount() {
    // Initialize with carbon-aware data loading
    await this.loadData();
  }

  async loadData() {
    this.setState({ isLoading: true });
    
    try {
      // Simulate API call with carbon-aware scheduling
      const response = await this.carbonAwareScheduler.schedule(
        () => fetch('/api/items'),
        { priority: 'normal', carbonThreshold: 'medium' }
      );
      
      const items = await response.json();
      this.setState({ items, isLoading: false });
    } catch (error) {
      console.error('Failed to load data:', error);
      this.setState({ isLoading: false });
    }
  }

  render() {
    const { items, isLoading } = this.state;
    
    return (
      <div className="app">
        <header className="app-header">
          <h1>🌟 demo-investor-app</h1>
          <p>Built with Rezilient.js - Production Ready & Carbon Aware</p>
        </header>
        
        <main className="app-main">
          {isLoading ? (
            <div className="loading">Loading with carbon awareness...</div>
          ) : (
            <ItemList items={items} />
          )}
        </main>
        
        <footer className="app-footer">
          <p>Powered by Rezilient.js Framework</p>
        </footer>
      </div>
    );
  }
}

function ItemList({ items }) {
  const [store] = useAetherStore({ items: [] });
  const [persistentStore] = usePersistentStore('user-preferences', {});
  
  return (
    <div className="item-list">
      <h2>Resilient Data ({items.length} items)</h2>
      {items.map((item, index) => (
        <div key={index} className="item">
          {item.name || `Item ${index + 1}`}
        </div>
      ))}
    </div>
  );
}

export default App;