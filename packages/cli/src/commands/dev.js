// src/commands/dev.js

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { createServer } from 'http';
import { fileURLToPath } from 'url';

/**
 * Start development server
 */
export async function startDev(options = {}) {
  const port = parseInt(options.port) || 3000;
  const host = options.host || 'localhost';
  
  console.log(chalk.cyan('\n🚀 Starting Aether.js development server...\n'));
  
  // Check if we're in an Aether.js project
  if (!await isAetherProject()) {
    console.error(chalk.red('Error: Not in an Aether.js project directory.'));
    console.log(chalk.yellow('Run this command from your project root, or create a new project with:'));
    console.log(chalk.cyan('  create-aether-app my-app'));
    process.exit(1);
  }
  
  const spinner = ora('Starting development server...').start();
  
  try {
    // Create development server
    const server = createDevServer(port, host, options);
    
    // Start server
    await new Promise((resolve, reject) => {
      server.listen(port, host, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
    
    spinner.succeed('Development server started');
    
    // Show server info
    console.log(chalk.green('✅ Server running at:'));
    console.log(chalk.cyan(`   http://${host}:${port}`));
    console.log();
    console.log(chalk.gray('Press Ctrl+C to stop the server'));
    
    // Open browser if requested
    if (options.open) {
      const { default: open } = await import('open');
      await open(`http://${host}:${port}`);
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑 Shutting down development server...'));
      server.close(() => {
        console.log(chalk.green('✅ Server stopped'));
        process.exit(0);
      });
    });
    
  } catch (error) {
    spinner.fail('Failed to start development server');
    console.error(chalk.red(error.message));
    process.exit(1);
  }
}

/**
 * Create development server
 */
function createDevServer(port, host, options) {
  const server = createServer(async (req, res) => {
    try {
      await handleRequest(req, res, options);
    } catch (error) {
      console.error(chalk.red('Request error:'), error.message);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
  
  return server;
}

/**
 * Handle HTTP requests
 */
async function handleRequest(req, res, options) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = url.pathname;
  
  // Default to index.html for root
  if (filePath === '/') {
    filePath = '/index.html';
  }
  
  // Remove leading slash
  filePath = filePath.slice(1);
  
  // Security: prevent directory traversal
  if (filePath.includes('..')) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }
  
  const fullPath = path.resolve(filePath);
  
  try {
    // Check if file exists
    if (!await fs.pathExists(fullPath)) {
      // For SPA routing, serve index.html for non-file requests
      if (!path.extname(filePath)) {
        const indexPath = path.resolve('index.html');
        if (await fs.pathExists(indexPath)) {
          await serveFile(res, indexPath, 'text/html');
          return;
        }
      }
      
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    
    // Determine content type
    const contentType = getContentType(filePath);
    
    // Handle JavaScript modules with special processing
    if (filePath.endsWith('.js') && filePath.startsWith('src/')) {
      await serveJavaScript(res, fullPath, contentType);
    } else {
      await serveFile(res, fullPath, contentType);
    }
    
  } catch (error) {
    console.error(chalk.red('File serving error:'), error.message);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}

/**
 * Serve a file with appropriate headers
 */
async function serveFile(res, filePath, contentType) {
  const content = await fs.readFile(filePath);
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.end(content);
}

/**
 * Serve JavaScript with module resolution
 */
async function serveJavaScript(res, filePath, contentType) {
  let content = await fs.readFile(filePath, 'utf8');
  
  // Simple module resolution for @aether/framework imports
  content = content.replace(
    /from\s+['"]@aether\/framework['"]/g,
    "from '/node_modules/@aether/framework/dist/aether.esm.js'"
  );
  
  // Add development helpers
  if (filePath.includes('main.js')) {
    content = addDevHelpers(content);
  }
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.end(content);
}

/**
 * Add development helpers to main.js
 */
function addDevHelpers(content) {
  const devHelpers = `
// Aether.js Development Helpers
console.log('%c⚡ Aether.js Development Mode', 'color: #667eea; font-size: 16px; font-weight: bold;');

// Hot reload support (basic)
if (typeof window !== 'undefined') {
  let lastModified = Date.now();
  
  setInterval(async () => {
    try {
      const response = await fetch('/api/dev/check-reload');
      const data = await response.json();
      if (data.reload && data.timestamp > lastModified) {
        console.log('🔄 Reloading due to file changes...');
        window.location.reload();
      }
    } catch (error) {
      // Ignore errors in development
    }
  }, 1000);
}

// Error overlay
window.addEventListener('error', (event) => {
  console.error('🚨 Runtime Error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
});

`;
  
  return devHelpers + '\n' + content;
}

/**
 * Get content type for file extension
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  
  return contentTypes[ext] || 'text/plain';
}

/**
 * Check if current directory is an Aether.js project
 */
async function isAetherProject() {
  try {
    const packageJsonPath = path.resolve('package.json');
    
    if (!await fs.pathExists(packageJsonPath)) {
      return false;
    }
    
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Check if it has Aether.js dependencies
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    return dependencies['@aether/framework'] || dependencies['@aether/cli'];
  } catch {
    return false;
  }
}
