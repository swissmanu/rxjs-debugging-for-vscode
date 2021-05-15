import type * as rxjs from 'rxjs';
import * as StackTrace from 'stacktrace-js';
import * as Telemetry from '../shared/telemetry';
import TelemetryBridge from './telemetryBridge';

export default function ({ Observable, Subscriber }: typeof rxjs): {
  operate: typeof operate;
  TelemetrySubscriber: any; // TODO remove any
} {
  function operate<T, R>(
    init: (liftedSource: rxjs.Observable<T>, subscriber: rxjs.Subscriber<R>) => (() => void) | void
  ): rxjs.OperatorFunction<T, R> {
    return (source: rxjs.Observable<T>) => {
      if (hasLift(source)) {
        return source.lift(function (this: rxjs.Subscriber<R>, liftedSource: rxjs.Observable<T>) {
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

  function hasLift(source: any): source is { lift: InstanceType<typeof Observable>['lift'] } {
    return typeof source?.lift === 'function';
  }

  class TelemetrySubscriber<T> extends Subscriber<T> {
    private source: Promise<Telemetry.ITelemetryEventSource>;

    constructor(
      private readonly telemetryBridge: TelemetryBridge,
      destination: rxjs.Subscriber<any>,
      sourceLocation: Promise<StackTrace.StackFrame[]>
    ) {
      super(destination);
      this.source = sourceLocation.then(([, f]) => sourceFromStackFrame(f));
      this.source.then((source) => {
        telemetryBridge.forward({
          type: Telemetry.TelemetryEventType.Subscribe,
          source,
          data: undefined,
        });
      });
    }

    _next(value: T): void {
      this.source.then((source) =>
        this.telemetryBridge.forward({
          type: Telemetry.TelemetryEventType.Next,
          source,
          data: { value: JSON.stringify(value) },
        })
      );
      super._next(value);
    }

    _complete(): void {
      this.source.then((source) =>
        this.telemetryBridge.forward({
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
        this.telemetryBridge.forward({
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
        this.telemetryBridge.forward({
          type: Telemetry.TelemetryEventType.Unsubscribe,
          source,
          data: undefined,
        })
      );
      super.unsubscribe();
    }
  }

  return {
    operate,
    TelemetrySubscriber,
  };
}

function sourceFromStackFrame(stackFrame: StackTrace.StackFrame): Telemetry.ITelemetryEventSource {
  return {
    character: stackFrame.columnNumber || -1,
    fileName: stackFrame.fileName || '',
    line: stackFrame.lineNumber || -1,
  };
}
