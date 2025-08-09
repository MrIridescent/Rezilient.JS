'use client';

import { useState, useEffect } from 'react';
import { AetherComponent, useAetherStore, CarbonAwareScheduler } from 'rezilient.js';

export default function HomePage() {
  const [carbonIntensity, setCarbonIntensity] = useState(0);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const store = useAetherStore();

  useEffect(() => {
    // Initialize carbon-aware monitoring
    const scheduler = new CarbonAwareScheduler();
    
    const updateCarbonIntensity = async () => {
      const intensity = await scheduler.getCurrentCarbonIntensity();
      setCarbonIntensity(intensity);
    };

    updateCarbonIntensity();
    const interval = setInterval(updateCarbonIntensity, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const scheduler = new CarbonAwareScheduler();
      
      const response = await scheduler.schedule(
        () => fetch('/api/items'),
        { priority: 'normal', carbonThreshold: 'medium' }
      );
      
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🌟 REZILIENT.js Next.js App
          </h1>
          <p className="text-lg text-gray-600">
            Production-ready application with revolutionary features
          </p>
        </header>

        {/* Carbon Intensity Monitor */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                🌱 Carbon-Aware Computing
              </h3>
              <p className="text-green-600">
                Current grid carbon intensity: {carbonIntensity} gCO2/kWh
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              carbonIntensity < 300 ? 'bg-green-100 text-green-800' :
              carbonIntensity < 500 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {carbonIntensity < 300 ? 'Low' : carbonIntensity < 500 ? 'Medium' : 'High'}
            </div>
          </div>
        </div>

        {/* Revolutionary Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <FeatureCard
            icon="🌱"
            title="Carbon-Aware Computing"
            description="Automatically optimizes operations based on grid carbon intensity"
            status="Active"
          />
          <FeatureCard
            icon="🧠"
            title="AI-Bias Detection"
            description="Built-in fairness metrics and bias detection for AI systems"
            status="Monitoring"
          />
          <FeatureCard
            icon="🔄"
            title="Self-Healing Architecture"
            description="Automatic error recovery and circuit breaker patterns"
            status="Ready"
          />
          <FeatureCard
            icon="📱"
            title="Offline-First Design"
            description="Seamless online/offline transitions with intelligent sync"
            status="Enabled"
          />
          <FeatureCard
            icon="⚡"
            title="Quantum-Ready Patterns"
            description="Future-proof architecture for quantum computing integration"
            status="Prepared"
          />
          <FeatureCard
            icon="♿"
            title="Accessibility-First"
            description="WCAG 2.1 AAA compliance built into every component"
            status="Compliant"
          />
        </div>

        {/* Data Loading Demo */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              📊 Carbon-Aware Data Loading
            </h3>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load Data'}
            </button>
          </div>
          
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.timestamp}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="text-center mt-8 text-gray-600">
          <p>Powered by REZILIENT.js v1.0.0 - The Future of Resilient Computing</p>
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description, status }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
        {status}
      </span>
    </div>
  );
}
