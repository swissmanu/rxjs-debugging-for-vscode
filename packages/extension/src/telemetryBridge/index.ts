import {
  CDP_BINDING_NAME_RUNTIME_READY,
  CDP_BINDING_NAME_SEND_TELEMETRY,
  RUNTIME_TELEMETRY_BRIDGE,
} from '@rxjs-debugging/runtime/out/consts';
import { RuntimeType, parseRuntimeType } from '@rxjs-debugging/runtime/out/utils/runtimeType';
import { TelemetryEvent } from '@rxjs-debugging/telemetry';
import { IOperatorIdentifier } from '@rxjs-debugging/telemetry/out/operatorIdentifier';
import { inject, injectable } from 'inversify';
import { Event, EventEmitter } from 'vscode';
import { ILogger } from '../logger';
import { IDisposable } from '../util/types';
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
   * An event fired once the runtime signals being ready to receive communication. Its only parameter describes the type
   * of the runtime. It might be `undefined` in case the runtime type is unknown.
   */
  onRuntimeReady: Event<RuntimeType | undefined>;

  /**
   * An event fired every time when the runtime sends a `TelemetryEvent`.
   */
  onTelemetryEvent: Event<TelemetryEvent>;
}
@injectable()
export default class TelemetryBridge implements ITelemetryBridge {
  private cdpClient: ICDPClient | undefined;

  private _onRuntimeReady = new EventEmitter<RuntimeType | undefined>();
  get onRuntimeReady(): Event<RuntimeType | undefined> {
    return this._onRuntimeReady.event;
  }

  private _onTelemetryEvent = new EventEmitter<TelemetryEvent>();
  get onTelemetryEvent(): Event<TelemetryEvent> {
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
          name: CDP_BINDING_NAME_RUNTIME_READY,
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
        const json: TelemetryEvent = JSON.parse(parameters.payload); // TODO fix any cast?
        this.logger.info('TelemetryBridge', `TelemetryEvent received: ${parameters.payload}`);
        this._onTelemetryEvent.fire(json);
      } catch (e) {
        this.logger.error('TelemetryBridge', `Could not parse TelemetryEvent. Raw Event Data: ${parameters.payload}`);
      }
    } else if (parameters.name === CDP_BINDING_NAME_RUNTIME_READY && typeof parameters.payload === 'string') {
      try {
        const runtimeType = parseRuntimeType(parameters.payload);
        this.logger.info('TelemetryBridge', `${runtimeType} runtime ready`);
        this._onRuntimeReady.fire(runtimeType);
      } catch (_) {
        this.logger.warn('TelemetryBridge', 'Unknown runtime ready');
        this._onRuntimeReady.fire(undefined);
      }
    }
  };

  dispose(): void {
    this._onRuntimeReady.dispose();
    this._onTelemetryEvent.dispose();
    this.cdpClient?.dispose();
    this.cdpClient = undefined;
  }
}
