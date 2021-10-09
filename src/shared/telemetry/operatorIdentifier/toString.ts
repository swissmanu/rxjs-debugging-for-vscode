import { IOperatorIdentifier } from '.';

export default function operatorIdentifierToString({
  fileName,
  line,
  character,
  operatorIndex,
}: IOperatorIdentifier): string {
  return `${fileName}-${line}:${character}-${operatorIndex}`;
}
