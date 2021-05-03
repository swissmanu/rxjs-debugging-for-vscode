import 'reflect-metadata';
import { Position, Uri } from 'vscode';
import LogPointManager from '.';
import NullLogger from '../logger/nullLogger';

const logger = new NullLogger();

describe('LogPointManager', () => {
  let logPointManager: LogPointManager;

  beforeEach(() => {
    logPointManager = new LogPointManager(logger);
  });

  describe('enable()', () => {
    test('calls onDidChangeLogPoints handlers with all enabled log points', () => {
      const spy = jest.fn();

      logPointManager.onDidChangeLogPoints(spy);
      logPointManager.enable(Uri.file('foo.ts'), new Position(42, 84));
      logPointManager.enable(Uri.file('bar.ts'), new Position(128, 256));
      logPointManager.enable(Uri.file('foo.ts'), new Position(42, 84));

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, [{ fileName: 'foo', line: 42, character: 84 }]);
      expect(spy).toHaveBeenNthCalledWith(2, [
        { fileName: 'foo', line: 42, character: 84 },
        { fileName: 'bar', line: 128, character: 256 },
      ]);
    });
  });

  describe('disable()', () => {
    test('calls onDidChangeLogPoints handlers with all enabled log points', () => {
      const spy = jest.fn();

      logPointManager.enable(Uri.file('foo.ts'), new Position(42, 84));
      logPointManager.disable(Uri.file('bar.ts'), new Position(128, 256));
      logPointManager.onDidChangeLogPoints(spy);
      logPointManager.disable(Uri.file('foo.ts'), new Position(42, 84));
      logPointManager.disable(Uri.file('foo.ts'), new Position(42, 84));

      expect(spy).toBeCalledTimes(1);
      expect(spy).toHaveBeenNthCalledWith(1, [{ fileName: 'bar', line: 128, character: 256 }]);
    });
  });

  describe('logPoints', () => {
    test('provides enabled, unique log points as a list', () => {
      expect(logPointManager.logPoints).toEqual([]);
      logPointManager.enable(Uri.file('foo.ts'), new Position(42, 84));
      expect(logPointManager.logPoints).toEqual([{ fileName: 'foo', line: 42, character: 84 }]);
      logPointManager.enable(Uri.file('foo.ts'), new Position(42, 84));
      expect(logPointManager.logPoints).toEqual([{ fileName: 'foo', line: 42, character: 84 }]);

      logPointManager.disable(Uri.file('bar.ts'), new Position(128, 256));
      expect(logPointManager.logPoints).toEqual([{ fileName: 'foo', line: 42, character: 84 }]);
      logPointManager.disable(Uri.file('foo.ts'), new Position(42, 84));
      expect(logPointManager.logPoints).toEqual([]);
    });
  });
});
