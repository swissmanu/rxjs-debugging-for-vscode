import { TelemetryEventType } from '.';
import { ObservableEventType } from './observableEvent';
import serializeTelemetryEvent from './serialize';
describe('telemetry', () => {
  describe('serializeTelemetryEvent()', () => {
    test('serializes an OperatorLogPoint TelemetryEvent', () => {
      expect(
        serializeTelemetryEvent({
          type: TelemetryEventType.OperatorLogPoint,
          observableEvent: ObservableEventType.Next,
          data: { value: 'foobar' },
          operator: {
            fileName: 'foo.ts',
            character: 1,
            line: 2,
            operatorIndex: 3,
          },
        })
      ).toMatchInlineSnapshot(
        `"{\\"type\\":\\"OperatorLogPoint\\",\\"observableEvent\\":\\"Next\\",\\"data\\":{\\"value\\":\\"foobar\\"},\\"operator\\":{\\"fileName\\":\\"foo.ts\\",\\"character\\":1,\\"line\\":2,\\"operatorIndex\\":3}}"`
      );
    });
  });
});
