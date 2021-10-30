function isCI() {
  return !!process.env['CI'];
}

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  runner: 'vscode',
  modulePathIgnorePatterns: ['.vscode-test/'],
  testMatch: ['**/out/**/*.test.js'],
  testTimeout: isCI() ? 50_000 : 20_000,
};
