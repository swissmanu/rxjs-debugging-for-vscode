import 'reflect-metadata';
import OperatorLogPointManager from '.';
import { IAnalyticsReporter } from '../../analytics';
import Logger from '../../logger';
import { logPointFixtureA, logPointFixtureB } from '../index.fixture';
import { IOperatorLogPointRecommender } from '../recommender';
import {Selection} from 'vscode';

describe('OperatorLogPointManager', () => {
  let logPointManager: OperatorLogPointManager;
  let recommender: IOperatorLogPointRecommender;
  let analyticsReporter: IAnalyticsReporter;

  beforeEach(() => {
    recommender = {
      dispose: jest.fn(),
      onRecommendOperatorLogPoints: jest.fn(),
      recommend: jest.fn(),
    };
    analyticsReporter = {
      captureDebugSessionStarted: jest.fn(),
      captureDebugSessionStopped: jest.fn(),
      captureOperatorLogPointDisabled: jest.fn(),
      captureOperatorLogPointEnabled: jest.fn(),
      dispose: jest.fn(),
    };
    logPointManager = new OperatorLogPointManager(recommender, analyticsReporter, Logger.nullLogger());
  });

  describe('enable()', () => {
    test('calls onDidChangeLogPoints handlers with all enabled log points', () => {
      const spy = jest.fn();

      logPointManager.onDidChangeLogPoints(spy);
      logPointManager.enable(logPointFixtureA);
      logPointManager.enable(logPointFixtureB);
      logPointManager.enable(logPointFixtureA);

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, [logPointFixtureA.with({ enabled: true })]);
      expect(spy).toHaveBeenNthCalledWith(2, [
        logPointFixtureA.with({ enabled: true }),
        logPointFixtureB.with({ enabled: true }),
      ]);
    });
  });

  describe('disable()', () => {
    test('calls onDidChangeLogPoints handlers with all enabled log points', () => {
      const spy = jest.fn();

      logPointManager.enable(logPointFixtureA);
      logPointManager.enable(logPointFixtureB);
      logPointManager.onDidChangeLogPoints(spy);
      logPointManager.disable(logPointFixtureA);
      logPointManager.disable(logPointFixtureA);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toHaveBeenNthCalledWith(1, [logPointFixtureB.with({ enabled: true })]);
    });
  });

  describe('logPoints', () => {
    test('provides enabled, unique log points as a list', () => {
      expect(logPointManager.logPoints).toEqual([]);

      logPointManager.enable(logPointFixtureA);
      expect(logPointManager.logPoints).toEqual([logPointFixtureA.with({ enabled: true })]);

      logPointManager.enable(logPointFixtureA);
      expect(logPointManager.logPoints).toEqual([logPointFixtureA.with({ enabled: true })]);

      logPointManager.disable(logPointFixtureB);
      expect(logPointManager.logPoints).toEqual([logPointFixtureA.with({ enabled: true })]);

      logPointManager.disable(logPointFixtureA);
      expect(logPointManager.logPoints).toEqual([]);
    });
  });

  describe('logPointForIdentifier()', () => {
    test('returns the matching OperatorLogPoint for an identifier', () => {
      logPointManager.enable(logPointFixtureA);
      expect(logPointManager.logPointForIdentifier(logPointFixtureA.operatorIdentifier)).toEqual(
        logPointFixtureA.with({ enabled: true })
      );
    });

    test('returns the undefined for an unknown identifier', () => {
      expect(logPointManager.logPointForIdentifier(logPointFixtureA.operatorIdentifier)).toBeUndefined();
    });
  });

  describe('logPointsForSelection()', () => {
    test('returns a log point with a source position contained in given selection', () => {
      expect(logPointManager.logPointsForSelection(new Selection()))
    })

    test('does not return a log point which is not contained in given selection', () => {

    })
  })
});
