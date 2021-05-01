import 'reflect-metadata';
import { ILogPointManager } from '../logPointManager';
import { ITelemetryBridge } from '../telemetryBridge';
import Session, { ISession } from './session';

describe('Session', () => {
  let session: ISession;
  let logPointManager: ILogPointManager;
  let telemetryBridge: ITelemetryBridge;
  const logPoints = [{ fileName: 'foo', lineNumber: 42, columnNumber: 48 }];

  beforeEach(() => {
    logPointManager = { disable: jest.fn(), enable: jest.fn(), logPoints: [], onDidChangeLogPoints: jest.fn() };
    telemetryBridge = {
      attach: jest.fn(() => Promise.resolve()),
      disable: jest.fn(() => Promise.resolve()),
      enable: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      onTelemetryEvent: jest.fn(),
      dispose: jest.fn(),
    };
    session = new Session(logPointManager, telemetryBridge);
  });

  describe('attach()', () => {
    test('attaches to the TelemetryBridge', async () => {
      await session.attach();
      expect(telemetryBridge.attach).toBeCalled();
    });

    test('sends log points present in the LogPointManager to the TelemetryBridge', async () => {
      logPointManager.logPoints = logPoints;
      await session.attach();
      expect(telemetryBridge.update).toBeCalledWith(logPoints);
    });
  });

  test('forwards changed log points from the LogPointManager to the TelemetryBridge', async () => {
    await session.attach();
    expect(telemetryBridge.update).not.toBeCalledWith(logPoints);

    const onDidChangeLogPointsHandler = (logPointManager.onDidChangeLogPoints as jest.Mock).mock.calls[0][0];
    onDidChangeLogPointsHandler(logPoints);
    expect(telemetryBridge.update).toBeCalledWith(logPoints);
  });

  test.todo('forwards received telemetry events from the TelemetryBridge to TBD');
});
