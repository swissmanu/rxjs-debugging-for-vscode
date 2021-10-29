import { TelemetryEventType } from '@rxjs-debugging/telemetry';
import { ObservableEventType } from '@rxjs-debugging/telemetry/out/observableEvent';
import { IOperatorIdentifier } from '@rxjs-debugging/telemetry/out/operatorIdentifier';
import type { Subscriber as RxJSSubscriber } from 'rxjs';
import * as StackTrace from 'stacktrace-js';
import TelemetryBridge from '../../telemetryBridge';
import operatorIdentifierFromStackFrame from './operatorIdentifierFromStackFrame';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function createOperatorLogPointTelemetryEventSubscriber(Subscriber: typeof RxJSSubscriber): any {
  // TODO can we circument the any somehow?
  return class OperatorLogPointTelemetryEventSubscriber<T> extends Subscriber<T> {
    private operatorIdentifier: Promise<IOperatorIdentifier>;

    constructor(
      private readonly telemetryBridge: TelemetryBridge,
      destination: RxJSSubscriber<any>,
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
