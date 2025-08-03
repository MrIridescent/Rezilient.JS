# 🚀 Installation Guide

Welcome to Aether.js! This guide will help you install and set up the revolutionary JavaScript framework.

## 📋 Prerequisites

Before installing Aether.js, ensure you have:

- **Node.js 16.0+** (LTS recommended)
- **npm 8.0+** or **yarn 1.22+**
- **Modern browser** with ES6+ support
- **Git** (for development)

### Check Your Environment

```bash
# Check Node.js version
node --version
# Should output v16.0.0 or higher

# Check npm version
npm --version
# Should output 8.0.0 or higher

# Check if modern JavaScript features are supported
node -e "console.log('ES6 modules supported:', typeof import !== 'undefined')"
```

## 🎯 Quick Installation

### Option 1: Using create-aether-app (Recommended)

The fastest way to get started with Aether.js:

```bash
# Install the CLI globally
npm install -g @aether/cli

# Create a new application
create-aether-app my-aether-app

# Navigate to your project
cd my-aether-app

# Start development server
aether dev
```

### Option 2: Manual Installation

For existing projects or custom setups:

```bash
# Install the core framework
npm install @aether/framework

# Install CLI tools (optional)
npm install --save-dev @aether/cli
```

### Option 3: CDN Installation

For quick prototyping or simple projects:

```html
<!-- Latest version -->
<script type="module">
  import { AetherComponent, PersistentStore } from 'https://cdn.jsdelivr.net/npm/@aether/framework@latest/dist/aether.esm.js';
</script>

<!-- Specific version (recommended for production) -->
<script type="module">
  import { AetherComponent } from 'https://cdn.jsdelivr.net/npm/@aether/framework@2.0.0/dist/aether.esm.js';
</script>
```

## 🔧 Installation Options

### Core Framework Only

For minimal installations where you only need the core features:

```bash
npm install @aether/framework
```

**Includes:**
- AetherComponent base class
- PersistentStore for data management
- SyncEngine for offline synchronization
- Event system and hooks
- Basic caching and networking

### Full Revolutionary Suite

For applications that want to leverage all revolutionary features:

```bash
# Install with all revolutionary features
npm install @aether/framework @aether/ai @aether/quantum @aether/biometric @aether/spatial @aether/neuromorphic @aether/edge-ai

# Or use the meta-package
npm install @aether/revolutionary
```

**Includes:**
- All core framework features
- AI-powered code generation and optimization
- Quantum-ready cryptography
- Biometric awareness and health integration
- Spatial computing with AR/VR/MR support
- Neuromorphic computing capabilities
- Edge AI and machine learning

### Development Tools

For the complete development experience:

```bash
# Install CLI and development tools
npm install -g @aether/cli
npm install --save-dev @aether/dev-tools @aether/testing @aether/build-tools
```

**Includes:**
- CLI for project scaffolding and management
- Development server with hot reload
- Build tools and optimization
- Testing utilities and frameworks
- Debugging and profiling tools

## 🌟 Revolutionary Features Setup

### AI-Powered Framework

```bash
# Install AI capabilities
npm install @aether/ai @tensorflow/tfjs

# Enable in your application
import { AetherAI } from '@aether/framework';

const ai = new AetherAI({
  enableCodeGeneration: true,
  enablePerformanceOptimization: true,
  aiModel: 'aether-standard'
});
```

### Quantum-Ready Security

```bash
# Install quantum cryptography
npm install @aether/quantum

# Enable quantum-safe features
import { QuantumReady } from '@aether/framework';

const quantum = new QuantumReady({
  enablePostQuantumCrypto: true,
  quantumSafeLevel: 'standard'
});
```

### Biometric Awareness

```bash
# Install biometric capabilities
npm install @aether/biometric

# Enable health and wellness features
import { BiometricAware } from '@aether/framework';

const biometric = new BiometricAware({
  enableHeartRateMonitoring: true,
  enableStressDetection: true,
  privacyLevel: 'high'
});
```

### Spatial Computing

```bash
# Install spatial computing
npm install @aether/spatial three

# Enable AR/VR/MR features
import { SpatialComputing } from '@aether/framework';

const spatial = new SpatialComputing({
  enableVR: true,
  enableAR: true,
  enableMixedReality: true
});
```

## 🔍 Verification

After installation, verify everything is working correctly:

### 1. Check Installation

```bash
# Check if Aether CLI is installed
aether --version

# Check if framework is available
node -e "console.log(require('@aether/framework'))"
```

### 2. Create Test Project

```bash
# Create a test project
create-aether-app test-installation --template basic

# Navigate and test
cd test-installation
aether dev --port 3001
```

### 3. Browser Test

Open your browser to `http://localhost:3001` and verify:
- ✅ Application loads without errors
- ✅ Console shows "Aether.js App Starting..."
- ✅ Network tab shows framework files loading
- ✅ No JavaScript errors in console

## 🐛 Troubleshooting

### Common Issues

#### Node.js Version Issues
```bash
# If you have an older Node.js version
# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18 LTS
nvm install 18
nvm use 18
```

#### Permission Issues (macOS/Linux)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use a Node version manager (recommended)
```

#### Windows PowerShell Issues
```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or use Command Prompt instead of PowerShell
```

#### Module Resolution Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

If you encounter issues:

1. **Check the [FAQ](../support/faq.md)**
2. **Search [GitHub Issues](https://github.com/aether-framework/aether/issues)**
3. **Join our [Discord Community](https://discord.gg/aether-js)**
4. **Create a [Bug Report](https://github.com/aether-framework/aether/issues/new)**

## 🎯 Next Steps

Now that you have Aether.js installed:

1. **[Quick Start Tutorial](./quick-start.md)** - Build your first app in 5 minutes
2. **[Core Concepts](./core-concepts.md)** - Understand the framework fundamentals
3. **[Your First App](./first-app.md)** - Create a complete application
4. **[Revolutionary Features](../revolutionary/)** - Explore industry-first capabilities

## 📊 Installation Analytics

Aether.js respects your privacy. Installation analytics are:
- ✅ **Anonymous** - No personal data collected
- ✅ **Minimal** - Only basic usage statistics
- ✅ **Opt-out** - Can be disabled with `aether analytics disable`
- ✅ **Transparent** - View data with `aether analytics show`

---

**Ready to build revolutionary applications? Let's get started! 🚀**
