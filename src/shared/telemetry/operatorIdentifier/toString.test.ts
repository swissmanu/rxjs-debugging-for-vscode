import toString from './toString';

describe('Telemetry', () => {
  describe('OperatorIdentifier', () => {
    describe('toString', () => {
      test('returns an IOperatorIdentifer as string', () => {
        const fileName = '/foo/bar/baz.ts';
        const line = 10;
        const character = 42;
        const operatorIndex = 2;

        expect(
          toString({
            fileName,
            character,
            line,
            operatorIndex,
          })
        ).toEqual(`${fileName}-${line}:${character}-${operatorIndex}`);
      });
    });
  });
});
