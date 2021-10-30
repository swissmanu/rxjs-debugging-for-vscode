/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  runner: 'vscode',
  modulePathIgnorePatterns: ['.vscode-test/'],
  testMatch: ['**/out/**/*.test.js'],
  testTimeout: 20_000,
};
