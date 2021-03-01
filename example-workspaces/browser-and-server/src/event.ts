import { identity } from "rxjs";

export type EventType = "subscribe" | "next" | "error" | "unsubscribe" | "completed";
type TypedEvent<T extends EventType> = { type: T };

export type EventSource = {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
};
export type EventWithSource = { source: EventSource };

export type SubscribeEvent = EventWithSource & TypedEvent<"subscribe">;
export type NextEvent = EventWithSource & TypedEvent<"next"> & { value: any };
export type ErrorEvent = EventWithSource & TypedEvent<"error"> & { error: any };
export type UnsubscribeEvent = EventWithSource & TypedEvent<"unsubscribe">;
export type CompletedEvent = EventWithSource & TypedEvent<"completed">;

export type Event = SubscribeEvent | NextEvent | ErrorEvent | UnsubscribeEvent | CompletedEvent;
export type SendTelemetryFn = (event: Event) => void;

export type EventPattern<T> = {
  subscribe(event: SubscribeEvent): T;
  next(event: NextEvent): T;
  error(event: ErrorEvent): T;
  unsubscribe(event: UnsubscribeEvent): T;
  completed(event: CompletedEvent): T;
};

export function match<T>(p: EventPattern<T>): (e: Event) => T {
  return (e) => {
    switch (e.type) {
      case "completed":
        return p.completed(e);
      case "next":
        return p.next(e);
      case "error":
        return p.error(e);
      case "subscribe":
        return p.subscribe(e);
      case "completed":
        return p.completed(e);
    }
  };
}

export function serialize(event: Event): any {
  return match<any>({
    completed: identity,
    error: (errorEvent) => ({ ...errorEvent, error: JSON.stringify(errorEvent.error) }),
    next: (nextEvent) => ({ ...nextEvent, value: JSON.stringify(nextEvent.value) }),
    subscribe: identity,
    unsubscribe: identity,
  })(event);
}

export function sourceFromStackFrame(stackFrame: StackTrace.StackFrame): EventSource {
  return {
    columnNumber: stackFrame.columnNumber || -1,
    fileName: stackFrame.fileName || "",
    lineNumber: stackFrame.lineNumber || -1,
  };
}
