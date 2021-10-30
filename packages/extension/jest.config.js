const { join } = require('path');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: join(__dirname, 'jest', 'unit', 'setup.js'),

  transformIgnorePatterns: ['node_modules/(?!(@rxjs-debugging)/)'],
  testPathIgnorePatterns: ['node_modules', 'src/integrationTests'],
  modulePathIgnorePatterns: ['.vscode-test/'],
};
