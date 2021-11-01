import * as vscode from 'vscode';
import { ICommandTypes } from './commands';

/**
 * Registers a known command using declared types.
 *
 * @param ns
 * @param key
 * @param fn
 * @returns
 * @see Thanks https://github.com/microsoft/vscode-js-debug/blob/main/src/common/contributionUtils.ts#L171
 */
export default function registerCommand<K extends keyof ICommandTypes>(
  ns: typeof vscode.commands,
  key: K,
  fn: (...args: Parameters<ICommandTypes[K]>) => Thenable<ReturnType<ICommandTypes[K]>>
): vscode.Disposable {
  return ns.registerCommand(key, fn);
}
