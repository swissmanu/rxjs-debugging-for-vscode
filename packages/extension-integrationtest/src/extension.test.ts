import {
  Commands,
  executeCommand,
  OperatorLogPoint,
  TestCommands,
} from 'rxjs-debugging-for-vs-code/out/integrationTest';
import * as vscode from 'vscode';
import openAndShowTextDocument from './util/openAndShowTextDocument';
import waitForExtension from './util/waitForExtension';

describe('RxJS Debugging for vscode', () => {
  test('shows operator life cycle events as text editor decoration', async () => {
    const document = await openAndShowTextDocument('**/commonjs/observable.js');
    await waitForExtension();

    // Enable Operator Log Point for the first operator, take.
    await executeCommand(
      vscode.commands,
      Commands.EnableOperatorLogPoint,
      new OperatorLogPoint(
        document.uri,
        new vscode.Position(5, 4),
        {
          fileName: document.uri.fsPath,
          line: 5,
          character: 25,
          operatorIndex: 0,
        },
        'take'
      )
    );

    const debuggingDone = new Promise<void>((resolve) => {
      vscode.debug.onDidTerminateDebugSession(() => resolve());
    });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await vscode.debug.startDebugging(vscode.workspace.workspaceFolders![0], 'Launch CommonJS');
    await debuggingDone;

    const decorations = await executeCommand(
      vscode.commands,
      TestCommands.GetDecorationSetterRecording,
      'src/commonjs/observable.js',
      'liveLog'
    );

    expect(decorations).toMatchSnapshot();
  });
});
