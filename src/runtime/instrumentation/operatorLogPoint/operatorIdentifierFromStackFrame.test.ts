import StackTrace from 'stacktrace-js';
import operatorIdentifierFromStackFrame from './operatorIdentifierFromStackFrame';

describe('Runtime', () => {
  describe('Operator Log Point Instrumentation', () => {
    describe('operatorIdentifierFromStackFrame()', () => {
      const lineNumber = 42;
      const columnNumber = 43;
      const fileName = 'some/file.js';
      const operatorIndex = 44;

      test('returns an OperatorIdentifier based on given StackFrame and operator index', () => {
        expect(
          operatorIdentifierFromStackFrame(
            {
              lineNumber,
              fileName,
              columnNumber,
            } as StackTrace.StackFrame,
            operatorIndex
          )
        ).toEqual({
          character: columnNumber,
          line: lineNumber,
          fileName,
          operatorIndex,
        });
      });

      test('returns an OperatorIdentifier with defaulted character, fileName and line if unavailable', () => {
        expect(operatorIdentifierFromStackFrame({} as StackTrace.StackFrame, operatorIndex)).toEqual({
          character: -1,
          line: -1,
          fileName: '',
          operatorIndex,
        });
      });
    });
  });
});
