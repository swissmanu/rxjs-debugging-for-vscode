import type { OperatorFunction, Subscriber as RxJSSubscriber } from 'rxjs';
import StackTrace from 'stacktrace-js';
import TelemetryBridge from '../../telemetryBridge';
import createOperatorLogPointTelemetryEventSubscriber from './createOperatorLogPointTelemetrySubscriber';
import operate from './operate';
import { ORIGINAL_PIPE_PROPERTY_NAME } from './patchObservable';

/**
 * Wraps an `OperatorFunction<T, R>` so that it produces `OperatorLogPointTelemetryEvent`s.
 */
export type WrapOperatorFn = (
  telemetryBridge: TelemetryBridge
) => <T, R>(operator: OperatorFunction<T, R>, operatorIndex: number) => OperatorFunction<T, R>;

/**
 * Creates a `WrapOperatorFn` using the `Subscriber` of a specific RxJS version provided as parameter.
 *
 * @param Subscriber
 * @returns
 */
export default function (Subscriber: typeof RxJSSubscriber): WrapOperatorFn {
  const OperatorLogPointTelemetryEventSubscriber = createOperatorLogPointTelemetryEventSubscriber(Subscriber);

  return (
    telemetryBridge: TelemetryBridge
  ): (<T, R>(operator: OperatorFunction<T, R>, operatorIndex: number) => OperatorFunction<T, R>) => {
    return (operator, operatorIndex) => {
      const sourceLocation = StackTrace.get().then((sf) => {
        const sanitized = sf.slice(3);
        return sanitized;
      });

      return operate((source, subscriber) => {
        // TODO get rid of any. Add __RxJSDebugger_originalPipe to typing?
        const o = (source as any)[ORIGINAL_PIPE_PROPERTY_NAME](operator);
        o.subscribe(
          new OperatorLogPointTelemetryEventSubscriber(telemetryBridge, subscriber, sourceLocation, operatorIndex)
        );
      });
    };
  };
}
