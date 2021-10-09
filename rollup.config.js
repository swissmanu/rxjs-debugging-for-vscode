import commonJs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import tsconfig from './tsconfig.json';

const doProductionBuild = process.env.NODE_ENV === 'production';
const terserOptions = { format: { comments: () => false } };

/**
 * @type {import('rollup').RollupOptions}
 */
const extension = {
  input: 'src/extension.ts',
  output: {
    file: 'out/extension.js',
    format: 'commonjs',
    sourcemap: !doProductionBuild,
  },
  external: [
    'vscode',
    ...(doProductionBuild ? [] : ['typescript']), // Faster dev builds without including TypeScript
  ],
  plugins: [
    commonJs({
      ignore: ['bufferutil', 'utf-8-validate'], // Ignore optional peer dependencies of ws
    }),
    nodeResolve({
      preferBuiltins: true,
    }),
    typescript({
      module: 'esnext',
    }),
    doProductionBuild && terser(terserOptions),
  ],
};

/**
 * @type {import('rollup').RollupOptions}
 */
const baseRuntimeConfig = {
  external: ['module', 'path'],
  plugins: [
    commonJs(),
    nodeResolve({
      resolveOnly: [
        'stacktrace-js',
        'error-stack-parser',
        'stack-generator',
        'stacktrace-gps',
        'stackframe',
        'source-map',
      ],
    }),
    typescript({
      tsconfig: false, // Prevent exclude being read from tsconfig.json
      ...tsconfig.compilerOptions,
      outDir: undefined, // reset
      module: 'esnext',
      exclude: tsconfig.exclude.filter((s) => s !== 'src/runtime').map((s) => `${s}/**`),
    }),
    doProductionBuild &&
      terser({
        ...terserOptions,

        // Apply terser with care so stack traces for source detection keeps working:
        compress: false,
        mangle: false,
      }),
  ],
};

/**
 * @type {import('rollup').RollupOptions}
 */
const nodeRuntime = {
  ...baseRuntimeConfig,
  input: 'src/runtime/node/index.ts',
  output: {
    file: 'out/node/runtime.js',
    format: 'commonjs',
    interop: false,
    exports: 'auto',
    sourcemap: !doProductionBuild,
  },
};

/**
 * @type {import('rollup').RollupOptions}
 */
const webpackPlugin = {
  ...baseRuntimeConfig,
  input: [
    'src/runtime/webpack/RxJSDebuggingPlugin.ts',
    'src/runtime/webpack/loader.ts',
    'src/runtime/webpack/instrumentation.ts',
  ],
  output: {
    dir: 'out/webpack',
    format: 'commonjs',
    interop: false,
    exports: 'auto',
    sourcemap: !doProductionBuild,
  },
};

export default [extension, nodeRuntime, webpackPlugin];
