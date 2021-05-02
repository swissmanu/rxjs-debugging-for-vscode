import * as Telemetry from '../shared/telemetry';

type SourceKey = string;

/**
 * The `TelemetryBridge` manages a set of enabled `TelemetryEvent` sources. Its management functions (`enable`,
 * `disable` and `update`) are called via CDP from the extension. The runtime can use `forward` to send a
 * `TelemetryEvent` to the extension.
 */
export default class TelemetryBridge {
  private enabledSources: Set<SourceKey> = new Set();

  constructor(private readonly send: (event: Telemetry.TelemetryEvent) => void) {}

  /**
   * Enables `TelemetryEvent`s for a given source. This function is called via CDP from the extension.
   *
   * @param source
   */
  enable(source: Telemetry.ITelemetryEventSource): void {
    this.enabledSources.add(Telemetry.getKeyForEventSource(source));
  }

  /**
   * Disables 'TelemetryEvent's for a given source. This function is called via CDP from the extension.
   *
   * @param source
   */
  disable(source: Telemetry.ITelemetryEventSource): void {
    this.enabledSources.delete(Telemetry.getKeyForEventSource(source));
  }

  /**
   * Replaces all currently enabled `TelemetryEvent` sources with a list of new ones. This function is called via CDP
   * from the extension.
   *
   * @param sources
   */
  update(sources: ReadonlyArray<Telemetry.ITelemetryEventSource>): void {
    this.enabledSources = new Set(sources.map((s) => Telemetry.getKeyForEventSource(s)));
  }

  /**
   * Forward given `TelemetryEvent` if its source is currently enabled.
   *
   * @param event
   */
  forward(event: Telemetry.TelemetryEvent): void {
    if (this.isSourceEnabled(event.source)) {
      this.send(event);
    }
  }

  private isSourceEnabled(source: Telemetry.ITelemetryEventSource): boolean {
    return this.enabledSources.has(Telemetry.getKeyForEventSource(source));
  }
}
