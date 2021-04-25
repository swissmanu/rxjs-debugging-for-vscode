import { inject, injectable, interfaces } from 'inversify';
import { IDisposable } from '../../shared/types';
import { IDisposableContainer } from '../ioc/disposableContainer';
import createSessionContainer from '../ioc/sessionContainer';
import { RootContainer, VsCodeApi } from '../ioc/types';
import { ILogger } from '../logger';
import { ICDPClientAddressProvider } from './cdpClientAddressProvider';
import type * as vscodeApiType from 'vscode';

type DebugSessionId = string;

export const ISessionManager = Symbol('ISessionManager');

export interface ISessionManager extends IDisposable {
  createSessionContainer: (debugSessionId: DebugSessionId) => Promise<interfaces.Container>;
}

@injectable()
export default class SessionManager implements ISessionManager {
  private readonly sessions: Map<DebugSessionId, IDisposableContainer> = new Map();
  private readonly disposables: Array<IDisposable> = [];

  constructor(
    @inject(RootContainer) private readonly rootContainer: interfaces.Container,
    @inject(ICDPClientAddressProvider) private readonly cdpClientAddressProvider: ICDPClientAddressProvider,
    @inject(ILogger) private readonly logger: ILogger,
    @inject(VsCodeApi) vscode: typeof vscodeApiType
  ) {
    this.disposables.push(vscode.debug.onDidTerminateDebugSession(this.onDidTerminateDebugSession));
  }

  async createSessionContainer(debugSessionId: DebugSessionId): Promise<interfaces.Container> {
    const sessionContainer = this.sessions.get(debugSessionId);

    if (sessionContainer) {
      this.logger.log(`Reuse SessionContainer for Debug Session ${debugSessionId}`);
      return sessionContainer;
    }

    const address = await this.cdpClientAddressProvider.getCDPClientAddress(debugSessionId);
    if (address) {
      this.logger.log(`Create SessionContainer for Debug Session ${debugSessionId}`);

      const newSessionContainer = createSessionContainer(this.rootContainer, `Session ${debugSessionId}`, address);

      this.sessions.set(debugSessionId, newSessionContainer);
      return newSessionContainer;
    }

    throw new Error('Could not get CDPClientAddress from CDPClientAddressProvider');
  }

  private onDidTerminateDebugSession = ({ id }: vscodeApiType.DebugSession) => {
    const session = this.sessions.get(id);
    if (session) {
      this.logger.log(`Dispose session for Debug Session "${id}"`);
      this.sessions.delete(id);
      session.dispose();
    }
  };

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }

    for (const session of this.sessions.values()) {
      session.dispose();
    }
    this.sessions.clear();
  }
}
