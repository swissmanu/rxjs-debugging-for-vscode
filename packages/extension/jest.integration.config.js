/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  runner: 'vscode',
  modulePathIgnorePatterns: ['.vscode-test/'],
  testMatch: ['**/src/integrationTests/**/*.test.ts'],
};
