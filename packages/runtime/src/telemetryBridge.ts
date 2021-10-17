import { TelemetryEvent } from '@rxjs-debugging/telemetry';
import matchTelemetryEvent from '@rxjs-debugging/telemetry/out/match';
import { IOperatorIdentifier } from '@rxjs-debugging/telemetry/out/operatorIdentifier';
import operatorIdentifierToString from '@rxjs-debugging/telemetry/out/operatorIdentifier/toString';

/**
 * The `TelemetryBridge` manages a `Map` of `IOperatorIdentifier`s. Using a given `send` function, `forward` can send
 * `TelemetryEvent`s to the vscode extension.
 */
export default class TelemetryBridge {
  protected enabledOperatorLogPoints: Map<string, IOperatorIdentifier> = new Map();

  /**
   * @param send A function to send a TelemetryEvent to the extension
   */
  constructor(protected readonly send: (event: TelemetryEvent) => void) {}

  /**
   * Adds an `IOperatorIdentifier` to enable an operator log point. This function is called via CDP from the extension.
   *
   * @param operatorIdentifier
   */
  enableOperatorLogPoint(operatorIdentifier: IOperatorIdentifier): void {
    this.enabledOperatorLogPoints.set(operatorIdentifierToString(operatorIdentifier), operatorIdentifier);
  }

  /**
   * Removes an `IOperatorIdentifier` from the enabled operator log points. This function is called via CDP from the
   * extension.
   *
   * @param operatorIdentifier
   */
  disableOperatorLogPoint(operatorIdentifier: IOperatorIdentifier): void {
    this.enabledOperatorLogPoints.delete(operatorIdentifierToString(operatorIdentifier));
  }

  /**
   * Replaces all `IOperatorIdentifier`s with a list of new ones. This function is called via CDP from the extension.
   *
   * @param operatorIdentifiers
   */
  updateOperatorLogPoints(operatorIdentifiers: ReadonlyArray<IOperatorIdentifier>): void {
    this.enabledOperatorLogPoints = new Map(operatorIdentifiers.map((s) => [operatorIdentifierToString(s), s]));
  }

  /**
   * Forward given `TelemetryEvent` if its source is currently enabled.
   *
   * @param telemetryEvent
   */
  forward(telemetryEvent: TelemetryEvent): void {
    const isEnabled = matchTelemetryEvent({
      OperatorLogPoint: (o) => !!this.getEnabledOperatorIdentifier(o.operator),
    })(telemetryEvent);

    if (isEnabled) {
      this.send(telemetryEvent);
    }
  }

  /**
   * Tries to return an `IOperatorIdentifier` from `enabledOperatorLogPoints`. If no matching entry is present,
   * `undefined` is returned instead.
   *
   * @param operatorIdentifier
   * @returns
   */
  protected getEnabledOperatorIdentifier(operatorIdentifier: IOperatorIdentifier): IOperatorIdentifier | undefined {
    return this.enabledOperatorLogPoints.get(operatorIdentifierToString(operatorIdentifier));
  }
}
