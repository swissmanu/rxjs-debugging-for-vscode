import { interfaces } from 'inversify';
import Session, { ISession } from '../sessionManager/session';
import TelemetryBridge, { ITelemetryBridge } from '../telemetryBridge';
import { ICDPClientAddress } from '../telemetryBridge/cdpClient';
import DisposableContainer, { IDisposableContainer } from './disposableContainer';

export default function createSessionContainer(
  parent: interfaces.Container,
  name: string,
  cdpClientAddress: ICDPClientAddress
): IDisposableContainer {
  const container = new DisposableContainer(name);
  container.parent = parent;

  container.bind<ICDPClientAddress>(ICDPClientAddress).toConstantValue(cdpClientAddress);

  container.bind<ISession>(ISession).to(Session).inSingletonScope().onActivation(container.trackDisposableBinding);
  container
    .bind<ITelemetryBridge>(ITelemetryBridge)
    .to(TelemetryBridge)
    .inSingletonScope()
    .onActivation(container.trackDisposableBinding);

  return container;
}
