import { inject, injectable, interfaces } from 'inversify';
import { IDisposable } from '../../shared/types';
import { IDisposableContainer } from '../ioc/disposableContainer';
import createSessionContainer from '../ioc/sessionContainer';
import { RootContainer } from '../ioc/types';
import { ILogger } from '../logger';
import { ICDPClientAddressProvider } from './cdpClientAddressProvider';

type DebugSessionId = string;

export const ISessionManager = Symbol('ISessionManager');

export interface ISessionManager extends IDisposable {
  createSessionContainer: (debugSessionId: DebugSessionId) => Promise<interfaces.Container>;
}

@injectable()
export default class SessionManager implements ISessionManager {
  private readonly sessions: Map<DebugSessionId, IDisposableContainer> = new Map();

  constructor(
    @inject(RootContainer) private readonly rootContainer: interfaces.Container,
    @inject(ICDPClientAddressProvider) private readonly cdpClientAddressProvider: ICDPClientAddressProvider,
    @inject(ILogger) private readonly logger: ILogger
  ) {}

  async createSessionContainer(debugSessionId: DebugSessionId): Promise<interfaces.Container> {
    const sessionContainer = this.sessions.get(debugSessionId);

    if (sessionContainer) {
      this.logger.log(`Reuse SessionContainer for Debug Session ${debugSessionId}`);
      return sessionContainer;
    }

    const address = await this.cdpClientAddressProvider.getCDPClientAddress(debugSessionId);
    if (address) {
      this.logger.log(`Create SessionContainer for Debug Session ${debugSessionId}`);
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
