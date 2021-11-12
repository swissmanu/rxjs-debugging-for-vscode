import difference from './intersection';

describe('Util', () => {
  describe('Map', () => {
    describe('intersection()', () => {
      test.each([
        [
          new Map<number, string>([
            [1, '1a'],
            [2, '1b'],
            [3, '1c'],
            [4, '1d'],
          ]),
          new Map([
            [1, '1a'],
            [2, '1b'],
            [3, '1c'],
            [4, '1d'],
          ]),
          new Map([
            [1, '2a'],
            [2, '2b'],
            [3, '2c'],
            [4, '2d'],
          ]),
        ],
        [
          new Map(),
          new Map([
            [1, '1a'],
            [2, '1b'],
            [3, '1c'],
            [4, '1d'],
          ]),
          new Map<number, string>(),
        ],
        [
          new Map([
            [2, '1b'],
            [3, '1c'],
            [4, '1d'],
          ]),
          new Map([
            [1, '1a'],
            [2, '1b'],
            [3, '1c'],
            [4, '1d'],
          ]),
          new Map([
            [2, '2b'],
            [3, '2c'],
            [4, '2d'],
          ]),
        ],
      ])('builds the difference %s when given %s and %s', (result, a, b) => expect(difference(a, b)).toEqual(result));
    });
  });
});
