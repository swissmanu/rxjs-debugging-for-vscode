import 'reflect-metadata';
import * as vscode from 'vscode';
import registerLogPointManagementCommands from './ui/commands/logPointManagement';
import {
  INodeWithRxJSDebugConfigurationResolver,
  NodeWithRxJSDebugConfigurationResolver,
} from './ui/debugConfigurationProvider';
import createRootContainer from './ui/ioc/rootContainer';
import { ILogger } from './ui/logger';
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

  vscode.workspace.onDidChangeTextDocument(
    debounced(({ document }) => {
      logPointRecommender.recommend(document);
    }, 500)
  );

  vscode.workspace.onDidOpenTextDocument((document) => logPointRecommender.recommend(document));

  rootContainer.get<ILogger>(ILogger).info('Extension', 'Ready');
}

export function deactivate(): void {
  // Nothing to do.
}

function debounced<A>(fn: (a: A) => void, delayMs: number): (a: A) => void {
  let timeout: NodeJS.Timeout | undefined;

  return (a) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      timeout = undefined;
      fn(a);
    }, delayMs);
  };
}
