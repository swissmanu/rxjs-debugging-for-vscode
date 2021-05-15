import { inject, injectable, interfaces } from 'inversify';
import * as vscodeApiType from 'vscode';
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
        await session.attach();
        this._activeSession = session;
        this._onDidChangeActiveSession.fire(session);

        this.logger.info('SessionManager', `Session ready for debug session "${debugSession.id}"`);
      } catch (e) {
        this.logger.error('SessionManager', `Could not start session for debug session "${debugSession.id}"`);
      }
    }
  };

  private onDidTerminateDebugSession = ({ id }: vscodeApiType.DebugSession) => {
    const session = this.sessions.get(id);
    if (session) {
      this.logger.info('SessionManager', `Dispose session for Debug Session "${id}"`);
      this.sessions.delete(id);
      session.dispose();

      this._onDidTerminateSession.fire(session);
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
  return type === 'node' || type == 'pwa-node';
}

/**
 * This function checks the presence uf the `__parentId` property in the configuration of a `DebugSession` to determine
 * if a debug session has a parent session.
 *
 * ## Context
 * vscode-js-debug creates debug sessions with a parent-child dependency. The child session is usually the actual
 * debugging session holding the CDP connection to the application under inspection. Such a child session can be
 * identified by the presence of the `__parentId` property in its configuration. This property is private API and might
 * change in the future. Use with care.
 *
 * @param debugSession
 * @returns
 * @see Could be improved once https://github.com/microsoft/vscode/issues/123403 is resolved.
 */
function hasParentDebugSession(debugSession: vscodeApiType.DebugSession): boolean {
  const { __parentId }: vscodeApiType.DebugConfiguration & { __parentId?: string } = debugSession.configuration;
  return typeof __parentId === 'string';
}
