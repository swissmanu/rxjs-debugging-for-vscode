export const ILogger = Symbol('ILogger');

export interface ILogger {
  log(message: string): void;
}
