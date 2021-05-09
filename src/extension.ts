import 'reflect-metadata';
import * as vscode from 'vscode';
import registerLogPointManagementCommands from './ui/commands/logPointManagement';
import {
  INodeWithRxJSDebugConfigurationResolver,
  NodeWithRxJSDebugConfigurationResolver,
} from './ui/debugConfigurationProvider';
import createRootContainer from './ui/ioc/rootContainer';
import { ILogPointRecommender } from './ui/logPoint/logPointRecommender';

export function activate(context: vscode.ExtensionContext): void {
  const rootContainer = createRootContainer(context);
  context.subscriptions.push(rootContainer);

  vscode.debug.registerDebugConfigurationProvider(
    NodeWithRxJSDebugConfigurationResolver.type,
    rootContainer.get<vscode.DebugConfigurationProvider>(INodeWithRxJSDebugConfigurationResolver)
  );
  registerLogPointManagementCommands(context, rootContainer);

  const logPointRecommender = rootContainer.get<ILogPointRecommender>(ILogPointRecommender);

  vscode.workspace.onDidChangeTextDocument(({ document }) => {
    // TODO Debounce
    logPointRecommender.recommend(document);
  });
}

export function deactivate(): void {
  // Nothing to do.
}
