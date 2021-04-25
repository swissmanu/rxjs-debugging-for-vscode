import * as Telemetry from '../shared/telemetry';

export default class TelemetryBridge {
  private enabled: Set<string> = new Set();

  constructor(private readonly send: (event: Telemetry.TelemetryEvent) => void) {}

  enable(fileName: string): void {
    this.enabled.add(fileName);
  }

  disable(fileName: string): void {
    this.enabled.delete(fileName);
  }

  /**
   * Replace all enabled `ITelemetryEventSource`s with a new list.
   *
   * @param sources
   */
  update(sources: ReadonlyArray<Telemetry.ITelemetryEventSource>): void {
    this.enabled = new Set(sources.map(({ fileName }) => fileName));
  }

  /**
   * Forward given `TelemetryEvent` if its source is currently enabled.
   *
   * @param event
   */
  forward(event: Telemetry.TelemetryEvent): void {
    if (this.isTelemetryEnabled(event.source)) {
      this.send(event);
    }
  }

  private isTelemetryEnabled({ fileName }: Telemetry.ITelemetryEventSource): boolean {
    return this.enabled.has(fileName);
  }
}
