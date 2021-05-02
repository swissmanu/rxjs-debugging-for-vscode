import * as Telemetry from '../shared/telemetry';
import TelemetryBridge from './telemetryBridge';

const defaultFileName = 'foo/bar.ts';
const defaultLine = 42;
const defaultCharacter = 43;

function createEvent({
  fileName = defaultFileName,
  line = defaultLine,
  character = defaultCharacter,
}: {
  fileName?: string;
  line?: number;
  character?: number;
} = {}): Telemetry.TelemetryEvent {
  return {
    type: Telemetry.TelemetryEventType.Subscribe,
    data: undefined,
    source: {
      fileName,
      line,
      character,
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

        telemetryBridge.enable(enabledSource.source);

        telemetryBridge.forward(enabledSource);
        telemetryBridge.forward(anotherFile);
        telemetryBridge.forward(anotherLine);
        telemetryBridge.forward(anotherCharacter);

        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith(enabledSource);
      });

      test('sends TelemetryEvent for a source which was enabled using update()', () => {
        const enabledEvent = createEvent();
        const disabledEvent = createEvent({ fileName: 'disabled.ts', line: 100, character: 1 });

        telemetryBridge.enable(disabledEvent.source);
        telemetryBridge.update([enabledEvent.source]); // Overwrite previously enabled source

        telemetryBridge.forward(enabledEvent);
        telemetryBridge.forward(disabledEvent);

        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith(enabledEvent);
      });

      test('does not send TelemetryEvent for a source which got disabled again', () => {
        const event = createEvent();
        telemetryBridge.enable(event.source);
        telemetryBridge.disable(event.source);

        telemetryBridge.forward(event);

        expect(send).not.toBeCalled();
      });
    });
  });
});
