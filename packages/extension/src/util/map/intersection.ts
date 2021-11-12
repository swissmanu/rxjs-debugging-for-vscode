/**
 * Apply the intersection set operation on two `Map`s. If two keys are present in both given `Map`'s, the value of the
 * first `Map`s entry is chosen.
 *
 * @param a
 * @param b
 * @returns
 */
export default function intersection<T, X>(a: Map<T, X>, b: Map<T, X>): Map<T, X> {
  const intersection = new Map();

  const [lessEntries, other] = a.size < b.size ? [a, b] : [b, a];

  for (const [key] of lessEntries) {
    if (other.has(key)) {
      intersection.set(key, a.get(key)); // TODO This additional lookup in a might hurt... But is it worse than iterating over the potential larger map?
    }
  }

  return intersection;
}
