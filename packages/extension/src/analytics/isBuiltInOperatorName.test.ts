import isBuiltInOperatorName, { knownBuiltInOperatorNames } from './isBuiltInOperatorName';

describe('Analytics', () => {
  describe('isBuiltInOperatorName()', () => {
    test.each(knownBuiltInOperatorNames.map((s) => [s]))('returns true for %s', (operatorName) => {
      expect(isBuiltInOperatorName(operatorName)).toBe(true);
    });

    test.each([['myCustomOperator'], ['FLATMAP'], ['SwitchMap']])('returns false for %s', (operatorName) => {
      expect(isBuiltInOperatorName(operatorName)).toBe(false);
    });
  });
});
