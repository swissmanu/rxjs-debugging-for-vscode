import * as vscode from 'vscode';
import { ICommandTypes } from './commands';

export default function executeCommand<K extends keyof ICommandTypes>(
  ns: typeof vscode.commands,
  key: K,
  ...args: Parameters<ICommandTypes[K]>
): Thenable<ReturnType<ICommandTypes[K]>> {
  return ns.executeCommand(key, ...args) as Thenable<ReturnType<ICommandTypes[K]>>;
}
