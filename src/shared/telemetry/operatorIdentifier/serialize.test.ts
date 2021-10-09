import serialize from './serialize';

describe('Telemetry', () => {
  describe('OperatorIdentifier', () => {
    describe('serialize', () => {
      test('returns an IOperatorIdentifier as JSON string', () => {
        const fileName = '/foo/bar/baz.ts';
        const line = 10;
        const character = 42;
        const operatorIndex = 2;

        expect(
          serialize({
            fileName,
            character,
            line,
            operatorIndex,
          })
        ).toEqual(JSON.stringify({ character, fileName, line, operatorIndex }));
      });
    });
  });
});
