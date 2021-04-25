import * as Telemetry from '../shared/telemetry';
import TelemetryBridge from './telemetryBridge';

describe('Runtime', () => {
  describe('TelemetryBridge', () => {
    const send = jest.fn();
    let telemetryBridge: TelemetryBridge;

    beforeEach(() => {
      send.mockClear();
      telemetryBridge = new TelemetryBridge(send);
    });

    describe('forward()', () => {
      test('does not send TelemetryEvent for a file which is not enabled', () => {
        telemetryBridge.forward({
          type: Telemetry.TelemetryEventType.Subscribe,
          data: undefined,
          source: {
            fileName: 'foo/bar.ts',
            lineNumber: 42,
            columnNumber: 84,
          },
        });
        expect(send).not.toBeCalled();
      });

      test('sends TelemetryEvent for a file which was enabled using enable()', () => {
        telemetryBridge.enable('foo/bar.ts');

        const event: Telemetry.TelemetryEvent = {
          type: Telemetry.TelemetryEventType.Subscribe,
          data: undefined,
          source: {
            fileName: 'foo/bar.ts',
            lineNumber: 42,
            columnNumber: 84,
          },
        };
        telemetryBridge.forward(event);
        expect(send).toHaveBeenCalledWith(event);
      });

      test('sends TelemetryEvent for a file which was enabled using update()', () => {
        telemetryBridge.enable('boing/flip.ts');
        telemetryBridge.update([{ fileName: 'foo/bar.ts', lineNumber: 42, columnNumber: 84 }]);

        const enabledEvent: Telemetry.TelemetryEvent = {
          type: Telemetry.TelemetryEventType.Subscribe,
          data: undefined,
          source: {
            fileName: 'foo/bar.ts',
            lineNumber: 42,
            columnNumber: 84,
          },
        };
        const disabledEvent: Telemetry.TelemetryEvent = {
          type: Telemetry.TelemetryEventType.Subscribe,
          data: undefined,
          source: {
            fileName: 'boing/flip.ts',
            lineNumber: 42,
            columnNumber: 84,
          },
        };

        telemetryBridge.forward(enabledEvent);
        telemetryBridge.forward(disabledEvent);

        expect(send).toHaveBeenCalledTimes(1);
        expect(send).toHaveBeenCalledWith(enabledEvent);
      });

      test('does not send TelemetryEvent for a file which got disabled', () => {
        telemetryBridge.enable('foo/bar.ts');
        telemetryBridge.disable('foo/bar.ts');

        const event: Telemetry.TelemetryEvent = {
          type: Telemetry.TelemetryEventType.Subscribe,
          data: undefined,
          source: {
            fileName: 'foo/bar.ts',
            lineNumber: 42,
            columnNumber: 84,
          },
        };
        telemetryBridge.forward(event);
        expect(send).not.toBeCalled();
      });
    });
  });
});
