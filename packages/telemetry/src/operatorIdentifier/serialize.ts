import { IOperatorIdentifier } from '.';

export default function serializeOperatorIdentifier({
  character,
  fileName,
  line,
  operatorIndex,
}: IOperatorIdentifier): string {
  return JSON.stringify({ character, fileName, line, operatorIndex });
}
