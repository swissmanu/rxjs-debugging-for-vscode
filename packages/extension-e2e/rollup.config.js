import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
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
    commonjs({
      ignore: ['bufferutil', 'utf-8-validate'], // Ignore optional peer dependencies of ws
    }),
    nodeResolve({ preferBuiltins: true }),
    typescript(),
    copy({
      overwrite: true,
      targets: [
        { src: '../runtime-nodejs/out/**/*', dest: './out/runtime-nodejs' },
        { src: '../../docs/*', dest: './docs' },
        { src: '../../README.md', dest: './' },
        { src: '../../LICENSE', dest: './' },
      ],
    }),
    doProductionBuild && terser(terserOptions),
  ],
};

export default extension;
