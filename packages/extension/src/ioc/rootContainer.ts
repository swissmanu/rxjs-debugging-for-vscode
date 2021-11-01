import { interfaces } from 'inversify';
import * as vscode from 'vscode';
import { Configuration } from '../configuration';
import {
  INodeWithRxJSDebugConfigurationResolver,
  NodeWithRxJSDebugConfigurationResolver,
} from '../debugConfigurationProvider';
import DecorationManager, { IDecorationManager } from '../decoration/decorationManager';
import { default as DefaultDecorationSetter, IDecorationSetter } from '../decoration/decorationSetter';
import Logger, { ILogger, logLevelFromString } from '../logger';
import ConsoleLogSink from '../logger/console';
import LogPointManager, { IOperatorLogPointManager } from '../operatorLogPoint/logPointManager';
import OperatorLogPointRecommender, { IOperatorLogPointRecommender } from '../operatorLogPoint/recommender';
import DefaultResourceProvider, { IResourceProvider } from '../resources';
import SessionManager, { ISessionManager } from '../sessionManager';
import DefaultCDPClientAddressProvider, { ICDPClientAddressProvider } from '../sessionManager/cdpClientAddressProvider';
import { DefaultCDPClientProvider, ICDPClientProvider } from '../telemetryBridge/cdpClientProvider';
import WorkspaceMonitor, { IWorkspaceMonitor } from '../workspaceMonitor';
import { IRxJSDetector, RxJSDetector } from '../workspaceMonitor/detector';
import DisposableContainer, { IDisposableContainer } from './disposableContainer';
import { ExtensionContext, RootContainer, VsCodeApi } from './types';

interface Testables {
  DecorationSetter: { new (): IDecorationSetter };
}

const defaultTestables: Testables = {
  DecorationSetter: DefaultDecorationSetter,
};

export default function createRootContainer(
  extensionContext: vscode.ExtensionContext,
  { DecorationSetter }: Testables = defaultTestables
): IDisposableContainer {
  const container = new DisposableContainer('Root');

  container.bind<typeof vscode>(VsCodeApi).toConstantValue(vscode);

  container.bind<interfaces.Container>(RootContainer).toConstantValue(container);
  container.bind<vscode.ExtensionContext>(ExtensionContext).toConstantValue(extensionContext);

  const logger = new Logger(
    [new ConsoleLogSink()],
    logLevelFromString(vscode.workspace.getConfiguration().get(Configuration.LogLevel, 'Never'))
  );
  container.bind<ILogger>(ILogger).toConstantValue(logger);

  container.bind<IResourceProvider>(IResourceProvider).to(DefaultResourceProvider).inTransientScope();

  container
    .bind<IWorkspaceMonitor>(IWorkspaceMonitor)
    .to(WorkspaceMonitor)
    .inSingletonScope()
    .onActivation(container.trackDisposableBinding);

  container.bind<IRxJSDetector>(IRxJSDetector).to(RxJSDetector).inSingletonScope();
  container
    .bind<vscode.DebugConfigurationProvider>(INodeWithRxJSDebugConfigurationResolver)
    .to(NodeWithRxJSDebugConfigurationResolver)
    .inSingletonScope();

  container
    .bind<IOperatorLogPointRecommender>(IOperatorLogPointRecommender)
    .to(OperatorLogPointRecommender)
    .inSingletonScope()
    .onActivation(container.trackDisposableBinding);
  container.bind<IOperatorLogPointManager>(IOperatorLogPointManager).to(LogPointManager).inSingletonScope();

  container.bind<IDecorationSetter>(IDecorationSetter).to(DecorationSetter).inSingletonScope();
  container
    .bind<IDecorationManager>(IDecorationManager)
    .to(DecorationManager)
    .inSingletonScope()
    .onActivation(container.trackDisposableBinding);

  container
    .bind<ISessionManager>(ISessionManager)
    .to(SessionManager)
    .inSingletonScope()
    .onActivation(container.trackDisposableBinding);
  container
    .bind<ICDPClientAddressProvider>(ICDPClientAddressProvider)
    .to(DefaultCDPClientAddressProvider)
    .inSingletonScope();

  container.bind<ICDPClientProvider>(ICDPClientProvider).to(DefaultCDPClientProvider).inSingletonScope();

  // Ensure necessary components are initialized and active by default:
  container.get<ISessionManager>(ISessionManager);
  container.get<IDecorationManager>(IDecorationManager);
  container.get<IWorkspaceMonitor>(IWorkspaceMonitor);

  return container;
}
