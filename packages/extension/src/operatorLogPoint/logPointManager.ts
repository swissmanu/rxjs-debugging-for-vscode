import { IOperatorIdentifier } from '@rxjs-debugging/telemetry/out/operatorIdentifier';
import operatorIdentifierToString from '@rxjs-debugging/telemetry/out/operatorIdentifier/toString';
import { inject, injectable } from 'inversify';
import { Event, EventEmitter } from 'vscode';
import OperatorLogPoint from '.';
import { ILogger } from '../logger';
import { IDisposable } from '../util/types';

export const IOperatorLogPointManager = Symbol('OperatorLogPointManager');

export interface IOperatorLogPointManager extends IDisposable {
  enable(operatorLogPoint: OperatorLogPoint): void;
  disable(operatorLogPoint: OperatorLogPoint): void;
  logPoints: ReadonlyArray<OperatorLogPoint>;
  logPointForIdentifier(operatorIdentifier: IOperatorIdentifier): OperatorLogPoint | undefined;
  onDidChangeLogPoints: Event<ReadonlyArray<OperatorLogPoint>>;
}

@injectable()
export default class LogPointManager implements IOperatorLogPointManager {
  private readonly _logPoints: Map<string, OperatorLogPoint> = new Map();

  private _onDidChangeLogPoints = new EventEmitter<ReadonlyArray<OperatorLogPoint>>();
  get onDidChangeLogPoints(): Event<ReadonlyArray<OperatorLogPoint>> {
    return this._onDidChangeLogPoints.event;
  }

  constructor(@inject(ILogger) private readonly logger: ILogger) {}

  enable(operatorLogPoint: OperatorLogPoint): void {
    const enabledOperatorLogPoint = operatorLogPoint.with({ enabled: true });
    const { key } = enabledOperatorLogPoint;

    if (!this._logPoints.has(key)) {
      this.logger.info('LogPointManager', `Enable log point at ${enabledOperatorLogPoint}`);
      this._logPoints.set(key, enabledOperatorLogPoint);
      this._onDidChangeLogPoints.fire(this.logPoints);
    }
  }

  disable(operatorLogPoint: OperatorLogPoint): void {
    const disabledOperatorLogPoint = operatorLogPoint.with({ enabled: false });
    const { key } = disabledOperatorLogPoint;

    if (this._logPoints.has(key)) {
      this.logger.info('LogPointManager', `Disable log point at ${disabledOperatorLogPoint}`);
      this._logPoints.delete(key);
      this._onDidChangeLogPoints.fire(this.logPoints);
    }
  }

  get logPoints(): ReadonlyArray<OperatorLogPoint> {
    return [...this._logPoints.values()];
  }

  logPointForIdentifier(operatorIdentifier: IOperatorIdentifier): OperatorLogPoint | undefined {
    return this._logPoints.get(operatorIdentifierToString(operatorIdentifier));
  }

  dispose(): void {
    this._onDidChangeLogPoints.dispose();
  }
}
