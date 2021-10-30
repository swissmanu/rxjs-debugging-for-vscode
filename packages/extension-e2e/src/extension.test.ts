// import * as assert from 'assert';

// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
// import * as vscode from 'vscode';
// // import * as myExtension from '../../extension';

// suite('Integration Test Suite', () => {
//   vscode.window.showInformationMessage('Start all tests.');

//   test('Sample test', () => {
//     assert.equal(-1, [1, 2, 3].indexOf(5));
//     assert.equal(-1, [1, 2, 3].indexOf(0));
//   });
// });

import * as vscode from 'vscode';

async function waitForCommands(): Promise<void> {
  const commands = await vscode.commands.getCommands(true);
  if (commands.indexOf('rxjs-debugging-for-vs-code.command.enableOperatorLogPoint') !== -1) {
    return;
  }
  throw new Error('Command not found');
}

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureExtensionIsAvailable(): Promise<void> {
  let ok = false;
  for (let retry = 0; retry < 5; retry++) {
    try {
      await waitForCommands();
      ok = true;
    } catch (_) {
      await wait(1000);
    }
  }

  if (!ok) {
    throw new Error('Extension seems like it never became available.');
  }
}

describe('RxJS Debugging for vscode', () => {
  test('shows operator life cycle events as text editor decoration', async () => {
    const [file] = await vscode.workspace.findFiles('**/observable.ts');
    const document = await vscode.workspace.openTextDocument(file);
    await vscode.window.showTextDocument(document);

    await ensureExtensionIsAvailable();

    await vscode.commands.executeCommand(
      'rxjs-debugging-for-vs-code.command.enableOperatorLogPoint',
      document.uri,
      new vscode.Position(5, 4),
      { fileName: document.uri.fsPath, line: 5, character: 25, operatorIndex: 0 }
    );

    const debuggingDone = new Promise<void>((resolve) => {
      vscode.debug.onDidTerminateDebugSession(() => resolve());
    });

    await vscode.debug.startDebugging(vscode.workspace.workspaceFolders![0], 'Launch NodeJS');
    await debuggingDone;

    // TODO How to assert text decoration?
  });
});
