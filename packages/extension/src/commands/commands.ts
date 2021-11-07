import OperatorLogPoint from '../operatorLogPoint';

export const enum Commands {
  EnableOperatorLogPoint = 'rxjs-debugging-for-vs-code.command.enableOperatorLogPoint',
  DisableOperatorLogPoint = 'rxjs-debugging-for-vs-code.command.disableOperatorLogPoint',
  ToggleOperatorLogPointGutterIcon = 'rxjs-debugging-for-vs-code.command.toggleOperatorLogPointGutterIcon',
}

export interface ICommandTypes {
  [Commands.EnableOperatorLogPoint]: (operatorLogPoint: OperatorLogPoint | string) => void;
  [Commands.DisableOperatorLogPoint]: (operatorLogPoint: OperatorLogPoint | string) => void;
  [Commands.ToggleOperatorLogPointGutterIcon]: () => void;
}
