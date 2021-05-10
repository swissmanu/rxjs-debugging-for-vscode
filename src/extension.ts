import 'reflect-metadata';
import * as vscode from 'vscode';
import registerLogPointManagementCommands from './ui/commands/logPointManagement';
import registerToggleLogPointDecorationCommand from './ui/commands/toggleLogPointDecoration';
import {
  INodeWithRxJSDebugConfigurationResolver,
  NodeWithRxJSDebugConfigurationResolver,
} from './ui/debugConfigurationProvider';
import createRootContainer from './ui/ioc/rootContainer';
import { ILogger } from './ui/logger';

export function activate(context: vscode.ExtensionContext): void {
  const rootContainer = createRootContainer(context);
  context.subscriptions.push(rootContainer);

  vscode.debug.registerDebugConfigurationProvider(
    NodeWithRxJSDebugConfigurationResolver.type,
    rootContainer.get<vscode.DebugConfigurationProvider>(INodeWithRxJSDebugConfigurationResolver)
  );
  registerLogPointManagementCommands(context, rootContainer);
  registerToggleLogPointDecorationCommand(context);

  rootContainer.get<ILogger>(ILogger).info('Extension', 'Ready');
}

export function deactivate(): void {
  // Nothing to do.
}
