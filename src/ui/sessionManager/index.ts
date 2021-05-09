import { inject, injectable, interfaces } from 'inversify';
import type * as vscodeApiType from 'vscode';
import { EventEmitter, IDisposable, IEvent } from '../../shared/types';
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

  readonly activeSession: ISession | undefined;

  /**
   * When a user selects a debug session, the `SessionManager` will try to find the related session and fires then a
   * `didChangeActiveSession` event.
   */
  onDidChangeActiveSession: IEvent<ISession | undefined>;
}

@injectable()
export default class SessionManager implements ISessionManager {
  private readonly sessions: Map<DebugSessionId, ISession> = new Map();
  private disposables: Array<IDisposable> = [];

  private _activeSession: ISession | undefined;
  get activeSession(): ISession | undefined {
    return this._activeSession;
  }

  private _onDidChangeActiveSession = new EventEmitter<ISession | undefined>();
  get onDidChangeActiveSession(): IEvent<ISession | undefined> {
    return this._onDidChangeActiveSession.event;
  }

  constructor(
    @inject(RootContainer) private readonly rootContainer: interfaces.Container,
    @inject(ICDPClientAddressProvider) private readonly cdpClientAddressProvider: ICDPClientAddressProvider,
    @inject(ILogger) private readonly logger: ILogger,
    @inject(VsCodeApi) private readonly vscode: typeof vscodeApiType
  ) {
    this.disposables.push(this.vscode.debug.onDidStartDebugSession(this.onDidStartDebugSession));
    this.disposables.push(this.vscode.debug.onDidTerminateDebugSession(this.onDidTerminateDebugSession));
    this.disposables.push(this.vscode.debug.onDidChangeActiveDebugSession(this.onDidChangeActiveDebugSession));
  }

  async createSession(debugSessionId: DebugSessionId): Promise<ISession> {
    const existingSession = this.sessions.get(debugSessionId);

    if (existingSession) {
      this.logger.info('SessionManager', `Reuse Existing Session for Debug Session ${debugSessionId}`);
      return existingSession;
    }

    const address = await this.cdpClientAddressProvider.getCDPClientAddress(debugSessionId);
    if (address) {
      this.logger.info('SessionManager', `Create Session for Debug Session ${debugSessionId}`);

      const newSessionContainer = createSessionContainer(this.rootContainer, `Session ${debugSessionId}`, address);
      const newSession = newSessionContainer.get<ISession>(ISession);

      this.sessions.set(debugSessionId, newSession);
      return newSession;
    }

    this.logger.error('SessionManager', `Could not get CDPClientAddress for debug session with id "${debugSessionId}"`);
    throw new Error('Could not get CDPClientAddress from CDPClientAddressProvider');
  }

  getSession(debugSessionId: DebugSessionId): ISession | undefined {
    return this.sessions.get(debugSessionId);
  }

  private onDidStartDebugSession = async ({ id, type }: vscodeApiType.DebugSession) => {
    // js-debug creates multiple debug sessions in a parent-child relationship.
    // We cannot know on which we can connect to via CDP. Hence we simply try every debug session we detect.
    // This might end up in some error logs, but in the end, also with at least on working CDP connection.
    if (type === 'node' || type == 'pwa-node') {
      this.logger.info('SessionManager', `Create new session for freshly detected debug session "${id}"`);

      try {
        const session = await this.createSession(id);
        await session.attach();
        this._activeSession = session;
        this._onDidChangeActiveSession.fire(session);

        this.logger.info('SessionManager', `Session ready for debug session "${id}"`);
        this.vscode.window.showInformationMessage('Ready to debug!');
      } catch (e) {
        this.logger.error('SessionManager', `Could not start session for debug session "${id}"`);
      }
    }
  };

  private onDidTerminateDebugSession = ({ id }: vscodeApiType.DebugSession) => {
    const session = this.sessions.get(id);
    if (session) {
      this.logger.info('SessionManager', `Dispose session for Debug Session "${id}"`);
      this.sessions.delete(id);
      session.dispose();
    }
  };

  private onDidChangeActiveDebugSession = (debugSession: vscodeApiType.DebugSession | undefined) => {
    if (!debugSession) {
      this._activeSession = undefined;
      this._onDidChangeActiveSession.fire(undefined);
    } else {
      const session = this.sessions.get(debugSession.id);
      if (session) {
        this._activeSession = session;
        this._onDidChangeActiveSession.fire(session);
      }
    }
  };

  dispose(): void {
    this._onDidChangeActiveSession.dispose();

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
