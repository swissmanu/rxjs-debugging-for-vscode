import * as vscode from 'vscode';
import { registerDebugRxJS } from './ui/commands/debugRxJs';
import { registerLogPointManagementCommands } from './ui/commands/logPointManagement';
import { DecorationProvider } from './ui/decoration/decorationProvider';
import { HoverProvider } from './ui/hover/hoverProvider';
import createRootContainer from './ui/ioc/rootContainer';

export function activate(context: vscode.ExtensionContext): void {
  const rootContainer = createRootContainer(context);

  registerDebugRxJS(context, rootContainer);
  registerLogPointManagementCommands(context, rootContainer);

  // vscode.languages.registerCodeLensProvider(
  //   BlaCodeLensProvider.documentSelector,
  //   new BlaCodeLensProvider()
  // );

  const decorationProvider = new DecorationProvider();
  context.subscriptions.push(decorationProvider);

  const hoverProvider = new HoverProvider();
  context.subscriptions.push(hoverProvider);

  if (vscode.window.activeTextEditor) {
    decorationProvider.attach(vscode.window.activeTextEditor);
    hoverProvider.attach(vscode.window.activeTextEditor);
  }

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      decorationProvider.attach(editor);
      hoverProvider.attach(editor);
    } else {
      decorationProvider.detach();
      hoverProvider.detach();
    }
  });
}

export function deactivate(): void {
  // Nothing to do.
}
