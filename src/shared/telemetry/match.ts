import { TelemetryEvent, TelemetryEventType } from '.';

type TelemetryEventPattern<R> = {
  [T in TelemetryEventType]: (telemetryEvent: TelemetryEvent) => R;
};

export default function matchTelemetryEvent<R>(
  pattern: TelemetryEventPattern<R>
): (telemetryEvent: TelemetryEvent) => R {
  return (e) => {
    switch (e.type) {
      case TelemetryEventType.OperatorLogPoint:
        return pattern.OperatorLogPoint(e);
    }
  };
}
