import type * as rxjs from 'rxjs';
import * as StackTrace from 'stacktrace-js';
import { TelemetryEventType } from '../shared/telemetry';
import { ObservableEventType } from '../shared/telemetry/observableEvent';
import { IOperatorIdentifier } from '../shared/telemetry/operatorIdentifier';
import TelemetryBridge from './telemetryBridge';

/**
 * Wraps an `OperatorFunction<T, R>` so that it produces `OperatorLogPointTelemetryEvent`s.
 */
type WrapOperatorFn = (
  telemetryBridge: TelemetryBridge
) => <T, R>(operator: rxjs.OperatorFunction<T, R>, operatorIndex: number) => rxjs.OperatorFunction<T, R>;

/**
 * Creates a `WrapOperatorFn` using the `Subscriber` of a specific RxJS version provided as parameter.
 *
 * @param Subscriber
 * @returns
 */
export default function (Subscriber: typeof rxjs.Subscriber): WrapOperatorFn {
  const OperatorLogPointTelemetryEventSubscriber = createOperatorLogPointTelemetryEventSubscriber(Subscriber);

  return (
    telemetryBridge: TelemetryBridge
  ): (<T, R>(operator: rxjs.OperatorFunction<T, R>, operatorIndex: number) => rxjs.OperatorFunction<T, R>) => {
    return (operator, operatorIndex) => {
      const sourceLocation = StackTrace.get().then((sf) => {
        const sanitized = sf.slice(3);
        return sanitized;
      });

      return operate((source, subscriber) => {
        (source as any) // TODO get rid of any. Add __RxJSDebugger_originalPipe to typing?
          .__RxJSDebugger_originalPipe(operator)
          .subscribe(
            new OperatorLogPointTelemetryEventSubscriber(telemetryBridge, subscriber, sourceLocation, operatorIndex)
          );
      });
    };
  };
}

function operatorIdentifierFromStackFrame(
  stackFrame: StackTrace.StackFrame,
  operatorIndex: number
): IOperatorIdentifier {
  return {
    character: stackFrame.columnNumber || -1,
    fileName: stackFrame.fileName || '',
    line: stackFrame.lineNumber || -1,
    operatorIndex,
  };
}

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

function hasLift(source: any): source is { lift: InstanceType<typeof rxjs.Observable>['lift'] } {
  return typeof source?.lift === 'function';
}

function createOperatorLogPointTelemetryEventSubscriber(Subscriber: typeof rxjs.Subscriber) {
  return class OperatorLogPointTelemetryEventSubscriber<T> extends Subscriber<T> {
    private operatorIdentifier: Promise<IOperatorIdentifier>;

    constructor(
      private readonly telemetryBridge: TelemetryBridge,
      destination: rxjs.Subscriber<any>,
      sourceLocation: Promise<StackTrace.StackFrame[]>,
      operatorIndex: number
    ) {
      super(destination);

      this.operatorIdentifier = sourceLocation.then(([topStackFrame]) =>
        operatorIdentifierFromStackFrame(topStackFrame, operatorIndex)
      );

      this.operatorIdentifier.then((operator) => {
        telemetryBridge.forward({
          type: TelemetryEventType.OperatorLogPoint,
          observableEvent: ObservableEventType.Subscribe,
          data: undefined,
          operator,
        });
      });
    }

    _next(value: T): void {
      this.operatorIdentifier.then((operator) =>
        this.telemetryBridge.forward({
          type: TelemetryEventType.OperatorLogPoint,
          observableEvent: ObservableEventType.Next,
          data: { value: JSON.stringify(value) },
          operator,
        })
      );
      super._next(value);
    }

    _complete(): void {
      this.operatorIdentifier.then((operator) =>
        this.telemetryBridge.forward({
          type: TelemetryEventType.OperatorLogPoint,
          observableEvent: ObservableEventType.Completed,
          data: undefined,
          operator,
        })
      );
      super._complete();
      this.unsubscribe(); // ensure tear down
    }

    _error(err: any): void {
      this.operatorIdentifier.then((operator) =>
        this.telemetryBridge.forward({
          type: TelemetryEventType.OperatorLogPoint,
          observableEvent: ObservableEventType.Error,
          data: { error: err ? JSON.stringify(err) : '' },
          operator,
        })
      );
      super._error(err);
      this.unsubscribe(); // ensure tear down
    }

    unsubscribe(): void {
      this.operatorIdentifier.then((operator) =>
        this.telemetryBridge.forward({
          type: TelemetryEventType.OperatorLogPoint,
          observableEvent: ObservableEventType.Unsubscribe,
          data: undefined,
          operator,
        })
      );
      super.unsubscribe();
    }
  };
}
