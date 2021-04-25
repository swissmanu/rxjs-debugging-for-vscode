import { inject, injectable } from 'inversify';
import * as Telemetry from '../../shared/telemetry';
import { IDisposable } from '../../shared/types';
import LogPointManager, { ILogPointManager } from '../logPointManager';
import { ITelemetryBridge } from '../telemetryBridge';

export const ISession = Symbol('Session');

export interface ISession extends IDisposable {
  start(): Promise<void>;
}

@injectable()
export default class Session implements ISession {
  private disposables: Array<IDisposable> = [];

  constructor(
    @inject(ILogPointManager) private readonly logPointManager: LogPointManager,
    @inject(ITelemetryBridge) private readonly telemetryBridge: ITelemetryBridge
  ) {}

  async start(): Promise<void> {
    this.disposables.push(this.logPointManager.onDidChangeLogPoints(this.onDidChangeLogPoints));
    this.disposables.push(this.telemetryBridge.onTelemetryEvent(this.onTelemetryEvent));
    await this.telemetryBridge.attach();
  }

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
