import { inject, injectable } from 'inversify';
import * as Telemetry from '../../shared/telemetry';
import { IDisposable } from '../../shared/types';
import { ILogger } from '../logger';
import { ILogPointManager } from '../logPointManager';
import { ITelemetryBridge } from '../telemetryBridge';

export const ISession = Symbol('Session');

export interface ISession extends IDisposable {
  attach(): Promise<void>;
}

@injectable()
export default class Session implements ISession {
  private disposables: Array<IDisposable> = [];

  private attached?: Promise<void> | undefined;
  private resolveAttached?: () => void | undefined;

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
      this.disposables.push(this.telemetryBridge.onTelemetryEvent(this.onTelemetryEvent));
      this.disposables.push(this.telemetryBridge.onRuntimeReady(this.onRuntimeReady));
      this.telemetryBridge.attach();
      this.logger.log('Wait for runtime to become ready');
    });
    return this.attached;
  }

  private onRuntimeReady = (): void => {
    this.logger.log('Runtime ready');

    if (this.resolveAttached) {
      this.resolveAttached();
    } else {
      this.logger.log('resolveAttached was not assigned; This should not happen.');
    }

    this.telemetryBridge.update(this.logPointManager.logPoints);
  };

  private onDidChangeLogPoints = (logPoints: ReadonlyArray<Telemetry.ITelemetryEventSource>): void => {
    this.telemetryBridge.update(logPoints);
  };

  private onTelemetryEvent = (event: Telemetry.TelemetryEvent): void => {
    console.log(event);
  };

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
