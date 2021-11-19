import { TelemetryEvent, TelemetryEventType } from '@rxjs-debugging/telemetry';
import { ObservableEventType } from '@rxjs-debugging/telemetry/out/observableEvent';
import { IOperatorIdentifier } from '@rxjs-debugging/telemetry/out/operatorIdentifier';
import serializeTelemetryEvent from '@rxjs-debugging/telemetry/out/serialize';
import 'reflect-metadata';
import Logger, { ILogger } from '../logger';
import TelemetryBridge from './';
import { ICDPClient, ICDPClientAddress } from './cdpClient';
import { ICDPClientProvider } from './cdpClientProvider';

describe('UI', () => {
  describe('TelemetryBridge', () => {
    const cdpClientAddress: ICDPClientAddress = { host: 'foo', port: 42 };
    let cdpClient: ICDPClient;
    let cdpClientProvider: ICDPClientProvider;
    let bridge: TelemetryBridge;
    const logger: ILogger = Logger.nullLogger();

    beforeEach(async () => {
      cdpClient = {
        connect: jest.fn(),
        dispose: jest.fn(),
        request: jest.fn(),
        subscribe: jest.fn(),
      };

      cdpClientProvider = {
        createCDPClient: jest.fn(() => cdpClient),
      };

      bridge = new TelemetryBridge(cdpClientAddress, cdpClientProvider, logger);
      await bridge.attach();
    });

    describe('attach()', () => {
      test('creates a CDPClient using CDPClientProvider and CDPClientAddress', async () => {
        expect(cdpClientProvider.createCDPClient).toBeCalledWith(cdpClientAddress);
      });

      test('initializes the CDP Runtime domain', async () => {
        expect(cdpClient.request).toBeCalledTimes(3);
        expect(cdpClient.request).toBeCalledWith('Runtime', 'enable');
        expect(cdpClient.request).toBeCalledWith('Runtime', 'addBinding', { name: 'rxJsDebuggerRuntimeReady' });
        expect(cdpClient.request).toBeCalledWith('Runtime', 'addBinding', { name: 'sendRxJsDebuggerTelemetry' });

        expect(cdpClient.subscribe).toBeCalledTimes(1);
        expect(cdpClient.subscribe).toBeCalledWith('Runtime', 'bindingCalled', expect.any(Function));
      });

      test('cannot attach twice', async () => {
        expect(bridge.attach()).rejects.toMatchInlineSnapshot('[Error: Cannot attach when already attached to CDP]');
      });
    });

    describe('enable()', () => {
      test('sends a Runtime.evaluate request via the CDPClient', async () => {
        const operatorIdentifier: IOperatorIdentifier = { character: 1, fileName: 'foo', line: 2, operatorIndex: 3 };
        await bridge.enableOperatorLogPoint(operatorIdentifier);
        expect(cdpClient.request).toHaveBeenLastCalledWith('Runtime', 'evaluate', {
          expression: `rxJsDebuggerTelemetryBridge.enableOperatorLogPoint({"character":1,"fileName":"foo","line":2,"operatorIndex":3});`,
        });
      });
    });

    describe('disable()', () => {
      test('sends a Runtime.evaluate request via the CDPClient', async () => {
        const operatorIdentifier: IOperatorIdentifier = { character: 1, fileName: 'foo', line: 2, operatorIndex: 3 };
        await bridge.disableOperatorLogPoint(operatorIdentifier);
        expect(cdpClient.request).toHaveBeenLastCalledWith('Runtime', 'evaluate', {
          expression: `rxJsDebuggerTelemetryBridge.disableOperatorLogPoint({"character":1,"fileName":"foo","line":2,"operatorIndex":3});`,
        });
      });
    });

    describe('update()', () => {
      test('sends a Runtime.evaluate request via the CDPClient', async () => {
        const operatorIdentifier: IOperatorIdentifier = { character: 1, fileName: 'foo', line: 2, operatorIndex: 3 };
        await bridge.updateOperatorLogPoints([operatorIdentifier]);
        expect(cdpClient.request).toHaveBeenLastCalledWith('Runtime', 'evaluate', {
          expression:
            'rxJsDebuggerTelemetryBridge.updateOperatorLogPoints([{"character":1,"fileName":"foo","line":2,"operatorIndex":3}]);',
        });
      });
    });

    describe('onTelemetryEvent()', () => {
      test('is fired when the CDPClient register a call on the telemetry binding', async () => {
        const spy = jest.fn();
        bridge.onTelemetryEvent(spy);

        const callback = (cdpClient.subscribe as jest.Mock).mock.calls[0][2];
        const event: TelemetryEvent = {
          type: TelemetryEventType.OperatorLogPoint,
          observableEvent: ObservableEventType.Next,
          data: {
            value: 'test',
          },
          operator: { character: 1, fileName: 'foo', line: 2, operatorIndex: 3 },
        };
        callback({
          name: 'sendRxJsDebuggerTelemetry',
          payload: serializeTelemetryEvent(event),
        });

        expect(spy).toBeCalledWith(event);
      });
    });

    describe('onRuntimeReady()', () => {
      test.each([
        ['nodejs', 'nodejs'],
        ['webpack', 'webpack'],
        ['unknownRuntimeType', undefined],
      ])(
        'is fired when the CDPClient registers a call on the runtime ready binding carrying %s as runtime type',
        (runtimeType, expectedParameter) => {
          const spy = jest.fn();
          bridge.onRuntimeReady(spy);

          const callback = (cdpClient.subscribe as jest.Mock).mock.calls[0][2];
          callback({
            name: 'rxJsDebuggerRuntimeReady',
            payload: runtimeType,
          });

          expect(spy).toBeCalledWith(expectedParameter);
        }
      );
    });
  });
});
