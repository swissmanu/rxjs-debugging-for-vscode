/**
 * Apply the difference set operation on two `Map`s.
 *
 * @param a
 * @param b
 * @returns
 */
export function difference<T, X>(a: Map<T, X>, b: Map<T, X>): Map<T, X> {
  const difference = new Map(a);
  for (const [keyInB] of b) {
    difference.delete(keyInB);
  }
  return difference;
}
