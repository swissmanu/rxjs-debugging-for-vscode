import { interfaces } from 'inversify';
import * as vscode from 'vscode';
import { ILogger } from '../logger';
import OperatorLogPoint from '../operatorLogPoint';
import { IOperatorLogPointManager } from '../operatorLogPoint/logPointManager';
import { Commands } from './commands';
import registerCommand from './registerCommand';

export default function registerOperatorLogPointManagementCommands(
  context: vscode.ExtensionContext,
  container: interfaces.Container
): void {
  const logPointManager = container.get<IOperatorLogPointManager>(IOperatorLogPointManager);
  const logger = container.get<ILogger>(ILogger);

  context.subscriptions.push(
    registerCommand(vscode.commands, Commands.EnableOperatorLogPoint, async (operatorLogPoint) => {
      if (typeof operatorLogPoint === 'string') {
        try {
          const parsed = OperatorLogPoint.parse(operatorLogPoint);
          logPointManager.enable(parsed);
        } catch (e) {
          logger.warn(
            'Extension',
            `Tried to enable serialized OperatorLogPoint, but could not parse it. ("${operatorLogPoint}")`
          );
        }
      } else {
        logPointManager.enable(operatorLogPoint);
      }
    }),

    registerCommand(vscode.commands, Commands.DisableOperatorLogPoint, async (operatorLogPoint) => {
      if (typeof operatorLogPoint === 'string') {
        try {
          const parsed = OperatorLogPoint.parse(operatorLogPoint);
          logPointManager.disable(parsed);
        } catch (e) {
          logger.warn(
            'Extension',
            `Tried to disable serialized OperatorLogPoint, but could not parse it. ("${operatorLogPoint}")`
          );
        }
      } else {
        logPointManager.disable(operatorLogPoint);
      }
    })
  );
}
