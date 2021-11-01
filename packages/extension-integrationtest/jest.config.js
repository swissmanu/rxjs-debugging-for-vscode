function isCI() {
  return !!process.env['CI'];
}

const baseTimeout = 20_000; // 20s

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  runner: 'vscode',
  modulePathIgnorePatterns: ['.vscode-test/'],
  testMatch: ['**/out/**/*.test.js'],
  testTimeout: isCI() ? baseTimeout * 3 : baseTimeout,
};
