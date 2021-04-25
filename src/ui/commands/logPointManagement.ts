import { interfaces } from 'inversify';
import * as vscode from 'vscode';
import { Commands, registerCommand } from '.';

export function registerLogPointManagementCommands(
  context: vscode.ExtensionContext,
  container: interfaces.Container
): void {
  registerEnableLogPoint(context, container);
}

function registerEnableLogPoint(context: vscode.ExtensionContext, container: interfaces.Container) {
  context.subscriptions.push(
    registerCommand(vscode.commands, Commands.EnableLogPoint, async () => {
      try {
        // const sessionContainer = container.get<Container>(CurrentSession);
        // const telemetryBridge = sessionContainer.get<ITelemetryBridge>(ITelemetryBridge);
        // telemetryBridge.enable({
        //   fileName:
        //     '/Users/mal/git/private/mse-master-thesis/rxjs-debugger/example-workspaces/browser-and-server/src/observable.ts',
        //   columnNumber: 4,
        //   lineNumber: 8,
        // });
      } catch (e) {
        vscode.window.showErrorMessage(e);
      }
    })
  );
}
