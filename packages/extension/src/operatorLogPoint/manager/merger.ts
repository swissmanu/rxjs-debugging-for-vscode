import { IOperatorIdentifier } from '@rxjs-debugging/telemetry/out/operatorIdentifier';
import OperatorLogPoint from '..';
import intersection from '../../util/map/intersection';

export interface IOperatorLogPointMerger {
  /**
   *
   * @param prev
   * @param next
   */
  merge(prev: ReadonlyArray<OperatorLogPoint>, next: ReadonlyArray<OperatorLogPoint>): ReadonlyArray<OperatorLogPoint>;
}

/**
 * Once the user changes source code which has enabled `OperatorLogPoints`, `OperatorLogPointUpdater` tries to match
 * previously enabled log points to the new source code.
 *
 * Example: An observable has two operators, `map` and `take`. The user enables an operator log point for `map`. Later,
 * the user adds a new operator *before* `map`. `OperatorLogPointUpdater` ensures that the enabled log point still
 * points to `map` instead of the newly added operator which took its place.
 *
 * This is a very basic implementation of a merger to start with, but it seems to be sufficient for now :-)
 */
export default class BasicOperatorLogPointMerger implements IOperatorLogPointMerger {
  merge(
    prev_: ReadonlyArray<OperatorLogPoint>,
    next_: ReadonlyArray<OperatorLogPoint>
  ): ReadonlyArray<OperatorLogPoint> {
    const prev = groupByFile(prev_);
    const next = groupByFile(next_);

    const filesWhichGotRecommendedAgain = intersection(next, prev);

    const stillRelevantEnabledLogPoints: OperatorLogPoint[] = [];
    for (const [file, nextByOperatorIdentifier] of filesWhichGotRecommendedAgain) {
      const prevByOperatorIdentifier = prev.get(file);
      if (!prevByOperatorIdentifier) {
        continue;
      }

      for (const [prevOperatorIdentifierKey, prevLogPoints] of prevByOperatorIdentifier) {
        const nextLogPoints = nextByOperatorIdentifier.get(prevOperatorIdentifierKey);

        if (nextLogPoints) {
          for (const nextLogPoint of nextLogPoints) {
            const prevEnabledLogPointCandidateFound = !!findEnabledCandidateForLogPoint(prevLogPoints, nextLogPoint);

            if (prevEnabledLogPointCandidateFound) {
              stillRelevantEnabledLogPoints.push(nextLogPoint.with({ enabled: true }));
            }
          }
        }
      }
    }

    return stillRelevantEnabledLogPoints;
  }
}

function groupByFile(
  operatorLogPoints: ReadonlyArray<OperatorLogPoint>
): Map<string, Map<string, ReadonlyArray<OperatorLogPoint>>> {
  const byFilePath: Map<string, Map<string, OperatorLogPoint[]>> = new Map();

  for (const operatorLogPoint of operatorLogPoints) {
    const path = operatorLogPoint.uri.toString();
    const byOperatorIdentifier = byFilePath.get(path);

    if (byOperatorIdentifier) {
      const operatorIdentifierKey = keyForOperatorIdentifier(operatorLogPoint.operatorIdentifier);
      const logPoints = byOperatorIdentifier.get(operatorIdentifierKey);

      if (logPoints) {
        logPoints.push(operatorLogPoint);
      } else {
        byOperatorIdentifier.set(operatorIdentifierKey, [operatorLogPoint]);
      }
    } else {
      byFilePath.set(
        path,
        new Map([[keyForOperatorIdentifier(operatorLogPoint.operatorIdentifier), [operatorLogPoint]]])
      );
    }
  }

  return byFilePath;
}

function keyForOperatorIdentifier({ line, character }: IOperatorIdentifier): string {
  return `${line}:${character}`;
}

function findEnabledCandidateForLogPoint(
  prevLogPoints: readonly OperatorLogPoint[],
  nextLogPoint: OperatorLogPoint
): OperatorLogPoint | undefined {
  return prevLogPoints.find(
    (prevLogPoint) =>
      prevLogPoint.enabled &&
      prevLogPoint.operatorIdentifier.operatorIndex === nextLogPoint.operatorIdentifier.operatorIndex &&
      prevLogPoint.operatorName === nextLogPoint.operatorName
  );
}
