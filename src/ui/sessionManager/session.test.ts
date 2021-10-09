import 'reflect-metadata';
import { Position, Uri } from 'vscode';
import Logger from '../logger';
import OperatorLogPoint from '../operatorLogPoint';
import { IOperatorLogPointManager } from '../operatorLogPoint/logPointManager';
import { ITelemetryBridge } from '../telemetryBridge';
import Session, { ISession } from './session';

describe('Session', () => {
  let session: ISession;
  let logPointManager: IOperatorLogPointManager;
  let telemetryBridge: ITelemetryBridge;
  const logPoints = [
    new OperatorLogPoint(Uri.file('test.ts'), new Position(42, 84), {
      character: 100,
      line: 101,
      fileName: 'test.ts',
      operatorIndex: 102,
    }),
  ];

  beforeEach(() => {
    logPointManager = {
      disable: jest.fn(),
      enable: jest.fn(),
      logPoints: [],
      onDidChangeLogPoints: jest.fn(),
      dispose: jest.fn(),
    };
    telemetryBridge = {
      attach: jest.fn(() => Promise.resolve()),
      disableOperatorLogPoint: jest.fn(() => Promise.resolve()),
      enableOperatorLogPoint: jest.fn(() => Promise.resolve()),
      updateOperatorLogPoints: jest.fn(() => Promise.resolve()),
      onRuntimeReady: jest.fn(),
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
      expect(telemetryBridge.updateOperatorLogPoints).toBeCalledWith(logPoints);
    });
  });

  test('forwards changed log points from the LogPointManager to the TelemetryBridge', async () => {
    await session.attach();
    expect(telemetryBridge.updateOperatorLogPoints).not.toBeCalledWith(logPoints);

    const onDidChangeLogPointsHandler = (logPointManager.onDidChangeLogPoints as jest.Mock).mock.calls[0][0];
    onDidChangeLogPointsHandler(logPoints);
    expect(telemetryBridge.updateOperatorLogPoints).toBeCalledWith(logPoints);
  });

  test.todo('forwards received telemetry events from the TelemetryBridge to TBD');
});
