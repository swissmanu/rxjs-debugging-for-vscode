import * as Telemetry from '../shared/telemetry';

export default class TelemetryBridge {
  private enabled: Set<string> = new Set();

  constructor(
    private readonly send: (event: Telemetry.TelemetryEvent) => void
  ) {}

  enable(fileName: string): void {
    console.log(fileName);
    this.enabled.add(fileName);
  }

  disable(fileName: string): void {
    this.enabled.delete(fileName);
  }

  forward(event: Telemetry.TelemetryEvent): void {
    if (this.isTelemetryEnabled(event.source)) {
      this.send(event);
    }
  }

  private isTelemetryEnabled({
    fileName,
  }: Telemetry.ITelemetryEventSource): boolean {
    return this.enabled.has(fileName);
  }
}
