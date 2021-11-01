import commonjs from '@rollup/plugin-commonjs';
import inject from '@rollup/plugin-inject';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import * as path from 'path';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';

const terserOptions = { format: { comments: () => false } };

/**
 * @type {import('rollup').RollupOptions}
 */
export default ({ configMode }) => {
  const doProductionBuild = configMode === 'production';
  const doTestBuild = configMode === 'test';

  return {
    input: {
      extension: 'src/extension.ts',
      ...(doTestBuild ? { 'integrationTest/index': 'src/integrationTest/index.ts' } : {}), // Integration Test API
    },
    output: {
      dir: 'out',
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
      doTestBuild &&
        inject({
          prepareForIntegrationTest: path.resolve(path.join('src', 'integrationTest', 'prepareForIntegrationTest.ts')),
        }),
      typescript({
        declaration: doTestBuild,
      }),
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
};
