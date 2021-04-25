import { interfaces } from 'inversify';
import * as vscode from 'vscode';
import { Commands, registerCommand } from '.';
import { ILogPointManager } from '../logPointManager';

export function registerLogPointManagementCommands(
  context: vscode.ExtensionContext,
  container: interfaces.Container
): void {
  registerEnableLogPoint(context, container);
}

function registerEnableLogPoint(context: vscode.ExtensionContext, container: interfaces.Container) {
  const logPointManager = container.get<ILogPointManager>(ILogPointManager);

  context.subscriptions.push(
    registerCommand(vscode.commands, Commands.EnableLogPoint, async () => {
      logPointManager.enable(
        '/Users/mal/git/private/mse-master-thesis/rxjs-debugger/example-workspaces/browser-and-server/src/observable.ts',
        4,
        8
      );
    }),
    registerCommand(vscode.commands, Commands.DisableLogPoint, async () => {
      logPointManager.disable(
        '/Users/mal/git/private/mse-master-thesis/rxjs-debugger/example-workspaces/browser-and-server/src/observable.ts',
        4,
        8
      );
    })
  );
}
