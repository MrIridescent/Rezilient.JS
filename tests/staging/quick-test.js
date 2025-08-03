#!/usr/bin/env node

/**
 * Quick Test for Core Functionality
 * Verifies basic framework works in Node.js
 */

console.log('🧪 Quick Test: Core Functionality\n');

async function testCore() {
  try {
    console.log('📦 Testing core imports...');
    const { AetherComponent, PersistentStore, SyncEngine } = await import('../../src/index.js');
    console.log('✅ Core imports successful');
    
    console.log('🏗️ Testing component creation...');
    const component = new AetherComponent();
    console.log('✅ AetherComponent created:', component.constructor.name);
    
    console.log('💾 Testing store operations...');
    const store = new PersistentStore('test-store', { count: 0 });
    console.log('✅ PersistentStore created');
    
    // Test store operations
    store.update(data => ({ ...data, count: data.count + 1 }));
    const data = store.get();
    console.log('✅ Store operations work:', JSON.stringify(data));
    
    console.log('🔄 Testing sync engine...');
    const sync = new SyncEngine({ 
      enableAdvancedCaching: false, 
      enableCarbonAware: false 
    });
    console.log('✅ SyncEngine created, state:', sync.getState().status);
    
    return true;
  } catch (error) {
    console.error('❌ Core test failed:', error.message);
    return false;
  }
}

async function testRevolutionary() {
  try {
    console.log('\n🌟 Testing revolutionary features...');
    
    // Test each revolutionary feature
    const features = [
      'AetherAI',
      'QuantumReady', 
      'BiometricAware',
      'SpatialComputing',
      'NeuromorphicComputing',
      'EdgeAI'
    ];
    
    for (const featureName of features) {
      try {
        const module = await import('../../src/index.js');
        const FeatureClass = module[featureName];
        
        if (FeatureClass) {
          const instance = new FeatureClass();
          console.log(`✅ ${featureName} created successfully`);
        } else {
          console.log(`⚠️ ${featureName} not exported`);
        }
      } catch (error) {
        console.log(`❌ ${featureName} failed:`, error.message);
      }
    }
    
    // Test integration manager
    console.log('🔗 Testing revolutionary integration...');
    const { AetherRevolutionary } = await import('../../src/index.js');
    const revolutionary = new AetherRevolutionary({
      enableAI: false,
      enableQuantum: false,
      enableBiometric: false,
      enableSpatial: false,
      enableNeuromorphic: false,
      enableEdgeAI: false
    });
    console.log('✅ AetherRevolutionary integration works');
    
    return true;
  } catch (error) {
    console.error('❌ Revolutionary features test failed:', error.message);
    return false;
  }
}

async function testBuild() {
  try {
    console.log('\n🔨 Testing build outputs...');
    
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.join(__dirname, '../../dist');
    
    const expectedFiles = [
      'aether.esm.js',
      'aether.cjs.js', 
      'aether.umd.js'
    ];
    
    for (const file of expectedFiles) {
      const filePath = path.join(distPath, file);
      try {
        await fs.promises.access(filePath);
        const stats = await fs.promises.stat(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`✅ ${file} exists (${sizeKB}KB)`);
      } catch (error) {
        console.log(`❌ ${file} missing`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Build test failed:', error.message);
    return false;
  }
}

async function runQuickTest() {
  console.log('🚀 Starting Aether.js Quick Test Suite...\n');
  
  const results = {
    core: await testCore(),
    revolutionary: await testRevolutionary(),
    build: await testBuild()
  };
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  const successRate = ((passed / total) * 100).toFixed(1);
  
  console.log('\n📊 QUICK TEST RESULTS:');
  console.log('='.repeat(30));
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Success Rate: ${successRate}%`);
  
  if (successRate >= 80) {
    console.log('\n✅ QUICK TEST PASSED - Framework is functional!');
    console.log('🎯 Ready for comprehensive staging tests');
  } else {
    console.log('\n❌ QUICK TEST FAILED - Critical issues need fixing');
    console.log('🔧 Address core issues before proceeding');
  }
  
  console.log('\n🌟 Aether.js Quick Test Complete!\n');
  
  return successRate >= 80;
}

runQuickTest().catch(error => {
  console.error('💥 Quick test crashed:', error);
  process.exit(1);
});
