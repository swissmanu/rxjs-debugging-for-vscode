import { Position, Uri } from 'vscode';
import * as Telemetry from '../../shared/telemetry';

export class LogPoint implements Telemetry.ITelemetryEventSource {
  public readonly position: Position;

  constructor(readonly uri: Uri, position: Position, readonly enabled = false) {
    this.position = new Position(position.line, position.character); // Recreate to prevent side effects 🤷‍♂️
  }

  /**
   * @inheritdoc
   */
  get fileName(): string {
    return this.uri.fsPath;
  }

  /**
   * @inheritdoc
   */
  get line(): number {
    return this.position.line + 1;
  }

  /**
   * @inheritdoc
   */
  get character(): number {
    return this.position.character + 1;
  }

  get key(): string {
    return Telemetry.getKeyForEventSource(this);
  }

  toString(): string {
    return this.key;
  }
}
