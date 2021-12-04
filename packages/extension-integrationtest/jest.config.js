function isCI() {
  return !!process.env['CI'];
}

const baseTimeout = 20_000; // 20s

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  runner: 'vscode',
  modulePathIgnorePatterns: ['.vscode-test/'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['**/src/**/*.test.ts'],
  testTimeout: isCI() ? baseTimeout * 10 : baseTimeout,
  verbose: true,
};
