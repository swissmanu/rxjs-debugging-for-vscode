import { Observable, OperatorFunction, Subscriber } from 'rxjs';
import * as Telemetry from '../shared/telemetry';

function sendTelemetry<K extends Telemetry.TelemetryEventType>(
  event: Telemetry.ITelemetryEvent<K>
) {
  // global.sendRxJsDebuggerTelemetry will be provided via CDP Runtime.addBinding eventually:
  if (typeof global[Telemetry.telemetryCDPBindingName] === 'function') {
    const message = JSON.stringify(event);
    global[Telemetry.telemetryCDPBindingName](message);
  }
}

export function operate<T, R>(
  init: (
    liftedSource: Observable<T>,
    subscriber: Subscriber<R>
  ) => (() => void) | void
): OperatorFunction<T, R> {
  return (source: Observable<T>) => {
    if (hasLift(source)) {
      return source.lift(function (
        this: Subscriber<R>,
        liftedSource: Observable<T>
      ) {
        try {
          return init(liftedSource, this);
        } catch (err) {
          this.error(err);
        }
      });
    }
    throw new TypeError('Unable to lift unknown Observable type');
  };
}

function hasLift(
  source: any
): source is { lift: InstanceType<typeof Observable>['lift'] } {
  return typeof source?.lift === 'function';
}

export class TelemetrySubscriber<T> extends Subscriber<T> {
  private source: Promise<Telemetry.ITelemetryEventSource>;

  constructor(
    destination: Subscriber<any>,
    sourceLocation: Promise<StackTrace.StackFrame[]>
  ) {
    super(destination);
    this.source = sourceLocation.then(([, f]) => sourceFromStackFrame(f));
    this.source.then((source) => {
      sendTelemetry({
        type: Telemetry.TelemetryEventType.Subscribe,
        source,
        data: undefined,
      });
    });
  }

  _next(value: T): void {
    this.source.then((source) =>
      sendTelemetry({
        type: Telemetry.TelemetryEventType.Next,
        source,
        data: { value: JSON.stringify(value) },
      })
    );
    super._next(value);
  }

  _complete(): void {
    this.source.then((source) =>
      sendTelemetry({
        type: Telemetry.TelemetryEventType.Completed,
        source,
        data: undefined,
      })
    );
    super._complete();
    this.unsubscribe(); // ensure tear down
  }

  _error(err: any): void {
    this.source.then((source) =>
      sendTelemetry({
        type: Telemetry.TelemetryEventType.Error,
        source,
        data: { error: err ? JSON.stringify(err) : '' },
      })
    );
    super._error(err);
    this.unsubscribe(); // ensure tear down
  }

  unsubscribe(): void {
    this.source.then((source) =>
      sendTelemetry({
        type: Telemetry.TelemetryEventType.Unsubscribe,
        source,
        data: undefined,
      })
    );
    super.unsubscribe();
  }
}

function sourceFromStackFrame(
  stackFrame: StackTrace.StackFrame
): Telemetry.ITelemetryEventSource {
  return {
    columnNumber: stackFrame.columnNumber || -1,
    fileName: stackFrame.fileName || '',
    lineNumber: stackFrame.lineNumber || -1,
  };
}
