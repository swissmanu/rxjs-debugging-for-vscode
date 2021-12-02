/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

function relativePath(...segments) {
  return path.resolve(path.join(__dirname, ...segments));
}

/** @type {import('jest-runner-vscode').RunnerOptions} */
module.exports = {
  version: '1.61.0',
  launchArgs: ['--new-window', '--disable-extensions'],
  // workspaceDir: relativePath('..', 'testbench-nodejs'),
  extensionDevelopmentPath: relativePath('../extension'),
  // openInFolder: true,
};
