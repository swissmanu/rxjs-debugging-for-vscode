/**
 * The name of a function injected via CDP bindings to a runtime environment. To be called once the debugger runtime is
 * ready for debugging.
 */
export const CDP_BINDING_NAME_READY = 'rxJsDebuggerRuntimeReady';

/**
 * The name of a function injected via CDP bindings to a runtime environment. Call it to send a `TelemetryEvent` to the
 * extensions debugger.
 */
export const CDP_BINDING_NAME_SEND_TELEMETRY = 'sendRxJsDebuggerTelemetry';

export const RUNTIME_TELEMETRY_BRIDGE = 'rxJsDebuggerTelemetryBridge';
export const RUNTIME_PROGRAM_ENV_VAR = 'RXJS_DEBUGGER_PROGRAM';
