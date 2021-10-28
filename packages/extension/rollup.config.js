import commonJs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

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
    nodeResolve({ preferBuiltins: true }),
    typescript(),
    doProductionBuild && terser(terserOptions),
  ],
};

export default extension;
