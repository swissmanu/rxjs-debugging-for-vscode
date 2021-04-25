import { inject, injectable } from 'inversify';
import * as Telemetry from '../../shared/telemetry';
import { EventEmitter, IDisposable, IEvent } from '../../shared/types';
import { ILogger } from '../logger';
import { ICDPClient, ICDPClientAddress } from './cdpClient';
import { ICDPClientProvider } from './cdpClientProvider';

export const ITelemetryBridge = Symbol('ITelemetryBridge');

export interface ITelemetryBridge extends IDisposable {
  attach(): Promise<void>;

  /**
   * Enable one specific `ITelemetryEventSource` to the runtime.
   *
   * @param source
   */
  enable(source: Telemetry.ITelemetryEventSource): Promise<void>;

  /**
   * Disable one specific `ITelemetryEventSource` in the runtime.
   *
   * @param source
   */
  disable(source: Telemetry.ITelemetryEventSource): Promise<void>;

  /**
   * Send a list of `ITelemetryEventSource`s to the runtime. The runtime will replace currently enabled log point
   * sources with this new list.
   *
   * @param sources
   */
  update(sources: ReadonlyArray<Telemetry.ITelemetryEventSource>): Promise<void>;

  onTelemetryEvent: IEvent<Telemetry.TelemetryEvent>;
}
@injectable()
export default class TelemetryBridge implements ITelemetryBridge {
  private cdpClient: ICDPClient | undefined;

  private _onTelemetryEvent = new EventEmitter<Telemetry.TelemetryEvent>();
  get onTelemetryEvent(): IEvent<Telemetry.TelemetryEvent> {
    return this._onTelemetryEvent.event;
  }

  constructor(
    @inject(ICDPClientAddress) private readonly cdpClientAddress: ICDPClientAddress,
    @inject(ICDPClientProvider) private readonly cdpClientProvider: ICDPClientProvider
  ) {}

  async attach(): Promise<void> {
    if (this.cdpClient) {
      throw new Error('Cannot attach when already attached to CDP');
    }

    try {
      this.cdpClient = this.cdpClientProvider.createCDPClient(this.cdpClientAddress);
      await this.cdpClient.connect();
      await Promise.all([
        await this.cdpClient.request('Runtime', 'enable'),
        await this.cdpClient.request('Runtime', 'addBinding', {
          name: Telemetry.telemetryRuntimeCDPBindingName,
        }),
        await this.cdpClient.subscribe('Runtime', 'bindingCalled', this.onBindingCalled),
      ]);
    } catch (e) {
      this.dispose();
      throw e;
    }
  }

  /**
   * @inheritdoc
   */
  async enable(source: Telemetry.ITelemetryEventSource): Promise<void> {
    return this.cdpClient?.request('Runtime', 'evaluate', {
      expression: `${Telemetry.telemetryRuntimeBridgeName}.enable("${source.fileName}", ${source.lineNumber}, ${source.columnNumber});`,
    });
  }

  /**
   * @inheritdoc
   */
  async disable(source: Telemetry.ITelemetryEventSource): Promise<void> {
    return this.cdpClient?.request('Runtime', 'evaluate', {
      expression: `${Telemetry.telemetryRuntimeBridgeName}.disable("${source.fileName}", ${source.lineNumber}, ${source.columnNumber});`,
    });
  }

  /**
   * @inheritdoc
   */
  async update(sources: ReadonlyArray<Telemetry.ITelemetryEventSource>): Promise<void> {
    return this.cdpClient?.request('Runtime', 'evaluate', {
      expression: `${Telemetry.telemetryRuntimeBridgeName}.update(${JSON.stringify(sources)});`,
    });
  }

  private onBindingCalled = (parameters: Record<string, unknown>): void => {
    if (parameters.name === Telemetry.telemetryRuntimeCDPBindingName && typeof parameters.payload === 'string') {
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
