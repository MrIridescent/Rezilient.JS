import express from 'express';
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
    name: `Resilient Item ${i + 1}`,
    timestamp: new Date().toISOString()
  }));
}

app.listen(port, () => {
  console.log(`🚀 ${appName} API running on port ${port}`);
  console.log(`🌱 Carbon-aware scheduling enabled`);
  console.log(`⚡ Powered by REZILIENT.js Framework`);
});