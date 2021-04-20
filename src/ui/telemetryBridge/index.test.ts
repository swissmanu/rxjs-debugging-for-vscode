import 'reflect-metadata';
import NullLogger from '../logger/nullLogger';
import TelemetryBridge from './';
import { ICDPClient, ICDPClientAddress } from './cdpClient';
import { ICDPClientProvider } from './cdpClientProvider';
import * as Telemetry from '../../shared/telemetry';

describe('UI', () => {
  describe('TelemetryBridge', () => {
    const cdpClientAddress: ICDPClientAddress = { host: 'foo', port: 42 };
    let cdpClient: ICDPClient;
    let cdpClientProvider: ICDPClientProvider;
    let bridge: TelemetryBridge;

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

      bridge = new TelemetryBridge(cdpClientAddress, cdpClientProvider, new NullLogger());
      await bridge.attach();
    });

    describe('attach()', () => {
      test('creates a CDPClient using CDPClientProvider and CDPClientAddress', async () => {
        expect(cdpClientProvider.createCDPClient).toBeCalledWith(cdpClientAddress);
      });

      test('initializes the CDP Runtime domain', async () => {
        expect(cdpClient.request).toBeCalledTimes(2);
        expect(cdpClient.request).toBeCalledWith('Runtime', 'enable');
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
        const source: Telemetry.ITelemetryEventSource = { columnNumber: 1, fileName: 'foo', lineNumber: 2 };
        await bridge.enable(source);
        expect(cdpClient.request).toHaveBeenLastCalledWith('Runtime', 'evaluate', {
          expression: `rxJsDebuggerTelemetryBridge.enable("${source.fileName}", ${source.lineNumber}, ${source.columnNumber});`,
        });
      });
    });

    describe('disable()', () => {
      test('sends a Runtime.evaluate request via the CDPClient', async () => {
        const source: Telemetry.ITelemetryEventSource = { columnNumber: 1, fileName: 'foo', lineNumber: 2 };
        await bridge.disable(source);
        expect(cdpClient.request).toHaveBeenLastCalledWith('Runtime', 'evaluate', {
          expression: `rxJsDebuggerTelemetryBridge.disable("${source.fileName}", ${source.lineNumber}, ${source.columnNumber});`,
        });
      });
    });

    describe('onTelemetryEvent()', () => {
      test('is fired when the CDPClient register a call on the telemetry binding', async () => {
        const spy = jest.fn();
        bridge.onTelemetryEvent(spy);

        const callback = (cdpClient.subscribe as jest.Mock).mock.calls[0][2];
        const event: Telemetry.TelemetryEvent = {
          type: Telemetry.TelemetryEventType.Next,
          source: { columnNumber: 1, fileName: 'foo', lineNumber: 2 },
          data: {
            value: 'test',
          },
        };
        callback({
          name: 'sendRxJsDebuggerTelemetry',
          payload: JSON.stringify(event),
        });

        expect(spy).toBeCalledWith(event);
      });
    });
  });
});
