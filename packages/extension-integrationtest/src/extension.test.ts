import { Commands, executeCommand, TestCommands } from 'rxjs-debugging-for-vs-code/out/integrationTest';
import * as vscode from 'vscode';

async function waitForCommands(): Promise<void> {
  const commands = await vscode.commands.getCommands(true);
  if (commands.indexOf(Commands.EnableOperatorLogPoint) !== -1) {
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

    // Enable Operator Log Point for the first operator, take.
    await executeCommand(vscode.commands, Commands.EnableOperatorLogPoint, document.uri, new vscode.Position(5, 4), {
      fileName: document.uri.fsPath,
      line: 5,
      character: 25,
      operatorIndex: 0,
    });

    const debuggingDone = new Promise<void>((resolve) => {
      vscode.debug.onDidTerminateDebugSession(() => resolve());
    });
    await vscode.debug.startDebugging(vscode.workspace.workspaceFolders![0], 'Launch NodeJS');
    await debuggingDone;

    const recorded = await executeCommand(vscode.commands, TestCommands.GetDecorationSetterRecording);

    expect(JSON.parse(recorded)).toMatchInlineSnapshot(`
      Object {
        "src/observable.ts": Array [
          Object {
            "decorationType": "TextEditorDecorationType9",
            "options": Array [],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType9",
            "options": Array [],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType8",
            "options": Array [],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType9",
            "options": Array [
              "(5:4):(5:7)-[object Object]-{\\"before\\":{\\"contentIconPath\\":{\\"$mid\\":1,\\"path\\":\\"/Users/mal/git/private/mse-master-thesis/debugger/packages/extension/resources/debug-breakpoint-log-unverified.svg\\",\\"scheme\\":\\"file\\"}}}",
              "(6:4):(6:7)-[object Object]-{\\"before\\":{\\"contentIconPath\\":{\\"$mid\\":1,\\"path\\":\\"/Users/mal/git/private/mse-master-thesis/debugger/packages/extension/resources/debug-breakpoint-log-unverified.svg\\",\\"scheme\\":\\"file\\"}}}",
              "(7:4):(7:7)-[object Object]-{\\"before\\":{\\"contentIconPath\\":{\\"$mid\\":1,\\"path\\":\\"/Users/mal/git/private/mse-master-thesis/debugger/packages/extension/resources/debug-breakpoint-log-unverified.svg\\",\\"scheme\\":\\"file\\"}}}",
            ],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType9",
            "options": Array [
              "(5:4):(5:7)-[object Object]-{\\"before\\":{\\"contentIconPath\\":{\\"$mid\\":1,\\"path\\":\\"/Users/mal/git/private/mse-master-thesis/debugger/packages/extension/resources/debug-breakpoint-log.svg\\",\\"scheme\\":\\"file\\"}}}",
              "(6:4):(6:7)-[object Object]-{\\"before\\":{\\"contentIconPath\\":{\\"$mid\\":1,\\"path\\":\\"/Users/mal/git/private/mse-master-thesis/debugger/packages/extension/resources/debug-breakpoint-log-unverified.svg\\",\\"scheme\\":\\"file\\"}}}",
              "(7:4):(7:7)-[object Object]-{\\"before\\":{\\"contentIconPath\\":{\\"$mid\\":1,\\"path\\":\\"/Users/mal/git/private/mse-master-thesis/debugger/packages/extension/resources/debug-breakpoint-log-unverified.svg\\",\\"scheme\\":\\"file\\"}}}",
            ],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType8",
            "options": Array [
              "(5:9007199254740991):(5:9007199254740991)-undefined-{\\"after\\":{\\"contentText\\":\\"Subscribe\\"}}",
            ],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType8",
            "options": Array [
              "(5:9007199254740991):(5:9007199254740991)-undefined-{\\"after\\":{\\"contentText\\":\\"Next: 0\\"}}",
            ],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType8",
            "options": Array [
              "(5:9007199254740991):(5:9007199254740991)-undefined-{\\"after\\":{\\"contentText\\":\\"Next: 1\\"}}",
            ],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType8",
            "options": Array [
              "(5:9007199254740991):(5:9007199254740991)-undefined-{\\"after\\":{\\"contentText\\":\\"Next: 2\\"}}",
            ],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType8",
            "options": Array [
              "(5:9007199254740991):(5:9007199254740991)-undefined-{\\"after\\":{\\"contentText\\":\\"Next: 3\\"}}",
            ],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType8",
            "options": Array [
              "(5:9007199254740991):(5:9007199254740991)-undefined-{\\"after\\":{\\"contentText\\":\\"Completed\\"}}",
            ],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType8",
            "options": Array [
              "(5:9007199254740991):(5:9007199254740991)-undefined-{\\"after\\":{\\"contentText\\":\\"Unsubscribe\\"}}",
            ],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType8",
            "options": Array [
              "(5:9007199254740991):(5:9007199254740991)-undefined-{\\"after\\":{\\"contentText\\":\\"Unsubscribe\\"}}",
            ],
            "ranges": Array [],
          },
          Object {
            "decorationType": "TextEditorDecorationType8",
            "options": Array [
              "(5:9007199254740991):(5:9007199254740991)-undefined-{\\"after\\":{\\"contentText\\":\\"Unsubscribe\\"}}",
            ],
            "ranges": Array [],
          },
        ],
      }
    `);
  });
});
