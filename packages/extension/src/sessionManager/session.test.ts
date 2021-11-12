import 'reflect-metadata';
import Logger from '../logger';
import { logPointFixtureA } from '../operatorLogPoint/index.fixture';
import { IOperatorLogPointManager } from '../operatorLogPoint/manager';
import { ITelemetryBridge } from '../telemetryBridge';
import Session, { ISession } from './session';

describe('Session', () => {
  let session: ISession;
  let logPointManager: IOperatorLogPointManager;
  let telemetryBridge: ITelemetryBridge;
  const logPoints = [logPointFixtureA];

  beforeEach(() => {
    logPointManager = {
      disable: jest.fn(),
      enable: jest.fn(),
      logPoints: [],
      onDidChangeLogPoints: jest.fn(),
      dispose: jest.fn(),
      logPointForIdentifier: jest.fn(),
    };
    telemetryBridge = {
      attach: jest.fn(() => Promise.resolve()),
      disableOperatorLogPoint: jest.fn(() => Promise.resolve()),
      enableOperatorLogPoint: jest.fn(() => Promise.resolve()),
      updateOperatorLogPoints: jest.fn(() => Promise.resolve()),
      onRuntimeReady: jest.fn((handler) => handler()), // immediately ready
      onTelemetryEvent: jest.fn(),
      dispose: jest.fn(),
    };
    session = new Session(logPointManager, telemetryBridge, Logger.nullLogger());
  });

  describe('attach()', () => {
    test('attaches to the TelemetryBridge', async () => {
      await session.attach();
      expect(telemetryBridge.attach).toBeCalled();
    });

    test('sends log points present in the LogPointManager to the TelemetryBridge', async () => {
      logPointManager.logPoints = logPoints;
      await session.attach();
      expect(telemetryBridge.updateOperatorLogPoints).toBeCalledWith(
        logPoints.map(({ operatorIdentifier }) => operatorIdentifier)
      );
    });
  });

  test('forwards changed log points from the LogPointManager to the TelemetryBridge', async () => {
    await session.attach();
    expect(telemetryBridge.updateOperatorLogPoints).not.toBeCalledWith(logPoints);

    const onDidChangeLogPointsHandler = (logPointManager.onDidChangeLogPoints as jest.Mock).mock.calls[0][0];
    onDidChangeLogPointsHandler(logPoints);
    expect(telemetryBridge.updateOperatorLogPoints).toBeCalledWith(
      logPoints.map(({ operatorIdentifier }) => operatorIdentifier)
    );
  });

  test.todo('forwards received telemetry events from the TelemetryBridge to TBD');
});
