import React from 'react';
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
);