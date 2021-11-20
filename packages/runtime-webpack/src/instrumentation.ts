import { TelemetryEvent } from '@rxjs-debugging//telemetry';
import { CDP_BINDING_NAME_SEND_TELEMETRY, RUNTIME_TELEMETRY_BRIDGE } from '@rxjs-debugging/runtime/out/consts';
import operatorLogPointInstrumentation from '@rxjs-debugging/runtime/out/instrumentation/operatorLogPoint';
import patchObservable from '@rxjs-debugging/runtime/out/instrumentation/operatorLogPoint/patchObservable';
import waitForCDPBindings from '@rxjs-debugging/runtime/out/utils/waitForCDPBindings';
import serializeTelemetryEvent from '@rxjs-debugging/telemetry/out/serialize';
import { Subscriber } from 'rxjs/internal/Subscriber';
import TelemetryBridge from './webpackTelemetryBridge';

const telemetryBridge = new TelemetryBridge((event: TelemetryEvent) => {
  const message = serializeTelemetryEvent(event);
  global[CDP_BINDING_NAME_SEND_TELEMETRY](message); // global.sendRxJsDebuggerTelemetry will be provided via CDP Runtime.addBinding eventually:
});
global[RUNTIME_TELEMETRY_BRIDGE] = telemetryBridge;

const createWrapOperatorFunction = operatorLogPointInstrumentation(Subscriber);
const wrapOperatorFunction = createWrapOperatorFunction(telemetryBridge);

export default function instrumentation(observable: Parameters<typeof patchObservable>[0]): void {
  patchObservable(observable, wrapOperatorFunction);
}

waitForCDPBindings('webpack');
