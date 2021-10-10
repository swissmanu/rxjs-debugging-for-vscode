import 'reflect-metadata';
import { Position, Uri } from 'vscode';
import OperatorLogPoint from '.';
import { IOperatorIdentifier } from '../../shared/telemetry/operatorIdentifier';
import Logger from '../logger';
import LogPointManager from './logPointManager';

describe('OperatorLogPointManager', () => {
  let logPointManager: LogPointManager;

  beforeEach(() => {
    logPointManager = new LogPointManager(Logger.nullLogger());
  });

  describe('enable()', () => {
    test('calls onDidChangeLogPoints handlers with all enabled log points', () => {
      const spy = jest.fn();

      logPointManager.onDidChangeLogPoints(spy);
      logPointManager.enable(Uri.file('foo.ts'), new Position(42, 84), {
        operatorIndex: 100,
        fileName: 'foo.ts',
        line: 101,
        character: 102,
      });
      logPointManager.enable(Uri.file('bar.ts'), new Position(128, 256), {
        operatorIndex: 201,
        fileName: 'bar.ts',
        line: 202,
        character: 203,
      });
      logPointManager.enable(Uri.file('foo.ts'), new Position(42, 84), {
        operatorIndex: 100,
        fileName: 'foo.ts',
        line: 101,
        character: 102,
      });

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, [
        new OperatorLogPoint(
          Uri.file('foo.ts'),
          new Position(42, 84),
          {
            operatorIndex: 100,
            fileName: 'foo.ts',
            line: 101,
            character: 102,
          },
          true
        ),
      ]);
      expect(spy).toHaveBeenNthCalledWith(2, [
        new OperatorLogPoint(
          Uri.file('foo.ts'),
          new Position(42, 84),
          {
            operatorIndex: 100,
            fileName: 'foo.ts',
            line: 101,
            character: 102,
          },
          true
        ),
        new OperatorLogPoint(
          Uri.file('bar.ts'),
          new Position(128, 256),
          {
            operatorIndex: 201,
            fileName: 'bar.ts',
            line: 202,
            character: 203,
          },
          true
        ),
      ]);
    });
  });

  describe('disable()', () => {
    test('calls onDidChangeLogPoints handlers with all enabled log points', () => {
      const spy = jest.fn();

      logPointManager.enable(Uri.file('foo.ts'), new Position(42, 84), {
        character: 100,
        line: 101,
        fileName: 'foo.ts',
        operatorIndex: 103,
      });
      logPointManager.enable(Uri.file('bar.ts'), new Position(128, 256), {
        character: 200,
        line: 201,
        fileName: 'bar.ts',
        operatorIndex: 203,
      });
      logPointManager.onDidChangeLogPoints(spy);
      logPointManager.disable(Uri.file('foo.ts'), new Position(42, 84), {
        character: 100,
        line: 101,
        fileName: 'foo.ts',
        operatorIndex: 103,
      });
      logPointManager.disable(Uri.file('foo.ts'), new Position(42, 84), {
        character: 100,
        line: 101,
        fileName: 'foo.ts',
        operatorIndex: 103,
      });

      expect(spy).toBeCalledTimes(1);
      expect(spy).toHaveBeenNthCalledWith(1, [
        new OperatorLogPoint(
          Uri.file('bar.ts'),
          new Position(128, 256),
          {
            character: 200,
            line: 201,
            fileName: 'bar.ts',
            operatorIndex: 203,
          },
          true
        ),
      ]);
    });
  });

  describe('logPoints', () => {
    test('provides enabled, unique log points as a list', () => {
      expect(logPointManager.logPoints).toEqual([]);

      const uri = Uri.file('foo.ts');
      const sourcePosition = new Position(42, 84);
      const operatorIdentifier: IOperatorIdentifier = {
        operatorIndex: 100,
        fileName: 'foo.ts',
        line: 101,
        character: 102,
      };

      logPointManager.enable(uri, sourcePosition, operatorIdentifier);
      expect(logPointManager.logPoints).toEqual([new OperatorLogPoint(uri, sourcePosition, operatorIdentifier, true)]);

      logPointManager.enable(uri, sourcePosition, operatorIdentifier);
      expect(logPointManager.logPoints).toEqual([new OperatorLogPoint(uri, sourcePosition, operatorIdentifier, true)]);

      logPointManager.disable(Uri.file('bar.ts'), new Position(128, 256), {
        operatorIndex: 200,
        fileName: 'bar.ts',
        line: 201,
        character: 202,
      });
      expect(logPointManager.logPoints).toEqual([new OperatorLogPoint(uri, sourcePosition, operatorIdentifier, true)]);

      logPointManager.disable(uri, sourcePosition, operatorIdentifier);
      expect(logPointManager.logPoints).toEqual([]);
    });
  });

  describe('logPointForIdentifier()', () => {
    test('returns the matching OperatorLogPoint for an identifier', () => {
      const identifier: IOperatorIdentifier = {
        fileName: 'foo.ts',
        line: 42,
        character: 48,
        operatorIndex: 0,
      };
      const uri = Uri.file(identifier.fileName);
      const sourcePosition = new Position(100, 101);

      logPointManager.enable(uri, sourcePosition, identifier);
      expect(logPointManager.logPointForIdentifier(identifier)).toEqual(
        new OperatorLogPoint(uri, sourcePosition, identifier, true)
      );
    });

    test('returns the undefined for an unknown identifier', () => {
      const identifier: IOperatorIdentifier = {
        fileName: 'foo.ts',
        line: 42,
        character: 48,
        operatorIndex: 0,
      };

      expect(logPointManager.logPointForIdentifier(identifier)).toBeUndefined();
    });
  });
});
