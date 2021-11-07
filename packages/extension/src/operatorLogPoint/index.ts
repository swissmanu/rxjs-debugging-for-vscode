import { IOperatorIdentifier } from '@rxjs-debugging/telemetry/out/operatorIdentifier';
import operatorIdentifierToString from '@rxjs-debugging/telemetry/out/operatorIdentifier/toString';
import { aBoolean, aNull, aNumber, aString, fromObject, or, ParseFn, ParserError, withObject } from 'spicery';
import { Position, Uri } from 'vscode';

interface IOperatorLogPoint {
  uri: Uri;
  sourcePosition: Position;
  operatorIdentifier: IOperatorIdentifier;
  operatorName: string | null;
  enabled: boolean;
}

export default class OperatorLogPoint implements IOperatorLogPoint {
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

    readonly operatorName: string | null,

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

  with(change: Partial<IOperatorLogPoint>): OperatorLogPoint {
    return new OperatorLogPoint(
      change.uri ?? this.uri,
      change.sourcePosition ?? this.sourcePosition,
      change.operatorIdentifier ?? this.operatorIdentifier,
      change.operatorName !== undefined ? change.operatorName : this.operatorName,
      change.enabled ?? this.enabled
    );
  }

  static serialize({ uri, sourcePosition, operatorIdentifier, operatorName, enabled }: OperatorLogPoint): string {
    return JSON.stringify({
      uri: uri.toJSON(),
      sourcePosition,
      operatorIdentifier,
      operatorName,
      enabled,
    });
  }

  static parse(x: string): OperatorLogPoint {
    const json = JSON.parse(x);
    return withObject(
      (o) =>
        new OperatorLogPoint(
          fromObject(o, 'uri', anUri),
          fromObject(o, 'sourcePosition', aPosition),
          fromObject(o, 'operatorIdentifier', anOperatorIdentifier),
          fromObject(o, 'operatorName', or(aString, aNull)),
          fromObject(o, 'enabled', aBoolean)
        )
    )(json);
  }
}

const anUri: ParseFn<Uri> = withObject<Uri, Parameters<typeof Uri.from>[0]>((o) => {
  if (typeof o.scheme !== 'string') {
    throw new ParserError('Uri', JSON.stringify(o));
  }
  return Uri.from(o);
});
const aPosition: ParseFn<Position> = withObject(
  (o) => new Position(fromObject(o, 'line', aNumber), fromObject(o, 'character', aNumber))
);
const anOperatorIdentifier: ParseFn<IOperatorIdentifier> = withObject((o) => ({
  character: fromObject(o, 'character', aNumber),
  fileName: fromObject(o, 'fileName', aString),
  line: fromObject(o, 'line', aNumber),
  operatorIndex: fromObject(o, 'operatorIndex', aNumber),
}));
