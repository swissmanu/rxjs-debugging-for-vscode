import commonjs from '@rollup/plugin-commonjs';
import inject from '@rollup/plugin-inject';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import * as path from 'path';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';
import packageJson from './package.json';

const terserOptions = { format: { comments: () => false } };

const intro = `
const EXTENSION_VERSION = "${packageJson.version}";
const POSTHOG_PROJECT_API_KEY = "phc_Itpmq2gkUMiCYKYVVzR18rVItJqkCwUteNDnmOqx67K";
const POSTHOG_HOST = "http://localhost:3000"
`;

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
      intro,
    },
    external: [
      'vscode',
      ...(doProductionBuild ? [] : ['typescript']), // Faster dev builds without including TypeScript
    ],
    plugins: [
      json(),
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
