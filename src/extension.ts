import 'reflect-metadata';
import * as vscode from 'vscode';
import { ILogPointRecommender } from './ui/codeAnalysis/logPointRecommender';
import registerLogPointManagementCommands from './ui/commands/logPointManagement';
import {
  INodeWithRxJSDebugConfigurationResolver,
  NodeWithRxJSDebugConfigurationResolver,
} from './ui/debugConfigurationProvider';
import { ILogPointDecorationProvider } from './ui/decoration/logPointDecorationProvider';
import { ILogPointHoverProvider } from './ui/hover/hoverProvider';
import createRootContainer from './ui/ioc/rootContainer';

export function activate(context: vscode.ExtensionContext): void {
  const rootContainer = createRootContainer(context);
  context.subscriptions.push(rootContainer);

  registerLogPointManagementCommands(context, rootContainer);

  vscode.debug.registerDebugConfigurationProvider(
    NodeWithRxJSDebugConfigurationResolver.type,
    rootContainer.get<vscode.DebugConfigurationProvider>(INodeWithRxJSDebugConfigurationResolver)
  );

  const logPointRecommender = rootContainer.get<ILogPointRecommender>(ILogPointRecommender);
  const logPointDecorationProvider = rootContainer.get<ILogPointDecorationProvider>(ILogPointDecorationProvider);
  const logPointHoverProvider = rootContainer.get<ILogPointHoverProvider>(ILogPointHoverProvider);

  if (vscode.window.activeTextEditor) {
    logPointDecorationProvider.attach(vscode.window.activeTextEditor);
    logPointHoverProvider.attach(vscode.window.activeTextEditor);
  }

  vscode.workspace.onDidChangeTextDocument(({ document }) => {
    logPointRecommender.recommend(document);
  });

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      logPointRecommender.onRecommendLogPoints(({ uri, logPoints }) => {
        if (uri.toString() === editor.document.uri.toString()) {
          logPointDecorationProvider.update(logPoints);
          logPointHoverProvider.update(logPoints);
        }
      });

      logPointRecommender.recommend(editor.document);

      logPointDecorationProvider.attach(editor);
      logPointHoverProvider.attach(editor);
    } else {
      logPointDecorationProvider.detach();
      logPointHoverProvider.detach();
    }
  });
}

export function deactivate(): void {
  // Nothing to do.
}
