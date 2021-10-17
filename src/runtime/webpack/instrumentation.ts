import { Subscriber } from 'rxjs/internal/Subscriber';
import { TelemetryEvent } from '../../shared/telemetry';
import { CDP_BINDING_NAME_SEND_TELEMETRY, RUNTIME_TELEMETRY_BRIDGE } from '../../shared/telemetry/consts';
import serializeTelemetryEvent from '../../shared/telemetry/serialize';
import operatorLogPointInstrumentation from '../instrumentation/operatorLogPoint';
import patchObservable from '../instrumentation/operatorLogPoint/patchObservable';
import waitForCDPBindings from '../utils/waitForCDPBindings';
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

waitForCDPBindings();
