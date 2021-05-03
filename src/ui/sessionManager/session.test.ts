import 'reflect-metadata';
import { Position, Uri } from 'vscode';
import Logger from '../logger';
import { LogPoint } from '../logPoint';
import { ILogPointManager } from '../logPoint/logPointManager';
import { ITelemetryBridge } from '../telemetryBridge';
import Session, { ISession } from './session';

describe('Session', () => {
  let session: ISession;
  let logPointManager: ILogPointManager;
  let telemetryBridge: ITelemetryBridge;
  const logPoints = [new LogPoint(Uri.file('test.ts'), new Position(42, 84))];

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
      disable: jest.fn(() => Promise.resolve()),
      enable: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
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
