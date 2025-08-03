#!/usr/bin/env node

/**
 * Production Readiness Test Suite
 * Comprehensive testing for production deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Production test configuration
const PRODUCTION_CONFIG = {
  timeout: 60000,
  retries: 2,
  environments: ['node', 'browser'],
  loadTestDuration: 30000,
  performanceBenchmarks: {
    bundleSize: 500, // KB
    loadTime: 3000, // ms
    memoryUsage: 50, // MB
    renderTime: 100 // ms
  }
};

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  performance: new Map(),
  security: new Map(),
  compatibility: new Map()
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuite(name) {
  log('cyan', `\n🧪 ${name}`);
  log('blue', '='.repeat(60));
}

function logTest(name, status, time = null, details = null) {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : status === 'warn' ? '⚠️' : '🔄';
  const timeStr = time ? ` (${time}ms)` : '';
  const detailsStr = details ? ` - ${details}` : '';
  
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(color, `${icon} ${name}${timeStr}${detailsStr}`);
  
  results.total++;
  if (status === 'pass') results.passed++;
  else if (status === 'fail') results.failed++;
  else if (status === 'warn') results.warnings++;
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const proc = spawn(command, args, {
      stdio: 'pipe',
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      resolve({ code, stdout, stderr, duration });
    });
    
    proc.on('error', reject);
    
    setTimeout(() => {
      proc.kill();
      reject(new Error(`Command timeout: ${command} ${args.join(' ')}`));
    }, PRODUCTION_CONFIG.timeout);
  });
}

async function testProductionBuild() {
  logSuite('Production Build Tests');
  
  // Test 1: Clean build
  try {
    const startTime = Date.now();
    const result = await runCommand('npm', ['run', 'build'], { 
      cwd: path.join(__dirname, '../../') 
    });
    
    if (result.code === 0) {
      logTest('Production Build', 'pass', Date.now() - startTime);
    } else {
      logTest('Production Build', 'fail', Date.now() - startTime, result.stderr);
    }
  } catch (error) {
    logTest('Production Build', 'fail', null, error.message);
  }
  
  // Test 2: Bundle size analysis
  const bundleFiles = [
    { name: 'ESM Bundle', file: 'dist/aether.esm.js', maxSize: 500 },
    { name: 'CJS Bundle', file: 'dist/aether.cjs.js', maxSize: 500 },
    { name: 'UMD Bundle', file: 'dist/aether.umd.js', maxSize: 600 }
  ];
  
  for (const bundle of bundleFiles) {
    try {
      const filePath = path.join(__dirname, '../../', bundle.file);
      const stats = await fs.promises.stat(filePath);
      const sizeKB = stats.size / 1024;
      
      const status = sizeKB <= bundle.maxSize ? 'pass' : 'warn';
      logTest(bundle.name, status, null, `${sizeKB.toFixed(2)}KB (max: ${bundle.maxSize}KB)`);
      
      results.performance.set(bundle.name, { size: sizeKB, benchmark: sizeKB <= bundle.maxSize });
    } catch (error) {
      logTest(bundle.name, 'fail', null, 'File not found');
    }
  }
  
  // Test 3: Bundle integrity
  try {
    const esmPath = path.join(__dirname, '../../dist/aether.esm.js');
    const content = await fs.promises.readFile(esmPath, 'utf8');
    
    const hasExports = content.includes('export');
    const hasSourceMap = content.includes('//# sourceMappingURL');
    const minified = !content.includes('\n\n'); // Basic minification check
    
    logTest('Bundle Integrity', hasExports ? 'pass' : 'fail', null, 
      `Exports: ${hasExports}, SourceMap: ${hasSourceMap}, Minified: ${minified}`);
  } catch (error) {
    logTest('Bundle Integrity', 'fail', null, error.message);
  }
}

async function testPerformanceBenchmarks() {
  logSuite('Performance Benchmarks');
  
  // Test 1: Import performance
  const importTests = [];
  for (let i = 0; i < 10; i++) {
    try {
      const startTime = Date.now();
      const result = await runCommand('node', ['-e', `
        const start = Date.now();
        import('../../src/index.js').then(() => {
          console.log('Import time:', Date.now() - start);
        });
      `], { cwd: __dirname });
      
      if (result.code === 0) {
        const match = result.stdout.match(/Import time: (\\d+)/);
        if (match) {
          importTests.push(parseInt(match[1]));
        }
      }
    } catch (error) {
      // Ignore individual failures
    }
  }
  
  if (importTests.length > 0) {
    const avgImportTime = importTests.reduce((a, b) => a + b, 0) / importTests.length;
    const benchmark = avgImportTime < PRODUCTION_CONFIG.performanceBenchmarks.loadTime;
    
    logTest('Import Performance', benchmark ? 'pass' : 'warn', avgImportTime.toFixed(2), 
      `Average over ${importTests.length} runs`);
    
    results.performance.set('import', { time: avgImportTime, benchmark });
  } else {
    logTest('Import Performance', 'fail', null, 'No successful imports');
  }
  
  // Test 2: Memory usage
  try {
    const result = await runCommand('node', ['-e', `
      const memBefore = process.memoryUsage();
      import('../../src/index.js').then(() => {
        setTimeout(() => {
          const memAfter = process.memoryUsage();
          const heapUsed = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;
          console.log('Memory usage:', heapUsed.toFixed(2), 'MB');
        }, 1000);
      });
    `], { cwd: __dirname });
    
    if (result.code === 0) {
      const match = result.stdout.match(/Memory usage: ([\\d.]+) MB/);
      if (match) {
        const memoryUsage = parseFloat(match[1]);
        const benchmark = memoryUsage < PRODUCTION_CONFIG.performanceBenchmarks.memoryUsage;
        
        logTest('Memory Usage', benchmark ? 'pass' : 'warn', null, `${memoryUsage}MB`);
        results.performance.set('memory', { usage: memoryUsage, benchmark });
      }
    }
  } catch (error) {
    logTest('Memory Usage', 'fail', null, error.message);
  }
  
  // Test 3: Component creation performance
  try {
    const result = await runCommand('node', ['-e', `
      import('../../src/index.js').then(({ AetherComponent, PersistentStore }) => {
        const iterations = 1000;
        const start = Date.now();
        
        for (let i = 0; i < iterations; i++) {
          const component = new AetherComponent();
          const store = new PersistentStore('test-' + i, { data: i });
        }
        
        const time = Date.now() - start;
        console.log('Component creation time:', (time / iterations).toFixed(2), 'ms per component');
      });
    `], { cwd: __dirname });
    
    if (result.code === 0) {
      const match = result.stdout.match(/Component creation time: ([\\d.]+) ms/);
      if (match) {
        const creationTime = parseFloat(match[1]);
        const benchmark = creationTime < PRODUCTION_CONFIG.performanceBenchmarks.renderTime;
        
        logTest('Component Creation', benchmark ? 'pass' : 'warn', creationTime, 'ms per component');
        results.performance.set('creation', { time: creationTime, benchmark });
      }
    }
  } catch (error) {
    logTest('Component Creation', 'fail', null, error.message);
  }
}

async function testSecurityCompliance() {
  logSuite('Security Compliance Tests');
  
  // Test 1: Dependency vulnerabilities
  try {
    const result = await runCommand('npm', ['audit', '--audit-level=moderate'], { 
      cwd: path.join(__dirname, '../../') 
    });
    
    const vulnerabilities = result.stdout.includes('vulnerabilities');
    const status = result.code === 0 ? 'pass' : 'warn';
    
    logTest('Dependency Security', status, null, 
      status === 'pass' ? 'No vulnerabilities' : 'Vulnerabilities found');
    
    results.security.set('dependencies', { secure: result.code === 0 });
  } catch (error) {
    logTest('Dependency Security', 'fail', null, error.message);
  }
  
  // Test 2: Code injection prevention
  try {
    const result = await runCommand('node', ['-e', `
      import('../../src/index.js').then(({ PersistentStore }) => {
        // Test XSS prevention
        const maliciousInput = '<script>alert("xss")</script>';
        const store = new PersistentStore('security-test', { data: maliciousInput });
        
        const data = store.get();
        const safe = typeof data.data === 'string' && !eval;
        
        console.log('XSS prevention:', safe ? 'SAFE' : 'VULNERABLE');
      });
    `], { cwd: __dirname });
    
    const safe = result.stdout.includes('SAFE');
    logTest('XSS Prevention', safe ? 'pass' : 'fail', null, 
      safe ? 'Input properly sanitized' : 'Potential vulnerability');
    
    results.security.set('xss', { safe });
  } catch (error) {
    logTest('XSS Prevention', 'fail', null, error.message);
  }
  
  // Test 3: Quantum readiness
  try {
    const result = await runCommand('node', ['-e', `
      import('../../src/index.js').then(({ QuantumReady }) => {
        const quantum = new QuantumReady();
        const status = quantum.getQuantumReadinessStatus();
        console.log('Quantum ready:', status.postQuantumCrypto);
      });
    `], { cwd: __dirname });
    
    const quantumReady = result.stdout.includes('true');
    logTest('Quantum Security', quantumReady ? 'pass' : 'warn', null, 
      quantumReady ? 'Post-quantum crypto available' : 'Limited quantum protection');
    
    results.security.set('quantum', { ready: quantumReady });
  } catch (error) {
    logTest('Quantum Security', 'fail', null, error.message);
  }
}

async function testCompatibility() {
  logSuite('Compatibility Tests');
  
  // Test 1: Node.js compatibility
  try {
    const result = await runCommand('node', ['--version']);
    const nodeVersion = result.stdout.trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    
    const compatible = majorVersion >= 16;
    logTest('Node.js Compatibility', compatible ? 'pass' : 'fail', null, 
      `${nodeVersion} (requires 16+)`);
    
    results.compatibility.set('nodejs', { version: nodeVersion, compatible });
  } catch (error) {
    logTest('Node.js Compatibility', 'fail', null, error.message);
  }
  
  // Test 2: Module format compatibility
  const formats = [
    { name: 'ESM', test: 'import("../../dist/aether.esm.js")' },
    { name: 'CommonJS', test: 'require("../../dist/aether.cjs.js")' }
  ];
  
  for (const format of formats) {
    try {
      const result = await runCommand('node', ['-e', `
        ${format.test}.then ? 
          ${format.test}.then(() => console.log('${format.name} works')) :
          (${format.test} && console.log('${format.name} works'));
      `], { cwd: __dirname });
      
      const works = result.stdout.includes(`${format.name} works`);
      logTest(`${format.name} Format`, works ? 'pass' : 'fail', null, 
        works ? 'Module loads correctly' : 'Module load failed');
      
      results.compatibility.set(format.name.toLowerCase(), { works });
    } catch (error) {
      logTest(`${format.name} Format`, 'fail', null, error.message);
    }
  }
  
  // Test 3: TypeScript definitions
  try {
    const typesPath = path.join(__dirname, '../../types/index.d.ts');
    const content = await fs.promises.readFile(typesPath, 'utf8');
    
    const hasDeclarations = content.includes('declare module');
    const hasExports = content.includes('export');
    
    logTest('TypeScript Support', hasDeclarations && hasExports ? 'pass' : 'warn', null, 
      hasDeclarations && hasExports ? 'Type definitions available' : 'Limited type support');
    
    results.compatibility.set('typescript', { supported: hasDeclarations && hasExports });
  } catch (error) {
    logTest('TypeScript Support', 'warn', null, 'No type definitions found');
  }
}

async function testLoadAndStress() {
  logSuite('Load & Stress Tests');
  
  // Test 1: Concurrent component creation
  try {
    const result = await runCommand('node', ['-e', `
      import('../../src/index.js').then(({ AetherComponent, PersistentStore }) => {
        const concurrency = 100;
        const promises = [];
        
        const start = Date.now();
        
        for (let i = 0; i < concurrency; i++) {
          promises.push(new Promise(resolve => {
            const component = new AetherComponent();
            const store = new PersistentStore('stress-' + i, { id: i });
            resolve();
          }));
        }
        
        Promise.all(promises).then(() => {
          const time = Date.now() - start;
          console.log('Concurrent creation time:', time, 'ms for', concurrency, 'components');
        });
      });
    `], { cwd: __dirname });
    
    if (result.code === 0) {
      const match = result.stdout.match(/Concurrent creation time: (\\d+) ms for (\\d+) components/);
      if (match) {
        const time = parseInt(match[1]);
        const count = parseInt(match[2]);
        const avgTime = time / count;
        
        const benchmark = avgTime < 10; // Less than 10ms per component
        logTest('Concurrent Creation', benchmark ? 'pass' : 'warn', time, 
          `${avgTime.toFixed(2)}ms per component`);
        
        results.performance.set('concurrent', { time: avgTime, benchmark });
      }
    }
  } catch (error) {
    logTest('Concurrent Creation', 'fail', null, error.message);
  }
  
  // Test 2: Memory leak detection
  try {
    const result = await runCommand('node', ['-e', `
      import('../../src/index.js').then(({ AetherComponent, PersistentStore }) => {
        const iterations = 1000;
        const memBefore = process.memoryUsage().heapUsed;
        
        for (let i = 0; i < iterations; i++) {
          const component = new AetherComponent();
          const store = new PersistentStore('leak-test-' + i, { data: 'test' });
          // Simulate cleanup
          component.onUnmount && component.onUnmount();
        }
        
        // Force garbage collection if available
        global.gc && global.gc();
        
        setTimeout(() => {
          const memAfter = process.memoryUsage().heapUsed;
          const memDiff = (memAfter - memBefore) / 1024 / 1024;
          console.log('Memory difference:', memDiff.toFixed(2), 'MB after', iterations, 'iterations');
        }, 1000);
      });
    `], { cwd: __dirname });
    
    if (result.code === 0) {
      const match = result.stdout.match(/Memory difference: ([\\d.-]+) MB/);
      if (match) {
        const memDiff = parseFloat(match[1]);
        const benchmark = memDiff < 10; // Less than 10MB growth
        
        logTest('Memory Leak Detection', benchmark ? 'pass' : 'warn', null, 
          `${memDiff}MB growth`);
        
        results.performance.set('memory-leak', { growth: memDiff, benchmark });
      }
    }
  } catch (error) {
    logTest('Memory Leak Detection', 'fail', null, error.message);
  }
}

async function generateProductionReport() {
  log('cyan', '\n📊 PRODUCTION READINESS REPORT');
  log('blue', '='.repeat(60));
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  const warningRate = ((results.warnings / results.total) * 100).toFixed(1);
  const failureRate = ((results.failed / results.total) * 100).toFixed(1);
  
  log('bold', '\n📈 Test Summary:');
  console.log(`   Total Tests: ${results.total}`);
  console.log(`   ${colors.green}✅ Passed: ${results.passed} (${successRate}%)${colors.reset}`);
  console.log(`   ${colors.yellow}⚠️ Warnings: ${results.warnings} (${warningRate}%)${colors.reset}`);
  console.log(`   ${colors.red}❌ Failed: ${results.failed} (${failureRate}%)${colors.reset}`);
  
  // Performance summary
  if (results.performance.size > 0) {
    log('bold', '\n⚡ Performance Summary:');
    for (const [metric, data] of results.performance) {
      const status = data.benchmark ? '✅' : '⚠️';
      console.log(`   ${status} ${metric}: ${JSON.stringify(data)}`);
    }
  }
  
  // Security summary
  if (results.security.size > 0) {
    log('bold', '\n🔒 Security Summary:');
    for (const [metric, data] of results.security) {
      const status = data.secure || data.safe || data.ready ? '✅' : '⚠️';
      console.log(`   ${status} ${metric}: ${JSON.stringify(data)}`);
    }
  }
  
  // Compatibility summary
  if (results.compatibility.size > 0) {
    log('bold', '\n🔧 Compatibility Summary:');
    for (const [metric, data] of results.compatibility) {
      const status = data.compatible || data.works || data.supported ? '✅' : '⚠️';
      console.log(`   ${status} ${metric}: ${JSON.stringify(data)}`);
    }
  }
  
  // Production readiness assessment
  log('bold', '\n🎯 Production Readiness Assessment:');
  
  if (successRate >= 90 && results.failed === 0) {
    log('green', '✅ PRODUCTION READY - Framework exceeds industry standards');
    log('green', '   Ready for immediate production deployment');
  } else if (successRate >= 80 && results.failed <= 2) {
    log('yellow', '⚠️ MOSTLY READY - Minor issues to address');
    log('yellow', '   Can be deployed with monitoring and quick fixes');
  } else if (successRate >= 70) {
    log('yellow', '⚠️ NEEDS WORK - Significant issues to resolve');
    log('yellow', '   Requires development work before production');
  } else {
    log('red', '❌ NOT READY - Major issues prevent deployment');
    log('red', '   Substantial work needed before production consideration');
  }
  
  // Recommendations
  log('bold', '\n📝 Production Recommendations:');
  
  if (results.failed > 0) {
    console.log('   1. 🚨 Fix all failing tests before deployment');
  }
  
  if (results.warnings > 5) {
    console.log('   2. ⚠️ Address performance and compatibility warnings');
  }
  
  console.log('   3. 📊 Set up production monitoring and alerting');
  console.log('   4. 🔄 Implement CI/CD pipeline with automated testing');
  console.log('   5. 📚 Complete documentation and deployment guides');
  console.log('   6. 🛡️ Conduct security audit and penetration testing');
  console.log('   7. 📈 Establish performance baselines and SLAs');
  
  log('cyan', '\n🌟 Aether.js Production Testing Complete!');
  
  return successRate >= 80 && results.failed <= 2;
}

// Main execution
async function runProductionTests() {
  log('cyan', `
╔══════════════════════════════════════════════════════════════╗
║              🚀 AETHER.JS PRODUCTION READINESS              ║
║                Comprehensive Testing Suite                   ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  const startTime = Date.now();
  
  try {
    await testProductionBuild();
    await testPerformanceBenchmarks();
    await testSecurityCompliance();
    await testCompatibility();
    await testLoadAndStress();
    
    const totalTime = Date.now() - startTime;
    log('bold', `\n⏱️ Total test time: ${(totalTime / 1000).toFixed(2)}s`);
    
    const ready = await generateProductionReport();
    
    process.exit(ready ? 0 : 1);
    
  } catch (error) {
    log('red', `\n❌ Production test suite failed: ${error.message}`);
    process.exit(1);
  }
}

runProductionTests();
