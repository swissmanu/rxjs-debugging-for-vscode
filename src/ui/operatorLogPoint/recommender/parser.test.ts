import getOperatorPositions from './parser';

describe('LogPointRecommender', () => {
  describe('getOperatorPositions()', () => {
    test('returns positions for operators', async () => {
      const interval = `import { interval, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

export function exampleObservable(): Observable<number> {
  return interval(1000).pipe(
    take(4),
    map((i) => i * 2),
    map((i) => i * 20)
  );
}`;
      await expect(getOperatorPositions(interval)).resolves.toEqual([
        { position: { line: 5, character: 4 }, operatorIdentifier: { line: 5, character: 25, operatorIndex: 0 } },
        { position: { line: 6, character: 4 }, operatorIdentifier: { line: 5, character: 25, operatorIndex: 1 } },
        { position: { line: 7, character: 4 }, operatorIdentifier: { line: 5, character: 25, operatorIndex: 2 } },
      ]);
    });

    test('can handle multiple pipe statements', async () => {
      const multiplePipes = `import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

new Observable().pipe(
  map((x) => x)
);

interval(1000).pipe(
  take(4),
  map((i) => i * 2),
  map((i) => i * 20)
).pipe(
  take(4),
  map((i) => i * 2),
  map((i) => i * 20)
);
`;
      await expect(getOperatorPositions(multiplePipes)).resolves.toEqual(
        expect.arrayContaining([
          { position: { line: 4, character: 2 }, operatorIdentifier: { line: 4, character: 18, operatorIndex: 0 } },
          { position: { line: 8, character: 2 }, operatorIdentifier: { line: 8, character: 16, operatorIndex: 0 } },
          { position: { line: 9, character: 2 }, operatorIdentifier: { line: 8, character: 16, operatorIndex: 1 } },
          { position: { line: 10, character: 2 }, operatorIdentifier: { line: 8, character: 16, operatorIndex: 2 } },
          { position: { line: 12, character: 2 }, operatorIdentifier: { line: 12, character: 3, operatorIndex: 0 } },
          { position: { line: 13, character: 2 }, operatorIdentifier: { line: 12, character: 3, operatorIndex: 1 } },
          { position: { line: 14, character: 2 }, operatorIdentifier: { line: 12, character: 3, operatorIndex: 2 } },
        ])
      );
    });

    test('can handle source code with nested pipe statements', async () => {
      const nestedPipes = `import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

new Observable().pipe(
  map((x) => x),
  flatMap(x => of(x).pipe(
    map(y => y)
  ))
);
`;

      await expect(getOperatorPositions(nestedPipes)).resolves.toEqual(
        expect.arrayContaining([
          { position: { line: 4, character: 2 }, operatorIdentifier: { line: 4, character: 18, operatorIndex: 0 } },
          { position: { line: 5, character: 2 }, operatorIdentifier: { line: 4, character: 18, operatorIndex: 1 } },
          { position: { line: 6, character: 4 }, operatorIdentifier: { line: 6, character: 22, operatorIndex: 0 } },
        ])
      );
    });
  });
});
