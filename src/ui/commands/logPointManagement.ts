import { interfaces } from 'inversify';
import * as vscode from 'vscode';
import { Commands, registerCommand } from '.';
import { ILogPointManager } from '../logPoint/logPointManager';

export default function registerLogPointManagementCommands(
  context: vscode.ExtensionContext,
  container: interfaces.Container
): void {
  registerEnableLogPoint(context, container);
}

function registerEnableLogPoint(context: vscode.ExtensionContext, container: interfaces.Container) {
  const logPointManager = container.get<ILogPointManager>(ILogPointManager);

  context.subscriptions.push(
    registerCommand(vscode.commands, Commands.EnableLogPoint, async (uri, position) => {
      logPointManager.enable(uri, position);
    }),
    registerCommand(vscode.commands, Commands.DisableLogPoint, async (uri, position) => {
      logPointManager.disable(uri, position);
    })
  );
}
