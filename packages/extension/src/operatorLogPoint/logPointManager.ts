import { inject, injectable } from 'inversify';
import { Event, EventEmitter, Position, Uri } from 'vscode';
import OperatorLogPoint from '.';
import { IOperatorIdentifier } from '@rxjs-debugging/telemetry/out/operatorIdentifier';
import operatorIdentifierToString from '@rxjs-debugging/telemetry/out/operatorIdentifier/toString';
import { IDisposable } from '../util/types';
import { ILogger } from '../logger';

export const IOperatorLogPointManager = Symbol('OperatorLogPointManager');

export interface IOperatorLogPointManager extends IDisposable {
  enable(uri: Uri, position: Position, operatorIdentifier: IOperatorIdentifier): void;
  disable(uri: Uri, position: Position, operatorIdentifier: IOperatorIdentifier): void;
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

  enable(uri: Uri, position: Position, operatorIdentifier: IOperatorIdentifier): void {
    const logPoint = new OperatorLogPoint(uri, position, operatorIdentifier, true);
    const key = logPoint.key;

    if (!this._logPoints.has(key)) {
      this.logger.info('LogPointManager', `Enable log point at ${logPoint}`);
      this._logPoints.set(key, logPoint);
      this._onDidChangeLogPoints.fire(this.logPoints);
    }
  }

  disable(uri: Uri, position: Position, operatorIdentifier: IOperatorIdentifier): void {
    const logPoint = new OperatorLogPoint(uri, position, operatorIdentifier);
    const key = logPoint.key;

    if (this._logPoints.has(key)) {
      this.logger.info('LogPointManager', `Disable log point at ${logPoint}`);
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
