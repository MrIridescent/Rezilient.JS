import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default [
  // ESM build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/rezilient.esm.js',
      format: 'es',
      sourcemap: true,
      banner: '/* Rezilient.js v2.0.0 - The Revolutionary Framework */',
      inlineDynamicImports: true
    },
    external: ['node-fetch'],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      terser({
        compress: {
          drop_console: false,
          drop_debugger: true
        },
        format: {
          comments: /^!/
        }
      })
    ]
  },

  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/rezilient.cjs.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
      banner: '/* Rezilient.js v2.0.0 - The Revolutionary Framework */',
      inlineDynamicImports: true
    },
    external: ['node-fetch'],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      terser({
        compress: {
          drop_console: false,
          drop_debugger: true
        },
        format: {
          comments: /^!/
        }
      })
    ]
  },

  // UMD build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/rezilient.umd.js',
      format: 'umd',
      name: 'Rezilient',
      sourcemap: true,
      banner: '/* Rezilient.js v2.0.0 - The Revolutionary Framework */',
      inlineDynamicImports: true
    },
    external: ['node-fetch'],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      terser({
        compress: {
          drop_console: false,
          drop_debugger: true
        },
        format: {
          comments: /^!/
        }
      })
    ]
  }
];
