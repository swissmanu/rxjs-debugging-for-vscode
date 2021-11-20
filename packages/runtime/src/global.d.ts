/* eslint-disable no-var */
import type TelemetryBridge from './telemetryBridge';
import { RuntimeType } from './utils/runtimeType';

// Variable names MUST be kept in sync with ./const.ts!
declare global {
  // CDP_BINDING_NAME_RUNTIME_READY:
  var rxJsDebuggerRuntimeReady: (x: RuntimeType) => void | undefined;

  //CDP_BINDING_NAME_SEND_TELEMETRY
  var sendRxJsDebuggerTelemetry: (msg: string) => void | undefined;

  // RUNTIME_TELEMETRY_BRIDGE
  var rxJsDebuggerTelemetryBridge: TelemetryBridge | undefined;

  //RUNTIME_PROGRAM_ENV_VAR
  var RXJS_DEBUGGER_PROGRAM: string | undefined;
}
