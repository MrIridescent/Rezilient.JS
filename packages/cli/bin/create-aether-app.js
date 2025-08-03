#!/usr/bin/env node

/**
 * create-aether-app
 * Quick project scaffolding for Aether.js
 */

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

console.log(chalk.cyan(`
  ⚡ create-aether-app v${packageJson.version}
  🌟 Revolutionary JavaScript Framework
`));

program
  .name('create-aether-app')
  .description('Create a new Aether.js application')
  .argument('<project-name>', 'Name of the project')
  .option('-t, --template <template>', 'Project template')
  .option('--skip-install', 'Skip npm install')
  .option('--use-npm', 'Use npm instead of yarn')
  .option('--revolutionary', 'Enable all revolutionary features')
  .action(async (projectName, options) => {
    try {
      // Interactive setup if no template specified
      if (!options.template) {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'template',
            message: 'Choose a template:',
            choices: [
              { name: '🚀 Basic App - Simple Aether.js application', value: 'basic' },
              { name: '🏢 Enterprise - Full-featured business application', value: 'enterprise' },
              { name: '📱 PWA - Progressive Web App with offline support', value: 'pwa' },
              { name: '🎮 Spatial - AR/VR/Mixed Reality application', value: 'spatial' },
              { name: '🧠 AI-Powered - Application with AI features', value: 'ai' },
              { name: '🌱 Sustainable - Carbon-aware green application', value: 'sustainable' },
              { name: '🔬 Research - All revolutionary features enabled', value: 'research' }
            ]
          },
          {
            type: 'checkbox',
            name: 'features',
            message: 'Select revolutionary features to enable:',
            choices: [
              { name: '🧠 AI-Powered Framework', value: 'ai' },
              { name: '🔮 Quantum-Ready Security', value: 'quantum' },
              { name: '🫀 Biometric Awareness', value: 'biometric' },
              { name: '🥽 Spatial Computing', value: 'spatial' },
              { name: '🧠 Neuromorphic Computing', value: 'neuromorphic' },
              { name: '🤖 Edge AI', value: 'edge-ai' },
              { name: '🌱 Carbon Awareness', value: 'carbon' }
            ],
            when: (answers) => answers.template !== 'basic'
          },
          {
            type: 'confirm',
            name: 'typescript',
            message: 'Use TypeScript?',
            default: true
          },
          {
            type: 'confirm',
            name: 'pwa',
            message: 'Enable PWA features?',
            default: true,
            when: (answers) => answers.template !== 'pwa'
          }
        ]);
        
        options = { ...options, ...answers };
      }

      // Import and run create command
      const { createApp } = await import('../dist/commands/create.js');
      await createApp(projectName, options);
      
    } catch (error) {
      console.error(chalk.red('Error creating application:'), error.message);
      process.exit(1);
    }
  });

program.parse();
