/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

function relativePath(...segments) {
  return path.resolve(path.join(__dirname, ...segments));
}

console.log(relativePath('..', 'testbench-nodejs'));
console.log(relativePath('..', 'extension'));

/** @type {import('jest-runner-vscode').RunnerOptions} */
module.exports = {
  version: '1.61.1',
  launchArgs: ['--new-window', '--disable-extensions'],
  workspaceDir: relativePath('..', 'testbench-nodejs'),
  extensionDevelopmentPath: relativePath('../extension'),
  openInFolder: true,
};
