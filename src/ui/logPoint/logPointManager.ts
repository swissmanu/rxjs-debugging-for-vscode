import { inject, injectable } from 'inversify';
import { Event, EventEmitter, Position, Uri } from 'vscode';
import { LogPoint } from '.';
import { IDisposable } from '../../shared/types';
import { ILogger } from '../logger';

export const ILogPointManager = Symbol('LogPointManager');

export interface ILogPointManager extends IDisposable {
  enable(uri: Uri, position: Position): void;
  disable(uri: Uri, position: Position): void;
  logPoints: ReadonlyArray<LogPoint>;
  onDidChangeLogPoints: Event<ReadonlyArray<LogPoint>>;
}

@injectable()
export default class LogPointManager implements ILogPointManager {
  private readonly _logPoints: Map<string, LogPoint> = new Map();

  private _onDidChangeLogPoints = new EventEmitter<ReadonlyArray<LogPoint>>();
  get onDidChangeLogPoints(): Event<ReadonlyArray<LogPoint>> {
    return this._onDidChangeLogPoints.event;
  }

  constructor(@inject(ILogger) private readonly logger: ILogger) {}

  enable(uri: Uri, position: Position): void {
    const logPoint = new LogPoint(uri, position, true);
    const key = logPoint.key;

    if (!this._logPoints.has(key)) {
      this.logger.info('LogPointManager', `Enable log point at ${logPoint}`);
      this._logPoints.set(key, logPoint);
      this._onDidChangeLogPoints.fire(this.logPoints);
    }
  }

  disable(uri: Uri, position: Position): void {
    const logPoint = new LogPoint(uri, position);
    const key = logPoint.key;

    if (this._logPoints.has(key)) {
      this.logger.info('LogPointManager', `Disable log point at ${logPoint}`);
      this._logPoints.delete(key);
      this._onDidChangeLogPoints.fire(this.logPoints);
    }
  }

  get logPoints(): ReadonlyArray<LogPoint> {
    return [...this._logPoints.values()];
  }

  dispose(): void {
    this._onDidChangeLogPoints.dispose();
  }
}
