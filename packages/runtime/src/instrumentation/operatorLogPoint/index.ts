import type { OperatorFunction, Subscriber as RxJSSubscriber, Observable } from 'rxjs';
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
        if (hasOriginalPipe(source)) {
          const operated = source[ORIGINAL_PIPE_PROPERTY_NAME](operator);
          operated.subscribe(
            new OperatorLogPointTelemetryEventSubscriber(telemetryBridge, subscriber, sourceLocation, operatorIndex)
          );
        }
      });
    };
  };
}

function hasOriginalPipe<T>(
  o: Observable<T> & { [ORIGINAL_PIPE_PROPERTY_NAME]?: typeof Observable.prototype['pipe'] }
): o is Observable<T> & { [ORIGINAL_PIPE_PROPERTY_NAME]: typeof Observable.prototype['pipe'] } {
  return typeof o[ORIGINAL_PIPE_PROPERTY_NAME] === 'function';
}
