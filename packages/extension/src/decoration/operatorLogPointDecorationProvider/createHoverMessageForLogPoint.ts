import { MarkdownString } from 'vscode';
import * as nls from 'vscode-nls';
import { Commands } from '../../commands/commands';
import getMarkdownCommandWithArgs from '../../commands/getMarkdownCommandWithArgs';
import OperatorLogPoint from '../../operatorLogPoint';

const localize = nls.loadMessageBundle();

export default function createHoverMessageForLogPoint(operatorLogPoint: OperatorLogPoint): MarkdownString {
  const command: string = operatorLogPoint.enabled
    ? `[${localize(
        'rxjs-debugging.operatorLogPointDecoration.removeOperatorLogPoint.title',
        `Remove RxJS operator log point for "{0}"`,
        operatorLogPoint.operatorName ?? 'n/a'
      )}](${getMarkdownCommandWithArgs(Commands.DisableOperatorLogPoint, [operatorLogPoint], ([o]) => [
        OperatorLogPoint.serialize(o as OperatorLogPoint),
      ])} "${localize(
        'rxjs-debugging.operatorLogPointDecoration.removeOperatorLogPoint.description',
        'Stop logging events emitted by this operator.'
      )}")`
    : `[${localize(
        'rxjs-debugging.operatorLogPointDecoration.addOperatorLogPoint.title',
        `Add RxJS operator log point for "{0}"`,
        operatorLogPoint.operatorName ?? 'n/a'
      )}](${getMarkdownCommandWithArgs(Commands.EnableOperatorLogPoint, [operatorLogPoint], ([o]) => [
        OperatorLogPoint.serialize(o as OperatorLogPoint),
      ])} "${localize(
        'rxjs-debugging.operatorLogPointDecoration.addOperatorLogPoint.description',
        'Log events emitted by this operator.'
      )}")`;

  const hoverMessage = new MarkdownString(command, true);
  hoverMessage.isTrusted = true;

  return hoverMessage;
}
