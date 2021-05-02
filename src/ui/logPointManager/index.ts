import { inject, injectable } from 'inversify';
import { Position, Uri } from 'vscode';
import * as Telemetry from '../../shared/telemetry';
import { EventEmitter, IDisposable, IEvent } from '../../shared/types';
import { ILogger } from '../logger';

export const ILogPointManager = Symbol('LogPointManager');

export class LogPoint implements Telemetry.ITelemetryEventSource {
  public readonly position: Position;

  constructor(readonly uri: Uri, position: Position) {
    this.position = new Position(position.line, position.character); // Recreate to prevent side effects 🤷‍♂️
  }

  /**
   * @inheritdoc
   */
  get fileName(): string {
    return this.uri.fsPath;
  }

  /**
   * @inheritdoc
   */
  get line(): number {
    return this.position.line + 1;
  }

  /**
   * @inheritdoc
   */
  get character(): number {
    return this.position.character + 1;
  }

  get key(): string {
    return Telemetry.getKeyForEventSource(this);
  }

  toString(): string {
    return this.key;
  }
}

export interface ILogPointManager extends IDisposable {
  enable(uri: Uri, position: Position): void;
  disable(uri: Uri, position: Position): void;
  logPoints: ReadonlyArray<LogPoint>;
  onDidChangeLogPoints: IEvent<ReadonlyArray<Telemetry.ITelemetryEventSource>>;
}

@injectable()
export default class LogPointManager implements ILogPointManager {
  private readonly _logPoints: Map<string, LogPoint> = new Map();

  private _onDidChangeLogPoints = new EventEmitter<ReadonlyArray<Telemetry.ITelemetryEventSource>>();
  get onDidChangeLogPoints(): IEvent<ReadonlyArray<Telemetry.ITelemetryEventSource>> {
    return this._onDidChangeLogPoints.event;
  }

  constructor(@inject(ILogger) private readonly logger: ILogger) {}

  enable(uri: Uri, position: Position): void {
    const logPoint = new LogPoint(uri, position);
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
