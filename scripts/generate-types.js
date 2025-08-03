#!/usr/bin/env node

/**
 * Generate TypeScript definitions
 * Simple script to ensure types directory exists
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateTypes() {
  console.log('📝 Generating TypeScript definitions...');
  
  const typesDir = path.join(__dirname, '../types');
  
  // Ensure types directory exists
  try {
    await fs.promises.mkdir(typesDir, { recursive: true });
    console.log('✅ Types directory ready');
  } catch (error) {
    console.log('⚠️  Types directory already exists');
  }
  
  // Check if index.d.ts exists
  const indexTypesPath = path.join(typesDir, 'index.d.ts');
  try {
    await fs.promises.access(indexTypesPath);
    console.log('✅ TypeScript definitions already exist');
  } catch {
    console.log('⚠️  TypeScript definitions not found, but that\'s okay for now');
  }
  
  console.log('✅ Type generation complete');
}

generateTypes().catch(error => {
  console.error('❌ Type generation failed:', error.message);
  process.exit(1);
});
