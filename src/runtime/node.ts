import * as Module from 'module';
import * as path from 'path';
import * as StackTrace from 'stacktrace-js';
import * as Telemetry from '../shared/telemetry';
import { operate, TelemetrySubscriber } from './rx';
import TelemetryBridge from './telemetryBridge';

const origLoad = (Module as any)._load;
(Module as any)._load = fakeLoad;

const telemetryBridge = new TelemetryBridge(defaultSend);

function getAbsolutePath(relativePath: string, parentFileName: string): string {
  if (relativePath.startsWith('/') || /^(\w|@)/.test(relativePath)) {
    return relativePath;
  } else {
    return path.resolve(path.dirname(parentFileName), relativePath);
  }
}

function fakeLoad(request: string, parent?: { filename: string }, isMain?: boolean) {
  const absolutePath = parent ? getAbsolutePath(request, parent.filename) : request;

  if (absolutePath.indexOf('rxjs/internal/operators/') > -1) {
    const result = origLoad(request, parent, isMain);
    const name = path.basename(request);

    if (typeof result[name] === 'function') {
      const originalOperator = result[name];
      return {
        ...result,
        [name]: function (...args: unknown[]) {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const originalThis = this;
          const sourceLocation = StackTrace.get();

          return operate((source, subscriber) => {
            source
              .pipe(originalOperator.apply(originalThis, args))
              .subscribe(new TelemetrySubscriber(telemetryBridge, subscriber, sourceLocation));
          });
        },
      };
    }
    return result;
  }
  return origLoad(request, parent, isMain);
}

function defaultSend(event: Telemetry.TelemetryEvent): void {
  // global.sendRxJsDebuggerTelemetry will be provided via CDP Runtime.addBinding eventually:
  const message = JSON.stringify(event);
  global[Telemetry.CDP_BINDING_NAME_SEND_TELEMETRY](message);
}

global[Telemetry.RUNTIME_TELEMETRY_BRIDGE] = telemetryBridge;

/**
 * Wait bindings to be present, then signal ready to the extension. If bindings are unavailable, retry
 */
function waitForBindings(numberOfTries = 0) {
  if (numberOfTries >= 10) {
    throw new Error('Bindings still not available after 10 tries. Abort.');
  }

  if (
    typeof global[Telemetry.CDP_BINDING_NAME_READY] === 'function' &&
    typeof global[Telemetry.CDP_BINDING_NAME_SEND_TELEMETRY] === 'function'
  ) {
    global[Telemetry.CDP_BINDING_NAME_READY]('');
  } else {
    setTimeout(() => waitForBindings(numberOfTries + 1), 500);
  }
}
waitForBindings();
