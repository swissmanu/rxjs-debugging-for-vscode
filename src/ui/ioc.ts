import { Container } from 'inversify';
import 'reflect-metadata';
import { ILogger } from './logger';
import ConsoleLogger from './logger/consoleLogger';
import TelemetryBridge, { ITelemetryBridge } from './telemetryBridge';
import { ICDPClientAddress } from './telemetryBridge/cdpClient';
import { DefaultCDPClientProvider, ICDPClientProvider } from './telemetryBridge/cdpClientProvider';

export function createRootContainer(): Container {
  const container = new Container();

  container.bind<ILogger>(ILogger).to(ConsoleLogger).inSingletonScope();
  container.bind<ICDPClientProvider>(ICDPClientProvider).to(DefaultCDPClientProvider).inSingletonScope();

  return container;
}

export function createSessionContainer(parent: Container, cdpClientAddress: ICDPClientAddress): Container {
  const container = new Container();
  container.parent = parent;

  container.bind<ICDPClientAddress>(ICDPClientAddress).toConstantValue(cdpClientAddress);
  container.bind<ITelemetryBridge>(ITelemetryBridge).to(TelemetryBridge).inSingletonScope();
  return container;
}
