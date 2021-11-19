import { RuntimeType } from '@rxjs-debugging/runtime/out/utils/runtimeType';
import { TelemetryEvent } from '@rxjs-debugging/telemetry';
import { inject, injectable } from 'inversify';
import { Event } from 'vscode';
import { ILogger } from '../logger';
import OperatorLogPoint from '../operatorLogPoint';
import { IOperatorLogPointManager } from '../operatorLogPoint/manager';
import { ITelemetryBridge } from '../telemetryBridge';
import { IDisposable } from '../util/types';

export const ISession = Symbol('Session');

export interface ISession extends IDisposable {
  attach(): Promise<RuntimeType | undefined>;
  onTelemetryEvent: Event<TelemetryEvent>;
}

@injectable()
export default class Session implements ISession {
  private disposables: Array<IDisposable> = [];

  private attached?: Promise<RuntimeType | undefined> | undefined;
  private resolveAttached?: (runtimeType: RuntimeType | undefined) => void | undefined;

  get onTelemetryEvent(): Event<TelemetryEvent> {
    return this.telemetryBridge.onTelemetryEvent;
  }

  constructor(
    @inject(IOperatorLogPointManager) private readonly operatorLogPointManager: IOperatorLogPointManager,
    @inject(ITelemetryBridge) private readonly telemetryBridge: ITelemetryBridge,
    @inject(ILogger) private readonly logger: ILogger
  ) {}

  attach(): Promise<RuntimeType | undefined> {
    if (this.attached) {
      return this.attached;
    }

    this.attached = new Promise((resolve) => {
      this.resolveAttached = resolve;
      this.disposables.push(this.operatorLogPointManager.onDidChangeLogPoints(this.onDidChangeLogPoints));
      this.disposables.push(this.telemetryBridge.onRuntimeReady(this.onRuntimeReady));
      this.telemetryBridge.attach();
      this.logger.info('Session', 'Wait for runtime to become ready');
    });
    return this.attached;
  }

  private onRuntimeReady = (runtimeType: RuntimeType | undefined): void => {
    if (runtimeType) {
      this.logger.info('Session', `${runtimeType} runtime ready`);
    } else {
      this.logger.warn('Session', 'Unknown runtime ready');
    }

    if (this.resolveAttached) {
      this.resolveAttached(runtimeType);
    } else {
      this.logger.warn('Session', 'resolveAttached was not assigned; This should not happen.');
    }

    this.telemetryBridge.updateOperatorLogPoints(
      this.operatorLogPointManager.logPoints.map(({ operatorIdentifier }) => operatorIdentifier)
    );
  };

  private onDidChangeLogPoints = (logPoints: ReadonlyArray<OperatorLogPoint>): void => {
    this.telemetryBridge.updateOperatorLogPoints(logPoints.map(({ operatorIdentifier }) => operatorIdentifier));
  };

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
