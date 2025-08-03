// src/commands/create.js

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import spawn from 'cross-spawn';
import validateProjectName from 'validate-npm-package-name';

/**
 * Create a new Resilient.js application
 */
export async function createApp(projectName, options = {}) {
  console.log(chalk.cyan('\n🚀 Creating Resilient.js application...\n'));
  
  // Validate project name
  const validation = validateProjectName(projectName);
  if (!validation.validForNewPackages) {
    console.error(chalk.red('Invalid project name:'));
    validation.errors?.forEach(error => console.error(chalk.red(`  • ${error}`)));
    validation.warnings?.forEach(warning => console.error(chalk.yellow(`  • ${warning}`)));
    process.exit(1);
  }

  const projectPath = path.resolve(projectName);
  
  // Check if directory exists
  if (fs.existsSync(projectPath)) {
    console.error(chalk.red(`Directory ${projectName} already exists.`));
    process.exit(1);
  }

  const spinner = ora('Creating project structure...').start();
  
  try {
    // Create project directory
    await fs.ensureDir(projectPath);
    
    // Generate project files based on template
    await generateProjectFiles(projectPath, projectName, options);
    
    spinner.succeed('Project structure created');
    
    // Install dependencies
    if (!options.skipInstall) {
      await installDependencies(projectPath, options);
    }
    
    // Show success message
    showSuccessMessage(projectName, options);
    
  } catch (error) {
    spinner.fail('Failed to create project');
    console.error(chalk.red(error.message));
    
    // Cleanup on failure
    if (fs.existsSync(projectPath)) {
      await fs.remove(projectPath);
    }
    
    process.exit(1);
  }
}

/**
 * Generate project files based on template
 */
async function generateProjectFiles(projectPath, projectName, options) {
  const template = options.template || 'basic';
  const features = options.features || [];
  
  // Package.json
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'aether dev',
      build: 'aether build',
      preview: 'aether preview',
      test: 'jest',
      lint: 'eslint src/**/*.js'
    },
    dependencies: {
      '@aether/framework': '^2.0.0-alpha.1'
    },
    devDependencies: {
      '@aether/cli': '^2.0.0-alpha.1',
      'jest': '^29.0.0',
      'eslint': '^8.0.0'
    }
  };
  
  // Add revolutionary features
  if (features.includes('ai') || options.ai) {
    packageJson.dependencies['@tensorflow/tfjs'] = '^4.0.0';
  }
  
  if (features.includes('spatial') || options.spatial) {
    packageJson.dependencies['three'] = '^0.150.0';
  }
  
  if (options.typescript) {
    packageJson.devDependencies['typescript'] = '^4.9.0';
    packageJson.devDependencies['@types/node'] = '^18.0.0';
  }
  
  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
  
  // Generate main application files
  await generateAppFiles(projectPath, template, options);
  
  // Generate configuration files
  await generateConfigFiles(projectPath, options);
  
  // Generate documentation
  await generateDocs(projectPath, projectName, options);
}

/**
 * Generate main application files
 */
async function generateAppFiles(projectPath, template, options) {
  const srcPath = path.join(projectPath, 'src');
  await fs.ensureDir(srcPath);
  
  // Main application file
  const mainApp = generateMainApp(template, options);
  const extension = options.typescript ? 'ts' : 'js';
  await fs.writeFile(path.join(srcPath, `main.${extension}`), mainApp);
  
  // HTML template
  const htmlTemplate = generateHTMLTemplate(template, options);
  await fs.writeFile(path.join(projectPath, 'index.html'), htmlTemplate);
  
  // CSS styles
  const cssStyles = generateCSSStyles(template, options);
  await fs.writeFile(path.join(srcPath, 'styles.css'), cssStyles);
  
  // Generate template-specific files
  switch (template) {
    case 'enterprise':
      await generateEnterpriseFiles(srcPath, options);
      break;
    case 'pwa':
      await generatePWAFiles(projectPath, options);
      break;
    case 'spatial':
      await generateSpatialFiles(srcPath, options);
      break;
    case 'ai':
      await generateAIFiles(srcPath, options);
      break;
    case 'research':
      await generateResearchFiles(srcPath, options);
      break;
    default:
      await generateBasicFiles(srcPath, options);
  }
}

/**
 * Generate main application code
 */
