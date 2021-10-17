import commonJs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

const doProductionBuild = process.env.NODE_ENV === 'production';

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: 'src/index.ts',
  output: {
    file: 'out/runtime.js',
    format: 'commonjs',
    interop: false,
    exports: 'auto',
    sourcemap: !doProductionBuild,
  },
  plugins: [
    commonJs(),
    nodeResolve({
      preferBuiltins: true,
      resolveOnly: [
        '@rxjs-debugging/telemetry',

        '@rxjs-debugging/runtime',
        'stacktrace-js',
        'error-stack-parser',
        'stack-generator',
        'stacktrace-gps',
        'stackframe',
        'source-map',
      ],
    }),
    typescript(),
    doProductionBuild &&
      terser({
        format: { comments: () => false },

        // Apply terser with care so stack traces for source detection keeps working:
        compress: false,
        mangle: false,
      }),
  ],
};
