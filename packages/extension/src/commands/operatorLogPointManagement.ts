import { interfaces } from 'inversify';
import * as vscode from 'vscode';
import { Commands, registerCommand } from '.';
import { IOperatorLogPointManager } from '../operatorLogPoint/logPointManager';

export default function registerOperatorLogPointManagementCommands(
  context: vscode.ExtensionContext,
  container: interfaces.Container
): void {
  const logPointManager = container.get<IOperatorLogPointManager>(IOperatorLogPointManager);

  context.subscriptions.push(
    registerCommand(vscode.commands, Commands.EnableOperatorLogPoint, async (uri, position, operatorIdentifier) => {
      logPointManager.enable(uri, position, operatorIdentifier);
    }),
    registerCommand(vscode.commands, Commands.DisableOperatorLogPoint, async (uri, position, operatorIdentifier) => {
      logPointManager.disable(uri, position, operatorIdentifier);
    })
  );
}
