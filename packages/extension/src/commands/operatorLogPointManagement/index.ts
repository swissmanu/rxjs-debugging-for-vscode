import { interfaces } from 'inversify';
import * as vscode from 'vscode';
import { ILogger } from '../../logger';
import { IOperatorLogPointManager } from '../../operatorLogPoint/manager';
import { Commands } from '../commands';
import registerCommand from '../registerCommand';
import disableOperatorLogPoint from './disableOperatorLogPoint';
import enableOperatorLogPoint from './enableOperatorLogPoint';
import toggleOperatorLogPointInRange from './toggleOperatorLogPointInRange';

export default function registerOperatorLogPointManagementCommands(
  context: vscode.ExtensionContext,
  container: interfaces.Container
): void {
  const manager = container.get<IOperatorLogPointManager>(IOperatorLogPointManager);
  const logger = container.get<ILogger>(ILogger);

  context.subscriptions.push(
    registerCommand(vscode.commands, Commands.EnableOperatorLogPoint, enableOperatorLogPoint(manager, logger)),
    registerCommand(vscode.commands, Commands.DisableOperatorLogPoint, disableOperatorLogPoint(manager, logger)),
    registerCommand(vscode.commands, Commands.ToggleOperatorLogPointInRange, toggleOperatorLogPointInRange(manager)),
  );
}
