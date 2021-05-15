import commonJs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import tsconfig from './tsconfig.json';

const doProductionBuild = process.env.NODE_ENV === 'production';
const terserOptions = { format: { comments: () => false } };

const extension = {
  input: 'src/extension.ts',
  output: {
    file: 'out/extension.js',
    format: 'commonjs',
    sourcemap: !doProductionBuild,
  },
  external: [
    'fs',
    'path',
    'vscode',
    ...(doProductionBuild ? [] : ['typescript']), // Faster dev builds without including TypeScript
  ],
  plugins: [
    commonJs({
      ignore: ['bufferutil', 'utf-8-validate'], // Ignore optional peer dependencies of ws
    }),
    nodeResolve(),
    typescript({
      module: 'esnext',
    }),
    doProductionBuild && terser(terserOptions),
  ],
};

const nodeRuntime = {
  input: 'src/runtime/node.ts',
  output: {
    file: 'out/runtime.node.js',
    format: 'commonjs',
    interop: false,
  },
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

export default [extension, nodeRuntime];
