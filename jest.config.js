/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './jest/setup.js',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
  testPathIgnorePatterns: ['node_modules', 'src/integrationTest'],
};
