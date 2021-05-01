import { inject, injectable } from 'inversify';
import * as Telemetry from '../../shared/telemetry';
import { EventEmitter, IDisposable, IEvent } from '../../shared/types';
import { ILogger } from '../logger';

export const ILogPointManager = Symbol('LogPointManager');

export interface ILogPointManager extends IDisposable {
  enable(fileName: string, lineNumber: number, columnNumber: number): void;
  disable(fileName: string, lineNumber: number, columnNumber: number): void;
  logPoints: ReadonlyArray<Telemetry.ITelemetryEventSource>;
  onDidChangeLogPoints: IEvent<ReadonlyArray<Telemetry.ITelemetryEventSource>>;
}

@injectable()
export default class LogPointManager implements ILogPointManager {
  private readonly _logPoints: Map<string, Telemetry.ITelemetryEventSource> = new Map();

  private _onDidChangeLogPoints = new EventEmitter<ReadonlyArray<Telemetry.ITelemetryEventSource>>();
  get onDidChangeLogPoints(): IEvent<ReadonlyArray<Telemetry.ITelemetryEventSource>> {
    return this._onDidChangeLogPoints.event;
  }

  constructor(@inject(ILogger) private readonly logger: ILogger) {}

  enable(fileName: string, lineNumber: number, columnNumber: number): void {
    const key = this.getKey(fileName, lineNumber, columnNumber);

    if (!this._logPoints.has(key)) {
      this.logger.log(`Enable log point at ${fileName}:${lineNumber}:${columnNumber}`);
      this._logPoints.set(key, {
        fileName,
        lineNumber,
        columnNumber,
      });
      this._onDidChangeLogPoints.fire(this.logPoints);
    }
  }

  disable(fileName: string, lineNumber: number, columnNumber: number): void {
    const key = this.getKey(fileName, lineNumber, columnNumber);

    if (this._logPoints.has(key)) {
      this.logger.log(`Disable log point at ${fileName}:${lineNumber}:${columnNumber}`);
      this._logPoints.delete(key);
      this._onDidChangeLogPoints.fire(this.logPoints);
    }
  }

  get logPoints(): ReadonlyArray<Telemetry.ITelemetryEventSource> {
    return [...this._logPoints.values()];
  }

  private getKey(fileName: string, lineNumber: number, columnNumber: number): string {
    return `${fileName}-${lineNumber}:${columnNumber}`;
  }

  dispose(): void {
    this._onDidChangeLogPoints.dispose();
  }
}
