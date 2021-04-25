import { interfaces } from 'inversify';
import 'reflect-metadata';
import TelemetryBridge, { ITelemetryBridge } from '../telemetryBridge';
import { ICDPClientAddress } from '../telemetryBridge/cdpClient';
import DisposableContainer, { IDisposableContainer } from './disposableContainer';

export default function createSessionContainer(
  parent: interfaces.Container,
  cdpClientAddress: ICDPClientAddress
): IDisposableContainer {
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
