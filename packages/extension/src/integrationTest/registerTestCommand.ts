import * as vscode from 'vscode';
import { ITestCommandTypes } from './testCommands';

/**
 * Registers a known test command using declared types.
 *
 * @param ns
 * @param key
 * @param fn
 * @returns
 * @see Thanks https://github.com/microsoft/vscode-js-debug/blob/main/src/common/contributionUtils.ts#L171
 */
export default function registerTestCommand<K extends keyof ITestCommandTypes>(
  ns: typeof vscode.commands,
  key: K,
  fn: (...args: Parameters<ITestCommandTypes[K]>) => Thenable<ReturnType<ITestCommandTypes[K]>>
): vscode.Disposable {
  return ns.registerCommand(key, fn);
}
