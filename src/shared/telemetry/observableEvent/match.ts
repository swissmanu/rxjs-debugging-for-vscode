import { ObservableEventType, IObservableEventData } from '.';

type ObservableEventPattern<R> = {
  [T in ObservableEventType]: (data: IObservableEventData[T]) => R;
};

export default function matchObservableEvent<R>(
  pattern: ObservableEventPattern<R>
): <T extends ObservableEventType>(x: { observableEvent: T; data: IObservableEventData[T] }) => R {
  return (e) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return pattern[e.observableEvent](e.data as any); // TODO Improve Typing and get rid of any
  };
}
