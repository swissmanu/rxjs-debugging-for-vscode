import { IOperatorIdentifier } from '@rxjs-debugging/telemetry/out/operatorIdentifier';
import { Position, Uri } from 'vscode';

export const enum Commands {
  EnableOperatorLogPoint = 'rxjs-debugging-for-vs-code.command.enableOperatorLogPoint',
  DisableOperatorLogPoint = 'rxjs-debugging-for-vs-code.command.disableOperatorLogPoint',
  ToggleOperatorLogPointRecommendations = 'rxjs-debugging-for-vs-code.command.toggleOperatorLogPointRecommendations',
}

export interface ICommandTypes {
  [Commands.EnableOperatorLogPoint]: (uri: Uri, position: Position, operatorIdentifier: IOperatorIdentifier) => void;
  [Commands.DisableOperatorLogPoint]: (uri: Uri, position: Position, operatorIdentifier: IOperatorIdentifier) => void;
  [Commands.ToggleOperatorLogPointRecommendations]: () => void;
}
