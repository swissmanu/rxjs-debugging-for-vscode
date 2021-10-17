import * as Module from 'module';
import { TelemetryEvent } from '../../shared/telemetry';
import {
  CDP_BINDING_NAME_READY,
  CDP_BINDING_NAME_SEND_TELEMETRY,
  RUNTIME_PROGRAM_ENV_VAR,
  RUNTIME_TELEMETRY_BRIDGE,
} from '../../shared/telemetry/consts';
import serializeTelemetryEvent from '../../shared/telemetry/serialize';
import operatorLogPointInstrumentation from '../instrumentation/operatorLogPoint';
import patchObservable from '../instrumentation/operatorLogPoint/patchObservable';
import TelemetryBridge from '../telemetryBridge';

const programPath = process.env[RUNTIME_PROGRAM_ENV_VAR];
const programModule = Module.createRequire(programPath);
const createWrapOperatorFunction = operatorLogPointInstrumentation(programModule('rxjs').Subscriber);

const observableRegex = /rxjs\/(_esm5\/)?internal\/Observable/g;
const originalRequire = Module.prototype.require;
let patchedCache = null;

const telemetryBridge = new TelemetryBridge(defaultSend);
const wrapOperatorFunction = createWrapOperatorFunction(telemetryBridge);

const patchedRequire: NodeJS.Require = function (id) {
  const filename = (Module as unknown as { _resolveFilename: (id: string, that: unknown) => string })._resolveFilename(
    id,
    this
  );

  if (observableRegex.exec(filename) !== null) {
    if (patchedCache) {
      return patchedCache;
    }

    const exports = originalRequire.apply(this, [id]);
    patchObservable(exports.Observable, wrapOperatorFunction);
    patchedCache = exports;
    return exports;
  }

  return originalRequire.apply(this, [id]);
};
patchedRequire.resolve = originalRequire.resolve;
patchedRequire.cache = originalRequire.cache;
patchedRequire.extensions = originalRequire.extensions;
patchedRequire.main = originalRequire.main;
Module.prototype.require = patchedRequire;

function defaultSend(event: TelemetryEvent): void {
  const message = serializeTelemetryEvent(event);
  global[CDP_BINDING_NAME_SEND_TELEMETRY](message); // global.sendRxJsDebuggerTelemetry will be provided via CDP Runtime.addBinding eventually:
}

global[RUNTIME_TELEMETRY_BRIDGE] = telemetryBridge;

/**
 * Wait bindings to be present, then signal ready to the extension. If bindings are unavailable, retry
 */
function waitForBindings(numberOfTries = 0) {
  if (numberOfTries >= 10) {
    throw new Error('Bindings still not available after 10 tries. Abort.');
  }

  if (
    typeof global[CDP_BINDING_NAME_READY] === 'function' &&
    typeof global[CDP_BINDING_NAME_SEND_TELEMETRY] === 'function'
  ) {
    global[CDP_BINDING_NAME_READY]('');
  } else {
    setTimeout(() => waitForBindings(numberOfTries + 1), 500);
  }
}
waitForBindings();
