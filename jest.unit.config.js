/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './jest/unit/setup.js',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
  testPathIgnorePatterns: ['node_modules', 'src/integrationTests'],
  modulePathIgnorePatterns: ['.vscode-test/'],
};
