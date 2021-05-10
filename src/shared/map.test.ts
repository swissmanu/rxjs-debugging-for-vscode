import { difference } from './map';

describe('difference()', () => {
  test.each([
    [
      new Map<number, string>(),
      new Map([
        [1, 'a'],
        [2, 'b'],
        [3, 'c'],
        [4, 'd'],
      ]),
      new Map([
        [1, 'a'],
        [2, 'b'],
        [3, 'c'],
        [4, 'd'],
      ]),
    ],
    [
      new Map([
        [1, 'a'],
        [2, 'b'],
        [3, 'c'],
        [4, 'd'],
      ]),
      new Map([
        [1, 'a'],
        [2, 'b'],
        [3, 'c'],
        [4, 'd'],
      ]),
      new Map<number, string>(),
    ],
    [
      new Map([
        [2, 'b'],
        [3, 'c'],
        [4, 'd'],
      ]),
      new Map([
        [1, 'a'],
        [2, 'b'],
        [3, 'c'],
        [4, 'd'],
      ]),
      new Map([[1, 'a']]),
    ],
  ])('builds the difference %s when given %s and %s', (result, a, b) => expect(difference(a, b)).toEqual(result));
});
