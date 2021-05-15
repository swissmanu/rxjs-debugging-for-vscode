import { injectable } from 'inversify';

export const enum LogLevel {
  Info = 0,
  Warn,
  Error,
  Never,
}

export function logLevelFromString(s: string, defaultLogLevel = LogLevel.Never): LogLevel {
  switch (s) {
    case 'Info':
      return LogLevel.Info;
    case 'Warn':
      return LogLevel.Warn;
    case 'Error':
      return LogLevel.Error;
    case 'Never':
      return LogLevel.Never;
    default:
      return defaultLogLevel;
  }
}

export type LogDomain =
  | 'Extension'
  | 'IoC'
  | 'LogPointManager'
  | 'SessionManager'
  | 'Session'
  | 'DecorationManager'
  | 'LogPointRecommender'
  | 'WorkspaceMonitor';

export const ILogger = Symbol('ILogger');

export interface ILogger {
  log(level: LogLevel, domain: LogDomain, message: string): void;
  info(domain: LogDomain, message: string): void;
  warn(domain: LogDomain, message: string): void;
  error(domain: LogDomain, message: string): void;
}

export interface ILogSink {
  log: (level: LogLevel, domain: LogDomain, message: string) => void;
}

@injectable()
export default class Logger implements ILogger {
  constructor(
    private readonly sinks: ReadonlyArray<ILogSink>,
    private readonly minLogLevel: LogLevel = LogLevel.Never
  ) {}

  log(level: LogLevel, domain: LogDomain, message: string): void {
    if (level < this.minLogLevel) {
      return;
    }

    for (const target of this.sinks) {
      target.log(level, domain, message);
    }
  }

  info(domain: LogDomain, message: string): void {
    this.log(LogLevel.Info, domain, message);
  }

  warn(domain: LogDomain, message: string): void {
    this.log(LogLevel.Warn, domain, message);
  }

  error(domain: LogDomain, message: string): void {
    this.log(LogLevel.Error, domain, message);
  }

  /**
   * Create a `Logger` that never logs nothing.
   *
   * @returns
   */
  static nullLogger(): ILogger {
    return new Logger([]);
  }
}
