import { CDP_BINDING_NAME_RUNTIME_READY, CDP_BINDING_NAME_SEND_TELEMETRY } from '../consts';
import { RuntimeType } from './runtimeType';

/**
 * Wait for CDP bindings to be present, then signal ready to the vscode extension. If bindings are unavailable, retry
 * until 10 retries reached.
 */
export default function waitForCDPBindings(runtimeType: RuntimeType, numberOfTries = 0): void {
  if (numberOfTries >= 10) {
    throw new Error('Bindings still not available after 10 tries. Abort.');
  }

  if (
    typeof global[CDP_BINDING_NAME_RUNTIME_READY] === 'function' &&
    typeof global[CDP_BINDING_NAME_SEND_TELEMETRY] === 'function'
  ) {
    global[CDP_BINDING_NAME_RUNTIME_READY](runtimeType);
  } else {
    setTimeout(() => waitForCDPBindings(runtimeType, numberOfTries + 1), 500);
  }
}
