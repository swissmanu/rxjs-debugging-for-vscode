import { commands, Disposable, Position, Uri } from 'vscode';
import { IOperatorIdentifier } from '../../shared/telemetry/operatorIdentifier';

export const enum Commands {
  EnableOperatorLogPoint = 'rxjs-debugging-for-vs-code.command.enableOperatorLogPoint',
  DisableOperatorLogPoint = 'rxjs-debugging-for-vs-code.command.disableOperatorLogPoint',
  ToggleOperatorLogPointRecommendations = 'rxjs-debugging-for-vs-code.command.toggleOperatorLogPointRecommendations',
}

export interface ICommandTypes {
  [Commands.EnableOperatorLogPoint]: (uri: Uri, position: Position, operatorIdentifier: IOperatorIdentifier) => void;
  [Commands.DisableOperatorLogPoint]: (uri: Uri, position: Position, operatorIdentifier: IOperatorIdentifier) => void;
  [Commands.ToggleOperatorLogPointRecommendations]: () => void;
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
  fn: (...args: Parameters<ICommandTypes[K]>) => Thenable<ReturnType<ICommandTypes[K]>>
): Disposable {
  return ns.registerCommand(key, fn);
}

export function executeCommand<K extends keyof ICommandTypes>(
  ns: typeof commands,
  key: K,
  ...args: Parameters<ICommandTypes[K]>
): Thenable<ReturnType<ICommandTypes[K]>> {
  return ns.executeCommand(key, ...args) as Thenable<ReturnType<ICommandTypes[K]>>;
}

export function getMarkdownCommandWithArgs<K extends keyof ICommandTypes>(
  key: K,
  args: Parameters<ICommandTypes[K]>
): string {
  return `command:${key}?${encodeURIComponent(JSON.stringify(args))}`;
}
