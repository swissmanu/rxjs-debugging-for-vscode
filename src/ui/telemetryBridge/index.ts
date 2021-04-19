import { Disposable, Event, EventEmitter } from 'vscode';
import * as Telemetry from '../../shared/telemetry';
import CDPClient from './cdpClient';

export default class TelemetryBridge implements Disposable {
  private cdpClient: CDPClient | undefined;

  private _onTelemetryEvent = new EventEmitter<Telemetry.TelemetryEvent>();
  get onTelemetryEvent(): Event<Telemetry.TelemetryEvent> {
    return this._onTelemetryEvent.event;
  }

  async attach(host: string, port: number): Promise<void> {
    if (this.cdpClient) {
      throw new Error('Cannot attach when already attached to CDP');
    }

    try {
      this.cdpClient = new CDPClient(host, port);
      await this.cdpClient.connect();
      await Promise.all([
        await this.cdpClient.request('Runtime', 'enable'),
        await this.cdpClient.request('Runtime', 'addBinding', {
          name: Telemetry.telemetryRuntimeCDPBindingName,
        }),
        await this.cdpClient.subscribe(
          'Runtime',
          'bindingCalled',
          this.onBindingCalled
        ),
      ]);
    } catch (e) {
      this.dispose();
      throw e;
    }
  }

  async enable(source: Telemetry.ITelemetryEventSource): Promise<void> {
    return this.cdpClient?.request('Runtime', 'evaluate', {
      expression: `${Telemetry.telemetryRuntimeBridgeName}.enable("${source.fileName}", ${source.lineNumber}, ${source.columnNumber});`,
    });
  }

  async disable(source: Telemetry.ITelemetryEventSource): Promise<void> {
    return this.cdpClient?.request('Runtime', 'evaluate', {
      expression: `${Telemetry.telemetryRuntimeBridgeName}.disable("${source.fileName}", ${source.lineNumber}, ${source.columnNumber});`,
    });
  }

  private onBindingCalled = (parameters: Record<string, unknown>): void => {
    if (
      parameters.name === Telemetry.telemetryRuntimeCDPBindingName &&
      typeof parameters.payload === 'string'
    ) {
      try {
        const json: Telemetry.TelemetryEvent = JSON.parse(parameters.payload); // TODO fix any cast?
        this._onTelemetryEvent.fire(json);
      } catch (e) {
        console.error(JSON.stringify(e)); // TODO
      }
    }
  };

  dispose(): void {
    this._onTelemetryEvent.dispose();
    this.cdpClient?.dispose();
    this.cdpClient = undefined;
  }
}
