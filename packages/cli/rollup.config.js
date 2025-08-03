import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default [
  {
    input: 'src/commands/create.js',
    output: {
      file: 'dist/commands/create.js',
      format: 'es',
      banner: '#!/usr/bin/env node'
    },
    external: ['fs-extra', 'path', 'chalk', 'ora', 'cross-spawn', 'validate-npm-package-name', 'inquirer'],
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      commonjs(),
      json()
    ]
  },
  {
    input: 'src/commands/dev.js',
    output: {
      file: 'dist/commands/dev.js',
      format: 'es'
    },
    external: ['fs-extra', 'path', 'chalk', 'ora', 'cross-spawn'],
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      commonjs(),
      json()
    ]
  }
];
