import { interval } from "rxjs";
import { map, take } from "./instrument";

export function exampleObservable() {
  return interval(500).pipe(
    take(4),
    map((i) => i * 2),
    map((i) => i * 20)
  );
}
