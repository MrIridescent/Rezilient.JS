import { NextRequest, NextResponse } from 'next/server';
import { CarbonAwareScheduler, AetherPrinciples } from 'rezilient.js';

// Initialize REZILIENT.js for API
const scheduler = new CarbonAwareScheduler();
const principles = new AetherPrinciples();

export async function GET(request: NextRequest) {
  try {
    // Get current carbon intensity
    const carbonIntensity = await scheduler.getCurrentCarbonIntensity();
    
    // Schedule data processing based on carbon intensity
    const items = await scheduler.schedule(
      () => generateItems(),
      { priority: 'normal', carbonThreshold: 'medium' }
    );
    
    // Add carbon-aware headers
    const response = NextResponse.json({
      items,
      meta: {
        carbonIntensity,
        processedAt: new Date().toISOString(),
        framework: 'REZILIENT.js Next.js API',
        sustainabilityScore: calculateSustainabilityScore(carbonIntensity)
      }
    });
    
    response.headers.set('X-Carbon-Intensity', carbonIntensity.toString());
    response.headers.set('X-Powered-By', 'REZILIENT.js');
    response.headers.set('X-Sustainability-Score', calculateSustainabilityScore(carbonIntensity).toString());
    
    return response;
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const carbonIntensity = await scheduler.getCurrentCarbonIntensity();
    
    // Process data with carbon-aware scheduling
    const result = await scheduler.schedule(
      () => processData(body),
      { priority: body.priority || 'normal', carbonThreshold: 'medium' }
    );
    
    const response = NextResponse.json({
      success: true,
      result,
      meta: {
        carbonIntensity,
        processedAt: new Date().toISOString()
      }
    });
    
    response.headers.set('X-Carbon-Intensity', carbonIntensity.toString());
    response.headers.set('X-Powered-By', 'REZILIENT.js');
    
    return response;
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

function generateItems() {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `REZILIENT Item ${i + 1}`,
    description: `Carbon-aware generated item with sustainability features`,
    timestamp: new Date().toISOString(),
    carbonFootprint: Math.random() * 100,
    sustainabilityRating: Math.floor(Math.random() * 5) + 1
  }));
}

function processData(data: any) {
  // Simulate data processing with sustainability metrics
  return {
    processed: true,
    inputSize: JSON.stringify(data).length,
    processingTime: Math.random() * 100,
    energyUsed: Math.random() * 10,
    carbonSaved: Math.random() * 5
  };
}

function calculateSustainabilityScore(carbonIntensity: number): number {
  // Calculate sustainability score based on carbon intensity
  if (carbonIntensity < 200) return 95;
  if (carbonIntensity < 300) return 85;
  if (carbonIntensity < 400) return 75;
  if (carbonIntensity < 500) return 65;
  return 50;
}
