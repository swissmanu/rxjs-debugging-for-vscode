import * as vscode from 'vscode';
import { ICommandTypes } from '../commands/commands';
import { ITestCommandTypes } from './testCommands';

type AllCommandTypes = ICommandTypes & ITestCommandTypes;

export default function executeCommand<K extends keyof AllCommandTypes>(
  ns: typeof vscode.commands,
  key: K,
  ...args: Parameters<AllCommandTypes[K]>
): Thenable<ReturnType<AllCommandTypes[K]>> {
  return ns.executeCommand(key, ...args) as Thenable<ReturnType<AllCommandTypes[K]>>;
}
