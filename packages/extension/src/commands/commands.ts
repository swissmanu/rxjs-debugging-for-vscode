import OperatorLogPoint from '../operatorLogPoint';

export const enum Commands {
  EnableOperatorLogPoint = 'rxjs-debugging-for-vs-code.command.enableOperatorLogPoint',
  DisableOperatorLogPoint = 'rxjs-debugging-for-vs-code.command.disableOperatorLogPoint',
  ToggleOperatorLogPointRecommendations = 'rxjs-debugging-for-vs-code.command.toggleOperatorLogPointRecommendations',
}

export interface ICommandTypes {
  [Commands.EnableOperatorLogPoint]: (operatorLogPoint: OperatorLogPoint | string) => void;
  [Commands.DisableOperatorLogPoint]: (operatorLogPoint: OperatorLogPoint | string) => void;
  [Commands.ToggleOperatorLogPointRecommendations]: () => void;
}
