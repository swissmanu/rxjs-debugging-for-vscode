import { commands, Disposable } from 'vscode';

export const enum Commands {
  DebugRxJS = 'rxjs-debugging-for-vs-code.command.debugRxJS',
  HelloWorld = 'rxjs-debugging-for-vs-code.command.helloWorld',
  EnableLogPoint = 'rxjs-debugging-for-vs-code.command.enableLogPoint',
}

export interface ICommandTypes {
  [Commands.DebugRxJS]: (debugSessionId?: string) => void;
  [Commands.HelloWorld]: () => void;
  [Commands.EnableLogPoint]: () => void;
}

/**
 * Registers a known command using declared types.
 *
 * @param ns
 * @param key
 * @param fn
 * @returns
 * @see Thanks https://github.com/microsoft/vscode-js-debug/blob/main/src/common/contributionUtils.ts#L171
 */
export function registerCommand<K extends keyof ICommandTypes>(
  ns: typeof commands,
  key: K,
  fn: (
    ...args: Parameters<ICommandTypes[K]>
  ) => Thenable<ReturnType<ICommandTypes[K]>>
): Disposable {
  return ns.registerCommand(key, fn);
}

export function getMarkdownCommandWithArgs<K extends keyof ICommandTypes>(
  key: K,
  args: Parameters<ICommandTypes[K]>
): string {
  return `command:${key}?${encodeURIComponent(JSON.stringify(args))}`;
}
