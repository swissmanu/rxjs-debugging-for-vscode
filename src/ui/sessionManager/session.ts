import { inject, injectable } from 'inversify';
import { Event } from 'vscode';
import * as Telemetry from '../../shared/telemetry';
import { IDisposable } from '../../shared/types';
import { ILogger } from '../logger';
import { ILogPointManager } from '../logPoint/logPointManager';
import { ITelemetryBridge } from '../telemetryBridge';

export const ISession = Symbol('Session');

export interface ISession extends IDisposable {
  attach(): Promise<void>;
  onTelemetryEvent: Event<Telemetry.TelemetryEvent>;
}

@injectable()
export default class Session implements ISession {
  private disposables: Array<IDisposable> = [];

  private attached?: Promise<void> | undefined;
  private resolveAttached?: () => void | undefined;

  get onTelemetryEvent(): Event<Telemetry.TelemetryEvent> {
    return this.telemetryBridge.onTelemetryEvent;
  }

  constructor(
    @inject(ILogPointManager) private readonly logPointManager: ILogPointManager,
    @inject(ITelemetryBridge) private readonly telemetryBridge: ITelemetryBridge,
    @inject(ILogger) private readonly logger: ILogger
  ) {}

  attach(): Promise<void> {
    if (this.attached) {
      return this.attached;
    }

    this.attached = new Promise((resolve) => {
      this.resolveAttached = resolve;
      this.disposables.push(this.logPointManager.onDidChangeLogPoints(this.onDidChangeLogPoints));
      this.disposables.push(this.telemetryBridge.onRuntimeReady(this.onRuntimeReady));
      this.telemetryBridge.attach();
      this.logger.info('Session', 'Wait for runtime to become ready');
    });
    return this.attached;
  }

  private onRuntimeReady = (): void => {
    this.logger.info('Session', 'Runtime ready');

    if (this.resolveAttached) {
      this.resolveAttached();
    } else {
      this.logger.warn('Session', 'resolveAttached was not assigned; This should not happen.');
    }

    this.telemetryBridge.update(this.logPointManager.logPoints);
  };

  private onDidChangeLogPoints = (logPoints: ReadonlyArray<Telemetry.ITelemetryEventSource>): void => {
    this.telemetryBridge.update(logPoints);
  };

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
