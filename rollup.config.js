import typescript from '@rollup/plugin-typescript';
import tsconfig from './tsconfig.json';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const doProductionBuild = process.env.NODE_ENV === 'production';

export default {
  input: 'src/runtime/node.ts',
  output: {
    file: 'out/runtime.node.js',
    format: 'cjs',
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
      exclude: tsconfig.exclude
        .filter((s) => s !== 'src/runtime')
        .map((s) => `${s}/**`),
    }),
    doProductionBuild && terser(),
  ],
};
