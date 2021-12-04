import { interval } from 'rxjs';
import { map, take } from 'rxjs/operators/index.js';

export default function exampleObservable() {
  return interval(1000).pipe(
    take(4),
    map((i) => i * 2),
    map((i) => i * 20)
  );
}
