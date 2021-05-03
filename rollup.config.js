import typescript from '@rollup/plugin-typescript';
import tsconfig from './tsconfig.json';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';

const doProductionBuild = process.env.NODE_ENV === 'production';

const runtimeConfig = {
  input: 'src/runtime/node.ts',
  output: {
    file: 'out/runtime.node.js',
    format: 'commonjs',
    interop: false,
    sourcemap: true,
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
    doProductionBuild && terser(),
  ],
};

const extensionConfig = {
  input: 'src/extension.ts',
  output: {
    file: 'out/extension.js',
    format: 'commonjs',
    sourcemap: true,
  },
  external: ['fs', 'inversify', 'path', 'typescript', 'vscode', 'ws', 'reflect-metadata'],
  plugins: [
    typescript({
      module: 'esnext',
    }),
    copy({
      targets: [{ src: 'src/ui/**/assets', dest: 'out' }],
    }),
    doProductionBuild && terser(),
  ],
};

export default [runtimeConfig, extensionConfig];
