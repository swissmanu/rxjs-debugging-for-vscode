import * as Telemetry from '../shared/telemetry';
import TelemetryBridge from './telemetryBridge';

const defaultFileName = 'foo/bar.ts';
const defaultLineNumber = 42;
const defaultColumnNumber = 43;

function createEvent({
  fileName = defaultFileName,
  lineNumber = defaultLineNumber,
  columnNumber = defaultColumnNumber,
}: {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
} = {}): Telemetry.TelemetryEvent {
  return {
    type: Telemetry.TelemetryEventType.Subscribe,
    data: undefined,
    source: {
      fileName,
      lineNumber,
      columnNumber,
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
        const anotherLineNumber = createEvent({ lineNumber: 0 });
        const anotherColumnNumber = createEvent({ columnNumber: 0 });

        telemetryBridge.enable(
          enabledSource.source.fileName,
          enabledSource.source.lineNumber,
          enabledSource.source.columnNumber
        );

        telemetryBridge.forward(enabledSource);
        telemetryBridge.forward(anotherFile);
        telemetryBridge.forward(anotherLineNumber);
        telemetryBridge.forward(anotherColumnNumber);

        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith(enabledSource);
      });

      test('sends TelemetryEvent for a source which was enabled using update()', () => {
        const enabledEvent = createEvent();
        const disabledEvent = createEvent({ fileName: 'disabled.ts', lineNumber: 100, columnNumber: 1 });

        telemetryBridge.enable(
          disabledEvent.source.fileName,
          disabledEvent.source.lineNumber,
          disabledEvent.source.columnNumber
        );
        telemetryBridge.update([enabledEvent.source]); // Overwrite previously enabled source

        telemetryBridge.forward(enabledEvent);
        telemetryBridge.forward(disabledEvent);

        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith(enabledEvent);
      });

      test('does not send TelemetryEvent for a source which got disabled again', () => {
        const event = createEvent();
        telemetryBridge.enable(event.source.fileName, event.source.lineNumber, event.source.columnNumber);
        telemetryBridge.disable(event.source.fileName, event.source.lineNumber, event.source.columnNumber);

        telemetryBridge.forward(event);

        expect(send).not.toBeCalled();
      });
    });
  });
});
