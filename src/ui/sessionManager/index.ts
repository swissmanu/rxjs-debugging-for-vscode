import { inject, injectable, interfaces } from 'inversify';
import { IDisposable } from '../../shared/types';
import { IDisposableContainer } from '../ioc/disposableContainer';
import { RootContainer } from '../ioc/rootContainer';
import createSessionContainer from '../ioc/sessionContainer';
import { ICDPClientAddressProvider } from './cdpClientAddressProvider';

type DebugSessionId = string;

export const ISessionManager = Symbol('ISessionManager');

export interface ISessionManager extends IDisposable {
  getSessionContainer: (debugSessionId: DebugSessionId) => Promise<interfaces.Container>;
}

@injectable()
export default class SessionManager implements ISessionManager {
  private readonly sessions: Map<DebugSessionId, IDisposableContainer> = new Map();

  constructor(
    @inject(RootContainer) private readonly rootContainer: interfaces.Container,
    @inject(ICDPClientAddressProvider) private readonly cdpClientAddressProvider: ICDPClientAddressProvider
  ) {}

  async getSessionContainer(debugSessionId: DebugSessionId): Promise<interfaces.Container> {
    const sessionContainer = this.sessions.get(debugSessionId);

    if (sessionContainer) {
      return sessionContainer;
    }

    const address = await this.cdpClientAddressProvider(debugSessionId);
    if (address) {
      const newSessionContainer = createSessionContainer(this.rootContainer, address);
      this.sessions.set(debugSessionId, newSessionContainer);
      return newSessionContainer;
    }

    throw new Error('Could not get CDPClientAddress from CDPClientAddressProvider');
  }

  dispose(): void {
    for (const session of this.sessions.values()) {
      session.dispose();
    }
    this.sessions.clear();
  }
}
