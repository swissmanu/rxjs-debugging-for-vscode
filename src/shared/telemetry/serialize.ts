import { TelemetryEvent } from '.';

export default function serializeTelemetryEvent(telemetryEvent: TelemetryEvent): string {
  return JSON.stringify(telemetryEvent);
}
