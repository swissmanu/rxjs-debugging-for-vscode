export const telemetryRuntimeCDPBindingName = 'sendRxJsDebuggerTelemetry';
export const telemetryRuntimeBridgeName = 'rxJsDebuggerTelemetryBridge';

export const enum TelemetryEventType {
  Completed = 'Completed',
  Error = 'Error',
  Next = 'Next',
  Subscribe = 'Subscribe',
  Unsubscribe = 'Unsubscribe',
}

interface ITelemetryEventData {
  [TelemetryEventType.Completed]: void;
  [TelemetryEventType.Error]: { error: string };
  [TelemetryEventType.Next]: { value: string };
  [TelemetryEventType.Subscribe]: void;
  [TelemetryEventType.Unsubscribe]: void;
}

export interface ITelemetryEventSource {
  fileName: string;

  /**
   * The 1-based line index
   */
  line: number;

  /**
   * The 1-based character index
   */
  character: number;
}

export function getKeyForEventSource({ fileName, line, character }: ITelemetryEventSource): string {
  return `${fileName}-${line}:${character}`;
}

export interface ITelemetryEvent<T extends TelemetryEventType> {
  type: T;
  data: ITelemetryEventData[T];
  source: ITelemetryEventSource;
}

export type TelemetryEvent = ITelemetryEvent<
  | TelemetryEventType.Completed
  | TelemetryEventType.Error
  | TelemetryEventType.Next
  | TelemetryEventType.Subscribe
  | TelemetryEventType.Unsubscribe
>;

type TelemetryEventPattern<T> = {
  [K in TelemetryEventType]: (event: ITelemetryEvent<K>) => T;
};

export function match<T, K extends TelemetryEventType>(
  pattern: TelemetryEventPattern<T>
): (telemetryEvent: ITelemetryEvent<K>) => T {
  return (e) => {
    return pattern[e.type](e as any); // TODO Improve Typing and get rid of any
  };
}
