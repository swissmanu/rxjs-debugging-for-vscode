import { Position, Uri } from 'vscode';
import { IOperatorIdentifier } from '../../shared/telemetry/operatorIdentifier';
import operatorIdentifierToString from '../../shared/telemetry/operatorIdentifier/toString';

export default class OperatorLogPoint {
  /**
   * The position of the underlying operator in the source code.
   */
  public readonly sourcePosition: Position;

  constructor(
    readonly uri: Uri,
    sourcePosition: Position,

    /**
     * The `IOperatorIdentifier` allowing to identify the underlying operator of this log point across vscode and the
     * runtime. See `IOperatorIdentifier` for more details.
     *
     * @see IOperatorIdentifier
     */
    readonly operatorIdentifier: IOperatorIdentifier,

    readonly enabled = false
  ) {
    this.sourcePosition = new Position(sourcePosition.line, sourcePosition.character); // Recreate to prevent side effects 🤷‍♂️
  }

  get key(): string {
    return operatorIdentifierToString(this.operatorIdentifier);
  }

  toString(): string {
    return this.key;
  }
}
