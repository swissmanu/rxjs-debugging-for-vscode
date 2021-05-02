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
   * @param fileName
   * @param lineNumber
   * @param columnNumber
   */
  enable(fileName: string, lineNumber: number, columnNumber: number): void {
    this.enabledSources.add(this.getSourceKey(fileName, lineNumber, columnNumber));
  }

  /**
   * Disables 'TelemetryEvent's for a given source. This function is called via CDP from the extension.
   *
   * @param fileName
   * @param lineNumber
   * @param columnNumber
   */
  disable(fileName: string, lineNumber: number, columnNumber: number): void {
    this.enabledSources.delete(this.getSourceKey(fileName, lineNumber, columnNumber));
  }

  /**
   * Replaces all currently enabled `TelemetryEvent` sources with a list of new ones. This function is called via CDP
   * from the extension.
   *
   * @param sources
   */
  update(sources: ReadonlyArray<Telemetry.ITelemetryEventSource>): void {
    this.enabledSources = new Set(sources.map((s) => this.getSourceKeyForTelemetrySource(s)));
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
    return this.enabledSources.has(this.getSourceKeyForTelemetrySource(source));
  }

  private getSourceKeyForTelemetrySource({
    fileName,
    lineNumber,
    columnNumber,
  }: Telemetry.ITelemetryEventSource): SourceKey {
    return this.getSourceKey(fileName, lineNumber, columnNumber);
  }

  private getSourceKey(fileName: string, lineNumber: number, columnNumber: number): SourceKey {
    return `${fileName}-${lineNumber}:${columnNumber}`;
  }
}
