import 'reflect-metadata';
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
      logPointManager.enable('foo', 42, 84);
      logPointManager.enable('bar', 128, 256);
      logPointManager.enable('foo', 42, 84);

      expect(spy).toBeCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, [{ fileName: 'foo', lineNumber: 42, columnNumber: 84 }]);
      expect(spy).toHaveBeenNthCalledWith(2, [
        { fileName: 'foo', lineNumber: 42, columnNumber: 84 },
        { fileName: 'bar', lineNumber: 128, columnNumber: 256 },
      ]);
    });
  });

  describe('disable()', () => {
    test('calls onDidChangeLogPoints handlers with all enabled log points', () => {
      const spy = jest.fn();

      logPointManager.enable('foo', 42, 84);
      logPointManager.enable('bar', 128, 256);
      logPointManager.onDidChangeLogPoints(spy);
      logPointManager.disable('foo', 42, 84);
      logPointManager.disable('foo', 42, 84);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toHaveBeenNthCalledWith(1, [{ fileName: 'bar', lineNumber: 128, columnNumber: 256 }]);
    });
  });

  describe('logPoints', () => {
    test('provides enabled, unique log points as a list', () => {
      expect(logPointManager.logPoints).toEqual([]);
      logPointManager.enable('foo', 42, 84);
      expect(logPointManager.logPoints).toEqual([{ fileName: 'foo', lineNumber: 42, columnNumber: 84 }]);
      logPointManager.enable('foo', 42, 84);
      expect(logPointManager.logPoints).toEqual([{ fileName: 'foo', lineNumber: 42, columnNumber: 84 }]);

      logPointManager.disable('bar', 128, 256);
      expect(logPointManager.logPoints).toEqual([{ fileName: 'foo', lineNumber: 42, columnNumber: 84 }]);
      logPointManager.disable('foo', 42, 84);
      expect(logPointManager.logPoints).toEqual([]);
    });
  });
});
