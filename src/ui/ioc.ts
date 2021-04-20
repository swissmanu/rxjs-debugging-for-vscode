import { Container, interfaces } from 'inversify';
import 'reflect-metadata';
import { IDisposable } from '../shared/types';
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

export function createSessionContainer(parent: Container, cdpClientAddress: ICDPClientAddress): DisposableContainer {
  const container = new DisposableContainer();
  container.parent = parent;

  container.bind<ICDPClientAddress>(ICDPClientAddress).toConstantValue(cdpClientAddress);
  container
    .bind<ITelemetryBridge>(ITelemetryBridge)
    .to(TelemetryBridge)
    .inSingletonScope()
    .onActivation(container.trackDisposableBinding);

  return container;
}

class DisposableContainer extends Container implements IDisposable {
  private readonly disposables: IDisposable[] = [];

  trackDisposableBinding = <T extends IDisposable>(_context: interfaces.Context, injectable: T) => {
    this.disposables.push(injectable);
    return injectable;
  };

  dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.unbindAll();
  }
}
