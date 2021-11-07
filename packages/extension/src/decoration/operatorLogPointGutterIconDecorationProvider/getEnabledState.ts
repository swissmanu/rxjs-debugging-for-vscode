import OperatorLogPoint from '../../operatorLogPoint';

export type EnabledState = 'all' | 'some' | 'none';

export default function getEnabledState(logPoints: ReadonlyArray<OperatorLogPoint>): EnabledState {
  if (logPoints.length === 0) {
    return 'none';
  }

  const enabledLogPoints = logPoints.filter(({ enabled }) => enabled);

  if (enabledLogPoints.length === 0) {
    return 'none';
  }

  if (enabledLogPoints.length === logPoints.length) {
    return 'all';
  }

  return 'some';
}
