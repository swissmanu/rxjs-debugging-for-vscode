import { ParseFn, aString, ParserError } from 'spicery';
export type RuntimeType = 'webpack' | 'nodejs';

export const parseRuntimeType: ParseFn<RuntimeType> = (x) => {
  const s = aString(x);
  switch (s) {
    case 'nodejs':
    case 'webpack':
      return s;
    default:
      throw new ParserError('RuntimeType', s);
  }
};
