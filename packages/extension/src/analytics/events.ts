/**
 * @see https://github.com/swissmanu/rxjs-debugging-for-vscode/blob/main/ANALYTICS.md
 */
export type AnalyticsEvents =
  | 'operator log point enabled'
  | 'operator log point disabled'
  | 'debug session started'
  | 'debug session stopped';

type NoDataPoints = Record<string, never>;

/**
 * @see https://github.com/swissmanu/rxjs-debugging-for-vscode/blob/main/ANALYTICS.md
 */
export interface AnalyticsEventDataPoints {
  'debug session started': {
    runtime: 'webpack' | 'nodejs' | 'unknown';
  };
  'debug session stopped': NoDataPoints;
  'operator log point enabled': {
    operatorName?: string;
  };
  'operator log point disabled': {
    operatorName?: string;
  };
}
