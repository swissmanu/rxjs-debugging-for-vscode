import { ILogSink, LogDomain, LogLevel } from '.';

export default class ConsoleLogSink implements ILogSink {
  log(level: LogLevel, domain: LogDomain, message: string): void {
    console.log(`${niceLogLevels[level]} (${domain}) ${message}`);
  }
}

const niceLogLevels: Record<LogLevel, string> = {
  [LogLevel.Info]: '[INFO] ',
  [LogLevel.Warn]: '[WARN] ',
  [LogLevel.Error]: '[ERROR]',
  [LogLevel.Never]: '[-]    ',
};
