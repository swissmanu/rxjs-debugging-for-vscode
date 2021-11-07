import OperatorLogPoint from '.';
import { logPointFixtureA, logPointFixtureB } from './index.fixture';

describe('OperatorLogPoint', () => {
  describe('with()', () => {
    const original = logPointFixtureA;

    test('creates a copy of the OperatorLogPoint and applies given properties to the copy', () => {
      const copy = original.with({
        uri: logPointFixtureB.uri,
        sourcePosition: logPointFixtureB.sourcePosition,
        operatorIdentifier: logPointFixtureB.operatorIdentifier,
        operatorName: logPointFixtureB.operatorName,
        enabled: logPointFixtureB.enabled,
      });

      expect(copy).not.toBe(original);
      expect(copy.uri).toEqual(logPointFixtureB.uri);
      expect(copy.sourcePosition).toEqual(logPointFixtureB.sourcePosition);
      expect(copy.operatorIdentifier).toEqual(logPointFixtureB.operatorIdentifier);
      expect(copy.operatorName).toEqual(logPointFixtureB.operatorName);
      expect(copy.enabled).toEqual(logPointFixtureB.enabled);
    });
  });

  describe('serialize()', () => {
    test('returns an IOperatorLogPoint of an OperatorLogPoint', () => {
      expect(OperatorLogPoint.serialize(logPointFixtureA)).toMatchInlineSnapshot(
        `"{\\"uri\\":{\\"scheme\\":\\"\\",\\"authority\\":\\"\\",\\"path\\":\\"/foo.ts\\",\\"query\\":\\"\\",\\"fragment\\":\\"\\"},\\"sourcePosition\\":{\\"line\\":42,\\"character\\":84},\\"operatorIdentifier\\":{\\"operatorIndex\\":100,\\"fileName\\":\\"foo.ts\\",\\"line\\":101,\\"character\\":102},\\"operatorName\\":\\"take\\",\\"enabled\\":false}"`
      );
    });
  });

  describe('parse()', () => {
    test('creates an OperatorLogPoint from its serialized string representation', () => {
      expect(
        OperatorLogPoint.parse(
          '{"uri":{"scheme":"","authority":"","path":"/foo.ts","query":"","fragment":""},"sourcePosition":{"line":42,"character":84},"operatorIdentifier":{"operatorIndex":100,"fileName":"foo.ts","line":101,"character":102},"operatorName":"take","enabled":false}'
        )
      ).toEqual(logPointFixtureA);
    });
  });
});