function generateMainApp(template, options) {
  // Only use production-ready features
  let imports = `import { AetherStore, PersistentStore, SyncEngine, AetherComponent } from 'resilient.js';\n`;

  if (options.react) {
    imports += `import { useAetherStore, useSyncEngine } from 'resilient.js/react';\n`;
  }

  if (options.carbonAware) {
    imports += `import { CarbonAwareScheduler } from 'resilient.js';\n`;
  }
  
  let appClass = `
class App extends AetherComponent {
  constructor() {
    super({
      autoSync: true,
      syncOnOnline: true,
      trackSyncState: true
    });
    
    // Initialize data store
    this.store = new PersistentStore('app-data', {
      message: 'Hello, Aether.js!',
      count: 0
    });
    
    // Initialize sync engine
    this.syncEngine = new SyncEngine();
    this.connectSyncEngine(this.syncEngine);
    
    ${hasRevolutionary ? this.generateRevolutionaryInit(features, options) : ''}
    
    this.init();
  }
  
  async init() {
    console.log('🚀 Aether.js App Starting...');
    
    // Subscribe to store changes
    this.store.subscribe((data) => {
      this.render(data);
    });
    
    // Initial render
    this.render(this.store.get());
    
    console.log('✅ App Ready!');
  }
  
  render(data) {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = \`
      <div class="aether-app">
        <header class="app-header">
          <h1>⚡ Aether.js Application</h1>
          <p class="subtitle">Revolutionary JavaScript Framework</p>
        </header>
        
        <main class="app-main">
          <div class="card">
            <h2>\${data.message}</h2>
            <p>Count: <span class="count">\${data.count}</span></p>
            <button onclick="app.increment()">Increment</button>
            <button onclick="app.reset()">Reset</button>
          </div>
          
          <div class="status">
            <div class="status-item">
              <span class="label">Network:</span>
              <span class="value \${this.getNetworkState().isOnline ? 'online' : 'offline'}">
                \${this.getNetworkState().isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div class="status-item">
              <span class="label">Sync:</span>
              <span class="value">\${this.getSyncState().status}</span>
            </div>
          </div>
          
          ${hasRevolutionary ? this.generateRevolutionaryUI(features, options) : ''}
        </main>
      </div>
    \`;
  }
  
  increment() {
    this.store.update(data => ({
      ...data,
      count: data.count + 1
    }));
  }
  
  reset() {
    this.store.update(data => ({
      ...data,
      count: 0
    }));
  }
  
  // Lifecycle hooks
  onOnline() {
    console.log('📶 Back online!');
    this.render(this.store.get());
  }
  
  onOffline() {
    console.log('📱 Working offline');
    this.render(this.store.get());
  }
  
  onSyncStateChange(state) {
    console.log('🔄 Sync state:', state.status);
    this.render(this.store.get());
  }
}

// Initialize app
const app = new App();
window.app = app; // Make available globally for demo
`;

  return imports + appClass;
}

/**
 * Generate HTML template
 */
function generateHTMLTemplate(template, options) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aether.js App</title>
  <link rel="stylesheet" href="src/styles.css">
  ${options.pwa ? '<link rel="manifest" href="manifest.json">' : ''}
</head>
<body>
  <div id="app">
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading Aether.js...</p>
    </div>
  </div>
  
  <script type="module" src="src/main.js"></script>
  ${options.pwa ? '<script>if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js");}</script>' : ''}
</body>
</html>`;
}

/**
 * Generate CSS styles
 */
function generateCSSStyles(template, options) {
  return `/* Aether.js Application Styles */

:root {
  --primary-color: #667eea;
  --primary-dark: #5a67d8;
  --accent-color: #38a169;
  --bg-primary: #ffffff;
  --bg-secondary: #f7fafc;
  --text-primary: #2d3748;
  --text-secondary: #4a5568;
  --border-color: #e2e8f0;
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.6;
}

.aether-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--bg-primary);
  padding: 2rem;
  text-align: center;
  box-shadow: var(--shadow);
}

.app-header h1 {
  color: var(--primary-color);
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.card {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
  margin-bottom: 2rem;
  text-align: center;
}

.card h2 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.count {
  font-weight: bold;
  color: var(--accent-color);
  font-size: 1.2rem;
}

button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  margin: 0.5rem;
  transition: background-color 0.2s;
}

button:hover {
  background: var(--primary-dark);
}

