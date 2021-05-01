import { inject, injectable } from 'inversify';
import * as Telemetry from '../../shared/telemetry';
import { IDisposable } from '../../shared/types';
import { ILogPointManager } from '../logPointManager';
import { ITelemetryBridge } from '../telemetryBridge';

export const ISession = Symbol('Session');

export interface ISession extends IDisposable {
  attach(): Promise<void>;
}

@injectable()
export default class Session implements ISession {
  private disposables: Array<IDisposable> = [];
  private attached = false;

  constructor(
    @inject(ILogPointManager) private readonly logPointManager: ILogPointManager,
    @inject(ITelemetryBridge) private readonly telemetryBridge: ITelemetryBridge
  ) {}

  async attach(): Promise<void> {
    if (this.attached) {
      return;
    }

    this.attached = true;
    this.disposables.push(this.logPointManager.onDidChangeLogPoints(this.onDidChangeLogPoints));
    this.disposables.push(this.telemetryBridge.onTelemetryEvent(this.onTelemetryEvent));
    await this.telemetryBridge.attach();
    await this.telemetryBridge.update(this.logPointManager.logPoints);
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
