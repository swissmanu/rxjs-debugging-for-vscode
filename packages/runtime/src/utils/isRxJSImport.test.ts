import isRxJSImport from './isRxJSImport';

describe('Runtime', () => {
  describe('isRxJSImport()', () => {
    test.each([
      [true, '/node_modules/rxjs/dist/esm5/internal/Observable.js'],
      [true, '/node_modules/rxjs/dist/esm5/internal/Observable'],
      [true, '/node_modules/rxjs/esm5/internal/Observable.js'],
      [true, '/node_modules/rxjs/esm5/internal/Observable'],
      [true, '/node_modules/rxjs/_esm5/internal/Observable.js'],
      [true, '/node_modules/rxjs/_esm5/internal/Observable'],
      [true, '/node_modules/rxjs/_esm2015/internal/Observable.js'],
      [true, '/node_modules/rxjs/_esm2015/internal/Observable'],
      [true, '/node_modules/rxjs/internal/Observable.js'],
      [true, '/node_modules/rxjs/internal/Observable'],
      [true, 'rxjs/internal/Observable'],
      [false, 'rxjs'],
      [false, 'rxjs/Observable'],
      [false, 'Observable'],
      [false, ''],
    ])('returns %s for %s', (expected, path) => {
      expect(isRxJSImport(path)).toBe(expected);
    });
  });
});
