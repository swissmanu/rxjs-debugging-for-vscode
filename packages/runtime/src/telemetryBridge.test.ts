import { OperatorLogPointTelemetryEvent, TelemetryEventType } from '@rxjs-debugging/telemetry';
import { ObservableEventType } from '@rxjs-debugging/telemetry/out/observableEvent';
import TelemetryBridge from './telemetryBridge';

const defaultFileName = 'foo/bar.ts';
const defaultLine = 42;
const defaultCharacter = 43;
const defaultOperatorIndex = 44;

function createEvent({
  fileName = defaultFileName,
  line = defaultLine,
  character = defaultCharacter,
  operatorIndex = defaultOperatorIndex,
}: {
  fileName?: string;
  line?: number;
  character?: number;
  operatorIndex?: number;
} = {}): OperatorLogPointTelemetryEvent {
  return {
    type: TelemetryEventType.OperatorLogPoint,
    data: undefined,
    observableEvent: ObservableEventType.Subscribe,
    operator: {
      character,
      fileName,
      line,
      operatorIndex,
    },
  };
}

describe('Runtime', () => {
  describe('TelemetryBridge', () => {
    const send = jest.fn();
    let telemetryBridge: TelemetryBridge;

    beforeEach(() => {
      send.mockClear();
      telemetryBridge = new TelemetryBridge(send);
    });

    describe('forward()', () => {
      test('does not send TelemetryEvent for a source which is not enabled', () => {
        telemetryBridge.forward(createEvent());
        expect(send).not.toBeCalled();
      });

      test('sends TelemetryEvent for a source which was enabled using enable()', () => {
        const enabledSource = createEvent();
        const anotherFile = createEvent({ fileName: 'another.ts' });
        const anotherLine = createEvent({ line: 0 });
        const anotherCharacter = createEvent({ character: 0 });

        telemetryBridge.enableOperatorLogPoint(enabledSource.operator);

        telemetryBridge.forward(enabledSource);
        telemetryBridge.forward(anotherFile);
        telemetryBridge.forward(anotherLine);
        telemetryBridge.forward(anotherCharacter);

        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith(enabledSource);
      });

      test('sends TelemetryEvent for a source which was enabled using update()', () => {
        const enabledEvent = createEvent();
        const disabledEvent = createEvent({
          fileName: 'disabled.ts',
          line: 100,
          character: 1,
        });

        telemetryBridge.enableOperatorLogPoint(disabledEvent.operator);
        telemetryBridge.updateOperatorLogPoints([enabledEvent.operator]); // Overwrite previously enabled source

        telemetryBridge.forward(enabledEvent);
        telemetryBridge.forward(disabledEvent);

        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith(enabledEvent);
      });

      test('does not send TelemetryEvent for a source which got disabled again', () => {
        const event = createEvent();
        telemetryBridge.enableOperatorLogPoint(event.operator);
        telemetryBridge.disableOperatorLogPoint(event.operator);

        telemetryBridge.forward(event);

        expect(send).not.toBeCalled();
      });
    });
  });
});
