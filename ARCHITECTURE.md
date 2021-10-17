# Architecture Document (WIP)

## Components

```mermaid

```

## CDP Bindings

https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-addBinding

| Name                        | Payload  | Notes                                                                                        |
| --------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `rxJsDebuggerRuntimeReady`  | None     | The runtime component calls this function once it finished all preparatory work.             |
| `sendRxJsDebuggerTelemetry` | `string` | The runtime component uses this function to pass any telemetry data to the vscode extension. |
