import 'reflect-metadata';
import * as vscode from 'vscode';
import registerOperatorLogPointManagementCommands from './commands/operatorLogPointManagement';
import registerToggleOperatorLogPointDecorationCommand from './commands/toggleOperatorLogPointGutterIcon';
import {
  INodeWithRxJSDebugConfigurationResolver,
  NodeWithRxJSDebugConfigurationResolver,
} from './debugConfigurationProvider';
import type { default as prepareForIntegrationTestType } from './integrationTest/prepareForIntegrationTest';
import createRootContainer from './ioc/rootContainer';
import { ILogger } from './logger';

// prepareForIntegrationTest might be injected during build time. See rollup.config.js
declare const prepareForIntegrationTest: typeof prepareForIntegrationTestType | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const rootContainer = createRootContainer(
    context,
    typeof prepareForIntegrationTest === 'function' ? prepareForIntegrationTest(context) : undefined
  );
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
