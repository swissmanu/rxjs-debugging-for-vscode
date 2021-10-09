import 'reflect-metadata';
import * as vscode from 'vscode';
import registerOperatorLogPointManagementCommands from './ui/commands/operatorLogPointManagement';
import registerToggleOperatorLogPointDecorationCommand from './ui/commands/toggleOperatorLogPointDecoration';
import {
  INodeWithRxJSDebugConfigurationResolver,
  NodeWithRxJSDebugConfigurationResolver,
} from './ui/debugConfigurationProvider';
import createRootContainer from './ui/ioc/rootContainer';
import { ILogger } from './ui/logger';

export function activate(context: vscode.ExtensionContext): void {
  const rootContainer = createRootContainer(context);
  context.subscriptions.push(rootContainer);

  for (const type of NodeWithRxJSDebugConfigurationResolver.types) {
    vscode.debug.registerDebugConfigurationProvider(
      type,
      rootContainer.get<vscode.DebugConfigurationProvider>(INodeWithRxJSDebugConfigurationResolver)
    );
  }
  registerOperatorLogPointManagementCommands(context, rootContainer);
  registerToggleOperatorLogPointDecorationCommand(context);

  rootContainer.get<ILogger>(ILogger).info('Extension', 'Ready');
}

export function deactivate(): void {
  // Nothing to do.
}
