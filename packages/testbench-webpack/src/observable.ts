import { interval, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

export function exampleObservable(): Observable<number> {
  return interval(1000).pipe(
    take(4),
    map((i) => i * 2),
    map((i) => i * 20)
  );
}
