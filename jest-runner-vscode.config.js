/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

/** @type {import('jest-runner-vscode').RunnerOptions} */
module.exports = {
  version: '1.61.1',
  launchArgs: ['--disable-extensions'],
  workspaceDir: path.resolve(path.join('test-benches', 'browser-and-server')),
  openInFolder: true,
};
