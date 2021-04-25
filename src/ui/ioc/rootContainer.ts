import { interfaces } from 'inversify';
import 'reflect-metadata';
import * as vscode from 'vscode';
import { ILogger } from '../logger';
import ConsoleLogger from '../logger/consoleLogger';
import SessionManager, { ISessionManager } from '../sessionManager';
import defaultCDPClientAddressProvider, { ICDPClientAddressProvider } from '../sessionManager/cdpClientAddressProvider';
import { DefaultCDPClientProvider, ICDPClientProvider } from '../telemetryBridge/cdpClientProvider';
import DisposableContainer, { IDisposableContainer } from './disposableContainer';

export const ExtensionContext = Symbol('ExtensionContext');
export const RootContainer = Symbol('RootContainer');

export default function createRootContainer(extensionContext: vscode.ExtensionContext): IDisposableContainer {
  const container = new DisposableContainer();

  container.bind<interfaces.Container>(RootContainer).toConstantValue(container);
  container.bind<vscode.ExtensionContext>(ExtensionContext).toConstantValue(extensionContext);
  container.bind<ILogger>(ILogger).to(ConsoleLogger).inSingletonScope();

  container.bind<ICDPClientAddressProvider>(ICDPClientAddressProvider).toConstantValue(defaultCDPClientAddressProvider);
  container
    .bind<ISessionManager>(ISessionManager)
    .to(SessionManager)
    .inSingletonScope()
    .onActivation(container.trackDisposableBinding);
  container.bind<ICDPClientProvider>(ICDPClientProvider).to(DefaultCDPClientProvider).inSingletonScope();

  return container;
}
