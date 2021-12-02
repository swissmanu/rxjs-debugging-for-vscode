import { ILogger } from '../../logger';
import OperatorLogPoint from '../../operatorLogPoint';
import { IOperatorLogPointManager } from '../../operatorLogPoint/manager';

export default function disableOperatorLogPoint(
  operatorLogPointManager: IOperatorLogPointManager,
  logger: ILogger
): (operatorLogPoint: string | OperatorLogPoint) => Thenable<void> {
  return async (operatorLogPoint) => {
    if (typeof operatorLogPoint === 'string') {
      try {
        const parsed = OperatorLogPoint.parse(operatorLogPoint);
        operatorLogPointManager.disable(parsed);
      } catch (e) {
        logger.warn(
          'Extension',
          `Tried to enable serialized OperatorLogPoint, but could not parse it. ("${operatorLogPoint}")`
        );
      }
    } else {
      operatorLogPointManager.disable(operatorLogPoint);
    }
  };
}
