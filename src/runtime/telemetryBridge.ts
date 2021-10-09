import { TelemetryEvent } from '../shared/telemetry';
import matchTelemetryEvent from '../shared/telemetry/match';
import { IOperatorIdentifier } from '../shared/telemetry/operatorIdentifier';
import operatorIdentifierToString from '../shared/telemetry/operatorIdentifier/toString';

/**
 * The `TelemetryBridge` manages a `Set` of `IOperatorIdentifier`s. Using a given `send` function, `forward` can be used
 * to send `ITelemetryEvent`s to a receiver.
 */
export default class TelemetryBridge {
  private enabledOperatorLogPoints: Set<string> = new Set();

  constructor(private readonly send: (event: TelemetryEvent) => void) {}

  /**
   * Enables `TelemetryEvent`s for a given source. This function is called via CDP from the extension.
   *
   * @param source
   */
  enableOperatorLogPoint(source: IOperatorIdentifier): void {
    this.enabledOperatorLogPoints.add(operatorIdentifierToString(source));
  }

  /**
   * Disables 'TelemetryEvent's for a given source. This function is called via CDP from the extension.
   *
   * @param source
   */
  disableOperatorLogPoint(source: IOperatorIdentifier): void {
    this.enabledOperatorLogPoints.delete(operatorIdentifierToString(source));
  }

  /**
   * Replaces all currently enabled `TelemetryEvent` sources with a list of new ones. This function is called via CDP
   * from the extension.
   *
   * @param sources
   */
  updateOperatorLogPoints(sources: ReadonlyArray<IOperatorIdentifier>): void {
    this.enabledOperatorLogPoints = new Set(sources.map((s) => operatorIdentifierToString(s)));
  }

  /**
   * Forward given `TelemetryEvent` if its source is currently enabled.
   *
   * @param telemetryEvent
   */
  forward(telemetryEvent: TelemetryEvent): void {
    const enabled = matchTelemetryEvent({
      OperatorLogPoint: (o) => this.isOperatorLogPointEnabled(o.operator),
    })(telemetryEvent);

    if (enabled) {
      this.send(telemetryEvent);
    }
  }

  private isOperatorLogPointEnabled(operatorIdentifier: IOperatorIdentifier): boolean {
    return this.enabledOperatorLogPoints.has(operatorIdentifierToString(operatorIdentifier));
  }
}
