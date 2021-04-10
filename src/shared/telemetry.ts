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
  lineNumber: number;
  columnNumber: number;
}

export interface ITelemetryEvent<T extends TelemetryEventType> {
  type: T;
  data: ITelemetryEventData[T];
  source: ITelemetryEventSource;
}

type TelemetryEventPattern<T> = {
  [K in TelemetryEventType]: (data: ITelemetryEventData[K]) => T;
};

export function match<T, K extends TelemetryEventType>(
  pattern: TelemetryEventPattern<T>
): (telemetryEvent: ITelemetryEvent<K>) => T {
  return (e) => {
    const data = e.data as any; // TODO Fix This Typing!
    return pattern[e.type](data);
  };
}
