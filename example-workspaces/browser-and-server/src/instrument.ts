import * as WebSocket from "isomorphic-ws";
import { QueueingSubject } from "queueing-subject";
import { MonoTypeOperatorFunction, Observable, OperatorFunction, Subscriber } from "rxjs";
import * as RxOps from "rxjs/operators";
import * as Event from "./event";
import * as StackTrace from "stacktrace-js";

declare global {
  namespace NodeJS {
    interface Global {
      hook: Observable<any>;
    }
  }
  interface Window {
    hook: Observable<any>;
  }
}

const sendTelemetry: Event.SendTelemetryFn = (() => {
  const hook = new QueueingSubject<Event.Event>();
  if (typeof window !== "undefined") {
    window.hook = hook.asObservable();
  }
  if (typeof global !== "undefined") {
    global.hook = hook.asObservable();
  }

  const webSocket = new WebSocket("ws://localhost:9230");
  webSocket.onopen = () => {
    hook.subscribe((event) => {
      const json = JSON.stringify(Event.serialize(event));
      webSocket.send(json);
    });
  };

  return (event: Event.Event) => {
    hook.next(event);
  };
})();

export function map<T, R>(project: (value: T, index: number) => R): OperatorFunction<T, R> {
  const sourceLocation = StackTrace.get();
  return operate((source, subscriber) => {
    source.pipe(RxOps.map(project)).subscribe(new TelemetrySubscriber(subscriber, sourceLocation, sendTelemetry));
  });
}

export function take<T>(n: number): MonoTypeOperatorFunction<T> {
  const sourceLocation = StackTrace.get();
  return operate((source, subscriber) => {
    source.pipe(RxOps.take(n)).subscribe(new TelemetrySubscriber(subscriber, sourceLocation, sendTelemetry));
  });
}

class TelemetrySubscriber<T> extends Subscriber<T> {
  private source: Promise<Event.EventSource>;

  constructor(
    destination: Subscriber<any>,
    sourceLocation: Promise<StackTrace.StackFrame[]>,
    private sendTelemetry: Event.SendTelemetryFn
  ) {
    super(destination);
    this.source = sourceLocation.then(([, f]) => Event.sourceFromStackFrame(f));
    this.source.then((source) => {
      sendTelemetry({ type: "subscribe", source });
    });
  }

  _next(value: T) {
    this.source.then((source) => sendTelemetry({ type: "next", source, value: JSON.stringify(value) }));
    this.destination.next(value);
  }

  _complete() {
    this.source.then((source) => sendTelemetry({ type: "completed", source }));
    this.destination.complete();
    this.unsubscribe(); // ensure tear down
  }

  _error(err: any) {
    this.source.then((source) => sendTelemetry({ type: "error", source, error: err }));
    this.destination.error(err);
    this.unsubscribe(); // ensure tear down
  }

  unsubscribe() {
    this.source.then((source) => this.sendTelemetry({ type: "unsubscribe", source }));
    super.unsubscribe();
  }
}

function hasLift(source: any): source is { lift: InstanceType<typeof Observable>["lift"] } {
  return typeof source?.lift === "function";
}

function operate<T, R>(
  init: (liftedSource: Observable<T>, subscriber: Subscriber<R>) => (() => void) | void
): OperatorFunction<T, R> {
  return (source: Observable<T>) => {
    if (hasLift(source)) {
      return source.lift(function (this: Subscriber<R>, liftedSource: Observable<T>) {
        try {
          return init(liftedSource, this);
        } catch (err) {
          this.error(err);
        }
      });
    }
    throw new TypeError("Unable to lift unknown Observable type");
  };
}
