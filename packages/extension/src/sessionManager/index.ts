import { inject, injectable, interfaces } from 'inversify';
import * as vscodeApiType from 'vscode';
import { IAnalyticsReporter } from '../analytics';
import { hasParentDebugConfiguration } from '../debugConfigurationProvider';
import createSessionContainer from '../ioc/sessionContainer';
import { RootContainer, VsCodeApi } from '../ioc/types';
import { ILogger } from '../logger';
import { IDisposable } from '../util/types';
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
  onDidChangeActiveSession: vscodeApiType.Event<ISession | undefined>;

  /**
   * Once an actual `DebugSession` gets terminated, `onDidTerminateSession` will inform about the terminated `ISession`
   * as well.
   */
  onDidTerminateSession: vscodeApiType.Event<ISession>;
}

@injectable()
export default class SessionManager implements ISessionManager {
  private readonly sessions: Map<DebugSessionId, ISession> = new Map();
  private disposables: Array<IDisposable> = [];

  private _activeSession: ISession | undefined;
  get activeSession(): ISession | undefined {
    return this._activeSession;
  }

  private _onDidChangeActiveSession = new vscodeApiType.EventEmitter<ISession | undefined>();
  get onDidChangeActiveSession(): vscodeApiType.Event<ISession | undefined> {
    return this._onDidChangeActiveSession.event;
  }
  private _onDidTerminateSession = new vscodeApiType.EventEmitter<ISession>();
  get onDidTerminateSession(): vscodeApiType.Event<ISession> {
    return this._onDidTerminateSession.event;
  }

  constructor(
    @inject(RootContainer) private readonly rootContainer: interfaces.Container,
    @inject(ICDPClientAddressProvider) private readonly cdpClientAddressProvider: ICDPClientAddressProvider,
    @inject(IAnalyticsReporter) private readonly analyticsReporter: IAnalyticsReporter,
    @inject(ILogger) private readonly logger: ILogger,
    @inject(VsCodeApi) private readonly vscode: typeof vscodeApiType
  ) {
    this.disposables.push(
      this.vscode.debug.onDidStartDebugSession(this.onDidStartDebugSession),
      this.vscode.debug.onDidTerminateDebugSession(this.onDidTerminateDebugSession),
      this.vscode.debug.onDidChangeActiveDebugSession(this.onDidChangeActiveDebugSession)
    );
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

  private onDidStartDebugSession = async (debugSession: vscodeApiType.DebugSession) => {
    if (isSupportedDebuggingSession(debugSession) && hasParentDebugSession(debugSession)) {
      this.logger.info('SessionManager', `Create new session for freshly detected debug session "${debugSession.id}"`);

      try {
        const session = await this.createSession(debugSession.id);
        const runtimeType = await session.attach();
        this._activeSession = session;
        this._onDidChangeActiveSession.fire(session);

        this.logger.info('SessionManager', `Session ready for debug session "${debugSession.id}"`);
        this.analyticsReporter.captureDebugSessionStarted({ runtime: runtimeType ?? 'unknown' });
      } catch (e) {
        this.logger.error('SessionManager', `Could not start session for debug session "${debugSession.id}"`);
      }
    }
  };

  private onDidTerminateDebugSession = ({ id }: vscodeApiType.DebugSession) => {
    const session = this.sessions.get(id);
    if (session) {
      this.sessions.delete(id);
      session.dispose();

      this._onDidTerminateSession.fire(session);

      this.logger.info('SessionManager', `Dispose session for Debug Session "${id}"`);
      this.analyticsReporter.captureDebugSessionStopped({});
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
    this._onDidTerminateSession.dispose();

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

function isSupportedDebuggingSession({ type }: vscodeApiType.DebugSession): boolean {
  return type === 'node' || type === 'pwa-node' || type === 'pwa-chrome';
}

function hasParentDebugSession(debugSession: vscodeApiType.DebugSession): boolean {
  return hasParentDebugConfiguration(debugSession.configuration);
}