.status {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.label {
  font-weight: 600;
  color: var(--text-secondary);
}

.value {
  font-weight: 500;
}

.value.online {
  color: var(--accent-color);
}

.value.offline {
  color: #e53e3e;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive design */
@media (max-width: 768px) {
  .app-header {
    padding: 1.5rem;
  }
  
  .app-header h1 {
    font-size: 2rem;
  }
  
  .app-main {
    padding: 1rem;
  }
  
  .card {
    padding: 1.5rem;
  }
}`;
}

/**
 * Install dependencies
 */
async function installDependencies(projectPath, options) {
  const spinner = ora('Installing dependencies...').start();
  
  try {
    const useYarn = !options.useNpm && hasYarn();
    const command = useYarn ? 'yarn' : 'npm';
    const args = useYarn ? [] : ['install'];
    
    const result = spawn.sync(command, args, {
      cwd: projectPath,
      stdio: 'pipe'
    });
    
    if (result.status !== 0) {
      throw new Error(`${command} install failed`);
    }
    
    spinner.succeed('Dependencies installed');
  } catch (error) {
    spinner.fail('Failed to install dependencies');
    console.log(chalk.yellow('You can install them manually by running:'));
    console.log(chalk.cyan(`  cd ${path.basename(projectPath)}`));
    console.log(chalk.cyan('  npm install'));
  }
}

/**
 * Check if yarn is available
 */
function hasYarn() {
  try {
    spawn.sync('yarn', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Show success message
 */
function showSuccessMessage(projectName, options) {
  console.log(chalk.green('\n✅ Success! Created Aether.js application\n'));
  
  console.log('Inside that directory, you can run several commands:\n');
  console.log(chalk.cyan('  aether dev'));
  console.log('    Starts the development server\n');
  console.log(chalk.cyan('  aether build'));
  console.log('    Builds the app for production\n');
  console.log(chalk.cyan('  aether deploy'));
  console.log('    Deploys the app\n');
  
  console.log('We suggest that you begin by typing:\n');
  console.log(chalk.cyan(`  cd ${projectName}`));
  console.log(chalk.cyan('  aether dev\n'));
  
  if (options.features?.length > 0 || options.revolutionary) {
    console.log(chalk.yellow('🌟 Revolutionary features enabled:'));
    const features = options.features || [];
    if (features.includes('ai')) console.log('  🧠 AI-Powered Framework');
    if (features.includes('quantum')) console.log('  🔮 Quantum-Ready Security');
    if (features.includes('biometric')) console.log('  🫀 Biometric Awareness');
    if (features.includes('spatial')) console.log('  🥽 Spatial Computing');
    console.log();
  }
  
  console.log(chalk.cyan('Happy coding with Aether.js! ⚡\n'));
}

// Helper functions for generating template-specific files
function generateRevolutionaryInit(features, options) {
  return `
    // Initialize revolutionary features
    this.revolutionary = new AetherRevolutionary({
      enableAI: ${features.includes('ai')},
      enableQuantum: ${features.includes('quantum')},
      enableBiometric: ${features.includes('biometric')},
      enableSpatial: ${features.includes('spatial')},
      enableNeuromorphic: ${features.includes('neuromorphic')},
      enableEdgeAI: ${features.includes('edge-ai')},
      enableCarbonAware: ${features.includes('carbon')}
    });`;
}

function generateRevolutionaryUI(features, options) {
  return `
          <div class="revolutionary-features">
            <h3>🌟 Revolutionary Features</h3>
            <div class="feature-status">
              ${features.map(feature => `
                <div class="feature-item">
                  <span class="feature-name">${getFeatureName(feature)}</span>
                  <span class="feature-status active">Active</span>
                </div>
              `).join('')}
            </div>
          </div>`;
}

function getFeatureName(feature) {
  const names = {
    ai: '🧠 AI-Powered',
    quantum: '🔮 Quantum-Ready',
    biometric: '🫀 Biometric-Aware',
    spatial: '🥽 Spatial Computing',
    neuromorphic: '🧠 Neuromorphic',
    'edge-ai': '🤖 Edge AI',
    carbon: '🌱 Carbon-Aware'
  };
  return names[feature] || feature;
}

async function generateBasicFiles(srcPath, options) {
  // Basic template files
}

async function generateEnterpriseFiles(srcPath, options) {
  // Enterprise template files
}

async function generatePWAFiles(projectPath, options) {
  // PWA manifest and service worker
}

async function generateSpatialFiles(srcPath, options) {
  // Spatial computing files
}

async function generateAIFiles(srcPath, options) {
  // AI-powered files
}

async function generateResearchFiles(srcPath, options) {
  // Research template with all features
}

async function generateConfigFiles(projectPath, options) {
  // Configuration files (eslint, jest, etc.)
}

async function generateDocs(projectPath, projectName, options) {
  // README and documentation
  const readme = `# ${projectName}

A revolutionary Aether.js application.

## Getting Started

\`\`\`bash
# Start development server
aether dev

# Build for production
aether build

# Deploy
aether deploy
\`\`\`

## Features

- ⚡ Offline-first architecture
- 🔄 Intelligent synchronization
- 📱 Progressive Web App
${options.features?.map(f => `- ${getFeatureName(f)}`).join('\n') || ''}

## Learn More

- [Aether.js Documentation](https://aether-framework.dev)
- [Revolutionary Features Guide](https://aether-framework.dev/revolutionary)
`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readme);
}
