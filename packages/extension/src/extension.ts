import 'reflect-metadata';
import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import askToOptInToAnalyticsReporter from './analytics/askToOptInToAnalyticsReporter';
import registerOperatorLogPointManagementCommands from './commands/operatorLogPointManagement';
import registerToggleOperatorLogPointDecorationCommand from './commands/toggleOperatorLogPointGutterIcon';
import {
  INodeWithRxJSDebugConfigurationResolver,
  NodeWithRxJSDebugConfigurationResolver,
} from './debugConfigurationProvider';
import type { default as prepareForIntegrationTestType } from './integrationTest/prepareForIntegrationTest';
import createRootContainer from './ioc/rootContainer';
import { ILogger } from './logger';
import { IConfigurationAccessor } from './configuration/configurationAccessor';

nls.config({ messageFormat: nls.MessageFormat.file })();

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

  const configurationAccessor: IConfigurationAccessor = rootContainer.get(IConfigurationAccessor);
  registerOperatorLogPointManagementCommands(context, rootContainer);
  registerToggleOperatorLogPointDecorationCommand(context, configurationAccessor);

  void askToOptInToAnalyticsReporter(configurationAccessor);

  rootContainer.get<ILogger>(ILogger).info('Extension', 'Ready');
}

export function deactivate(): void {
  // Nothing to do.
}
