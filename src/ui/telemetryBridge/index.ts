import { inject, injectable } from 'inversify';
import { Event, EventEmitter } from 'vscode';
import * as Telemetry from '../../shared/telemetry';
import {
  CDP_BINDING_NAME_READY,
  CDP_BINDING_NAME_SEND_TELEMETRY,
  RUNTIME_TELEMETRY_BRIDGE,
} from '../../shared/telemetry/consts';
import { IOperatorIdentifier } from '../../shared/telemetry/operatorIdentifier';
import { IDisposable } from '../../shared/types';
import { ILogger } from '../logger';
import { ICDPClient, ICDPClientAddress } from './cdpClient';
import { ICDPClientProvider } from './cdpClientProvider';

export const ITelemetryBridge = Symbol('ITelemetryBridge');

export interface ITelemetryBridge extends IDisposable {
  attach(): Promise<void>;

  /**
   * Enable one specific `IOperatorIdentifer` to the runtime.
   *
   * @param operator
   */
  enableOperatorLogPoint(operator: IOperatorIdentifier): Promise<void>;

  /**
   * Disable one specific `IOperatorIdentifer` in the runtime.
   *
   * @param operator
   */
  disableOperatorLogPoint(operator: IOperatorIdentifier): Promise<void>;

  /**
   * Send a list of `IOperatorIdentifer`s to the runtime. The runtime will replace currently enabled log point sources
   * with this new list.
   *
   * @param operators
   */
  updateOperatorLogPoints(operators: ReadonlyArray<IOperatorIdentifier>): Promise<void>;

  /**
   * An event fired once the runtime signals being ready to receive communication.
   */
  onRuntimeReady: Event<void>;

  /**
   * An event fired every time when the runtime sends a `TelemetryEvent`.
   */
  onTelemetryEvent: Event<Telemetry.TelemetryEvent>;
}
@injectable()
export default class TelemetryBridge implements ITelemetryBridge {
  private cdpClient: ICDPClient | undefined;

  private _onRuntimeReady = new EventEmitter<void>();
  get onRuntimeReady(): Event<void> {
    return this._onRuntimeReady.event;
  }

  private _onTelemetryEvent = new EventEmitter<Telemetry.TelemetryEvent>();
  get onTelemetryEvent(): Event<Telemetry.TelemetryEvent> {
    return this._onTelemetryEvent.event;
  }

  constructor(
    @inject(ICDPClientAddress) private readonly cdpClientAddress: ICDPClientAddress,
    @inject(ICDPClientProvider) private readonly cdpClientProvider: ICDPClientProvider,
    @inject(ILogger) private readonly logger: ILogger
  ) {}

  async attach(): Promise<void> {
    if (this.cdpClient) {
      throw new Error('Cannot attach when already attached to CDP');
    }

    this.logger.info('TelemetryBridge', 'Attach to CDP');

    try {
      this.cdpClient = this.cdpClientProvider.createCDPClient(this.cdpClientAddress);
      await this.cdpClient.connect();
      await Promise.all([
        await this.cdpClient.request('Runtime', 'enable'),
        await this.cdpClient.request('Runtime', 'addBinding', {
          name: CDP_BINDING_NAME_READY,
        }),
        await this.cdpClient.request('Runtime', 'addBinding', {
          name: CDP_BINDING_NAME_SEND_TELEMETRY,
        }),
        await this.cdpClient.subscribe('Runtime', 'bindingCalled', this.onBindingCalled),
      ]);

      this.logger.info('TelemetryBridge', 'Attached to CDP');
    } catch (e) {
      this.dispose();
      throw e;
    }
  }

  /**
   * @inheritdoc
   */
  async enableOperatorLogPoint(operator: IOperatorIdentifier): Promise<void> {
    await this.cdpClient?.request('Runtime', 'evaluate', {
      expression: `${RUNTIME_TELEMETRY_BRIDGE}.enableOperatorLogPoint(${JSON.stringify(operator)});`,
    });
  }

  /**
   * @inheritdoc
   */
  async disableOperatorLogPoint(operator: IOperatorIdentifier): Promise<void> {
    await this.cdpClient?.request('Runtime', 'evaluate', {
      expression: `${RUNTIME_TELEMETRY_BRIDGE}.disableOperatorLogPoint(${JSON.stringify(operator)});`,
    });
  }

  /**
   * @inheritdoc
   */
  async updateOperatorLogPoints(operators: ReadonlyArray<IOperatorIdentifier>): Promise<void> {
    await this.cdpClient?.request('Runtime', 'evaluate', {
      expression: `${RUNTIME_TELEMETRY_BRIDGE}.updateOperatorLogPoints(${JSON.stringify(operators)});`,
    });
  }

  private onBindingCalled = (parameters: Record<string, unknown>): void => {
    this.logger.info('TelemetryBridge', `"${parameters.name}" binding called`);

    if (parameters.name === CDP_BINDING_NAME_SEND_TELEMETRY && typeof parameters.payload === 'string') {
      try {
        const json: Telemetry.TelemetryEvent = JSON.parse(parameters.payload); // TODO fix any cast?
        this.logger.info('TelemetryBridge', `TelemetryEvent received: ${parameters.payload}`);
        this._onTelemetryEvent.fire(json);
      } catch (e) {
        console.error(JSON.stringify(e)); // TODO
      }
    } else if (parameters.name === CDP_BINDING_NAME_READY) {
      this.logger.info('TelemetryBridge', 'Runtime ready');
      this._onRuntimeReady.fire();
    }
  };

  dispose(): void {
    this._onRuntimeReady.dispose();
    this._onTelemetryEvent.dispose();
    this.cdpClient?.dispose();
    this.cdpClient = undefined;
  }
}
