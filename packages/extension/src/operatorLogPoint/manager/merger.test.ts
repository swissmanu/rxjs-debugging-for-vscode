import 'reflect-metadata';
import { Position } from 'vscode';
import { logPointFixtureA } from '../index.fixture';
import OperatorLogPointMerger, { IOperatorLogPointMerger } from './merger';

/* This piece of code is the basis for the following tests:

  01234567801234
0 interval(10).pipe(
1  take(1),
2  map(x => x),            // Enabled Log Point
3  flatMap(x => of(x))
4 )

The OperatorLogPoints below match this code snippet accordingly:
*/
const logPointTake = logPointFixtureA.with({
  operatorName: 'take',
  sourcePosition: new Position(1, 1),
  operatorIdentifier: {
    fileName: '',
    line: 0,
    character: 14,
    operatorIndex: 0,
  },
});
const logPointMap = logPointFixtureA.with({
  enabled: true,
  operatorName: 'map',
  sourcePosition: new Position(2, 1),
  operatorIdentifier: {
    fileName: '',
    line: 0,
    character: 14,
    operatorIndex: 1,
  },
});
const logPointFlatMap = logPointFixtureA.with({
  operatorName: 'flatMap',
  sourcePosition: new Position(3, 1),
  operatorIdentifier: {
    fileName: '',
    line: 0,
    character: 14,
    operatorIndex: 2,
  },
});

describe('OperatorLogPointMerger', () => {
  let merger: IOperatorLogPointMerger;

  beforeEach(() => {
    merger = new OperatorLogPointMerger();
  });

  test('keeps enabled log points, which are still recommended and did not change', () => {
    const prev = [logPointMap];
    const next = prev;
    const result = merger.merge(prev, next);

    expect(result).toEqual(prev);
  });

  test('discards enabled log points, which are not recommended anymore', () => {
    const prev = [logPointMap];
    const result = merger.merge(prev, []);

    expect(result).toHaveLength(0);
  });

  test('does not return log points, which are newly recommended', () => {
    const next = [logPointMap];
    const result = merger.merge([], next);

    expect(result).toEqual([]);
  });

  test('merges enabled log points, which got a new source position', () => {
    /* Updated code:
        01234567801234
      0 interval(10).pipe(
      1  take(1),
      2                              // <-- Blank, new line added
      3  map(x => x),                // Expected to get an updated log point for this operator
      4  flatMap(x => of(x))
      5 )
      */
    const prev = [logPointMap];
    const next = [
      logPointTake,
      logPointMap.with({ sourcePosition: new Position(3, 1) }),
      logPointFlatMap.with({ sourcePosition: new Position(4, 1) }),
    ];
    const result = merger.merge(prev, next);

    expect(result).toEqual([logPointMap.with({ sourcePosition: new Position(3, 1) })]);
  });
});
