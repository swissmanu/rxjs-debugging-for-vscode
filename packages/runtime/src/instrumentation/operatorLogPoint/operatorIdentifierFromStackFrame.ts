import StackTrace from 'stacktrace-js';
import { IOperatorIdentifier } from '@rxjs-debugging/telemetry/out/operatorIdentifier';

export default function operatorIdentifierFromStackFrame(
  stackFrame: StackTrace.StackFrame,
  operatorIndex: number
): IOperatorIdentifier {
  return {
    character: stackFrame.columnNumber || -1,
    fileName: stackFrame.fileName || '',
    line: stackFrame.lineNumber || -1,
    operatorIndex,
  };
}
