import { inject, injectable, interfaces } from 'inversify';
import type * as vscodeApiType from 'vscode';
import { IDisposable } from '../../shared/types';
import createSessionContainer from '../ioc/sessionContainer';
import { RootContainer, VsCodeApi } from '../ioc/types';
import { ILogger } from '../logger';
import { ICDPClientAddressProvider } from './cdpClientAddressProvider';
import { ISession } from './session';

type DebugSessionId = string;

export const ISessionManager = Symbol('ISessionManager');

export interface ISessionManager extends IDisposable {
  createSession: (debugSessionId: DebugSessionId) => Promise<ISession>;
  getSession: (debugSessionId: DebugSessionId) => ISession | undefined;
}

@injectable()
export default class SessionManager implements ISessionManager {
  private readonly sessions: Map<DebugSessionId, ISession> = new Map();
  private disposables: Array<IDisposable> = [];

  constructor(
    @inject(RootContainer) private readonly rootContainer: interfaces.Container,
    @inject(ICDPClientAddressProvider) private readonly cdpClientAddressProvider: ICDPClientAddressProvider,
    @inject(ILogger) private readonly logger: ILogger,
    @inject(VsCodeApi) vscode: typeof vscodeApiType
  ) {
    this.disposables.push(vscode.debug.onDidTerminateDebugSession(this.onDidTerminateDebugSession));
  }

  async createSession(debugSessionId: DebugSessionId): Promise<ISession> {
    const existingSession = this.sessions.get(debugSessionId);

    if (existingSession) {
      this.logger.log(`Existing Session for Debug Session ${debugSessionId}`);
      return existingSession;
    }

    const address = await this.cdpClientAddressProvider.getCDPClientAddress(debugSessionId);
    if (address) {
      this.logger.log(`Create Session for Debug Session ${debugSessionId}`);

      const newSessionContainer = createSessionContainer(this.rootContainer, `Session ${debugSessionId}`, address);
      const newSession = newSessionContainer.get<ISession>(ISession);

      this.sessions.set(debugSessionId, newSession);
      return newSession;
    }

    throw new Error('Could not get CDPClientAddress from CDPClientAddressProvider');
  }

  getSession(debugSessionId: DebugSessionId): ISession | undefined {
    return this.sessions.get(debugSessionId);
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
    this.disposables = [];

    for (const session of this.sessions.values()) {
      session.dispose();
    }
    this.sessions.clear();
  }
}
