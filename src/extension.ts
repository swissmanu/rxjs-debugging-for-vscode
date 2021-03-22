import * as vscode from 'vscode';
import { registerDebugRxJS } from './ui/commands/debugRxJs';

export function activate(context: vscode.ExtensionContext): void {
  registerDebugRxJS(context);
}

export function deactivate(): void {
  // Nothing to do.
}
