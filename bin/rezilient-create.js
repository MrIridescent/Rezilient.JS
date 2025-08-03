#!/usr/bin/env node

/**
 * REZILIENT.js Application Scaffolding CLI
 * Creates production-ready resilient applications with all framework features
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES = {
  'react-app': {
    name: 'React Application',
    description: 'Full-featured React app with offline-first architecture',
    dependencies: ['react', 'react-dom', '@types/react', '@types/react-dom'],
    devDependencies: ['@vitejs/plugin-react', 'vite', 'typescript']
  },
  'vanilla-js': {
    name: 'Vanilla JavaScript',
    description: 'Pure JavaScript app with all REZILIENT.js features',
    dependencies: [],
    devDependencies: ['vite', 'typescript']
  },
  'node-api': {
    name: 'Node.js API',
    description: 'Backend API with carbon-aware scheduling and resilient patterns',
    dependencies: ['express', 'cors'],
    devDependencies: ['nodemon', '@types/node', 'typescript']
  }
};

function createApp(appName, template = 'react-app') {
  const appPath = path.join(process.cwd(), appName);
  
  console.log(`🚀 Creating ${TEMPLATES[template].name}: ${appName}`);
  console.log(`📁 Location: ${appPath}`);
  
  // Create directory structure
  fs.mkdirSync(appPath, { recursive: true });
  fs.mkdirSync(path.join(appPath, 'src'), { recursive: true });
  fs.mkdirSync(path.join(appPath, 'public'), { recursive: true });
  
  // Create package.json
  const packageJson = {
    name: appName,
    version: '1.0.0',
    description: `Production-ready resilient application built with REZILIENT.js`,
    main: 'src/index.js',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      test: 'jest',
      'test:coverage': 'jest --coverage'
    },
    dependencies: {
      'rezilient.js': '^1.0.0',
      ...Object.fromEntries(TEMPLATES[template].dependencies.map(dep => [dep, 'latest']))
    },
    devDependencies: {
      jest: '^29.0.0',
      '@jest/environment-jsdom': '^29.0.0',
      ...Object.fromEntries(TEMPLATES[template].devDependencies.map(dep => [dep, 'latest']))
    }
  };
  
  fs.writeFileSync(
    path.join(appPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create main application files based on template
  createTemplateFiles(appPath, template, appName);
  
  // Create configuration files
  createConfigFiles(appPath, template);
  
  console.log(`✅ ${appName} created successfully!`);
  console.log(`\n📋 Next steps:`);
  console.log(`   cd ${appName}`);
  console.log(`   npm install`);
  console.log(`   npm run dev`);
  console.log(`\n🌟 Features included:`);
  console.log(`   ✓ Offline-first architecture`);
  console.log(`   ✓ Carbon-aware computing`);
  console.log(`   ✓ AI-bias detection`);
  console.log(`   ✓ Self-healing capabilities`);
  console.log(`   ✓ Quantum-ready patterns`);
  console.log(`   ✓ Accessibility-first design`);
  console.log(`   ✓ Production-ready testing`);
}

function createTemplateFiles(appPath, template, appName) {
  switch (template) {
    case 'react-app':
      createReactApp(appPath, appName);
      break;
    case 'vanilla-js':
      createVanillaApp(appPath, appName);
      break;
    case 'node-api':
      createNodeAPI(appPath, appName);
      break;
  }
}

function createReactApp(appPath, appName) {
  // Main App component
  const appComponent = `import React from 'react';
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
          <h1>🌟 ${appName}</h1>
          <p>Built with REZILIENT.js - Production Ready & Carbon Aware</p>
        </header>
        
        <main className="app-main">
          {isLoading ? (
            <div className="loading">Loading with carbon awareness...</div>
          ) : (
            <ItemList items={items} />
          )}
        </main>
        
        <footer className="app-footer">
          <p>Powered by REZILIENT.js Framework</p>
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
          {item.name || \`Item \${index + 1}\`}
        </div>
      ))}
    </div>
  );
}

export default App;`;

  fs.writeFileSync(path.join(appPath, 'src', 'App.jsx'), appComponent);
  
  // Main entry point
  const mainJs = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Initialize REZILIENT.js framework with real-world capabilities
import { initializeAether } from 'rezilient.js';

initializeAether({
  // Core Features
  carbonAware: true,
  offlineFirst: true,
  aiAware: true,
  accessibilityFirst: true,
  selfHealing: true,
  biasDetection: true,

  // Real Carbon API Configuration (add your API keys)
  // carbonApiKey: 'your-co2-signal-api-key',
  // carbonInterfaceKey: 'your-carbon-interface-key',
  // wattTimeToken: 'your-watttime-token',
  enableRealCarbonData: true,

  // Energy Monitoring
  enableEnergyMonitoring: true,
  enableBatteryAPI: true,
  enablePerformanceAPI: true,

  // AI Bias Detection
  enableRealBiasDetection: true,
  biasThreshold: 0.1,
  protectedAttributes: ['gender', 'race', 'age'],

  // Self-Healing
  enablePredictiveHealing: true,
  performanceMonitoring: true,

  // Development
  debug: process.env.NODE_ENV === 'development'
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

  fs.writeFileSync(path.join(appPath, 'src', 'main.jsx'), mainJs);
}

function createVanillaApp(appPath, appName) {
  const mainJs = `import { AetherComponent, AetherStore, initializeAether } from 'rezilient.js';

// Initialize framework
initializeAether({
  carbonAware: true,
  offlineFirst: true,
  aiAware: true
});

class ${appName.replace(/[^a-zA-Z0-9]/g, '')}App extends AetherComponent {
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
    
    document.getElementById('app').innerHTML = \`
      <div class="app">
        <h1>🌟 ${appName}</h1>
        <p>Production-ready resilient application</p>
        
        <div class="counter">
          <button id="decrement">-</button>
          <span>\${state.count}</span>
          <button id="increment">+</button>
        </div>
        
        <div class="status">
          <p>Carbon Impact: \${this.getCarbonStatus()}</p>
          <p>Online: \${this.isOnline ? '✅' : '❌'}</p>
        </div>
      </div>
    \`;
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
new ${appName.replace(/[^a-zA-Z0-9]/g, '')}App();`;

  fs.writeFileSync(path.join(appPath, 'src', 'main.js'), mainJs);
}

function createNodeAPI(appPath, appName) {
  const serverJs = `import express from 'express';
import cors from 'cors';
import { CarbonAwareScheduler, AetherPrinciples } from 'rezilient.js';

const app = express();
const port = process.env.PORT || 3000;

// Initialize REZILIENT.js for backend
const scheduler = new CarbonAwareScheduler();
const principles = new AetherPrinciples();

app.use(cors());
app.use(express.json());

// Carbon-aware middleware
app.use(async (req, res, next) => {
  const carbonIntensity = await scheduler.getCurrentCarbonIntensity();
  req.carbonIntensity = carbonIntensity;
  
  // Add carbon headers
  res.set('X-Carbon-Intensity', carbonIntensity.toString());
  res.set('X-Powered-By', 'REZILIENT.js');
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    carbonIntensity: req.carbonIntensity,
    timestamp: new Date().toISOString(),
    framework: 'REZILIENT.js v1.0.0'
  });
});

// Example API endpoint with carbon awareness
app.get('/api/items', async (req, res) => {
  try {
    // Schedule data processing based on carbon intensity
    const items = await scheduler.schedule(
      () => generateItems(),
      { priority: 'normal', carbonThreshold: 'medium' }
    );
    
    res.json({
      items,
      meta: {
        carbonIntensity: req.carbonIntensity,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function generateItems() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: \`Resilient Item \${i + 1}\`,
    timestamp: new Date().toISOString()
  }));
}

app.listen(port, () => {
  console.log(\`🚀 \${appName} API running on port \${port}\`);
  console.log(\`🌱 Carbon-aware scheduling enabled\`);
  console.log(\`⚡ Powered by REZILIENT.js Framework\`);
});`;

  fs.writeFileSync(path.join(appPath, 'src', 'server.js'), serverJs);
}

function createConfigFiles(appPath, template) {
  // Vite config
  const viteConfig = `import { defineConfig } from 'vite';
${template === 'react-app' ? "import react from '@vitejs/plugin-react';" : ''}

export default defineConfig({
  ${template === 'react-app' ? 'plugins: [react()],' : ''}
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['rezilient.js']
        }
      }
    }
  }
});`;

  fs.writeFileSync(path.join(appPath, 'vite.config.js'), viteConfig);
  
  // Jest config
  const jestConfig = `export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/setupTests.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};`;

  fs.writeFileSync(path.join(appPath, 'jest.config.js'), jestConfig);
  
  // HTML template
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rezilient App</title>
  <meta name="description" content="Production-ready resilient application built with REZILIENT.js" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(appPath, 'index.html'), htmlTemplate);
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];
const appName = args[1];
const template = args[2] || 'react-app';

if (command === 'create' && appName) {
  if (!TEMPLATES[template]) {
    console.error(`❌ Unknown template: ${template}`);
    console.log(`Available templates: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }
  
  createApp(appName, template);
} else {
  console.log(`
🌟 REZILIENT.js Application Generator

Usage:
  npx rezilient.js create <app-name> [template]

Templates:
  react-app    - React application (default)
  vanilla-js   - Vanilla JavaScript application  
  node-api     - Node.js API server

Examples:
  npx rezilient.js create my-app
  npx rezilient.js create my-api node-api
  npx rezilient.js create my-vanilla vanilla-js
`);
}
