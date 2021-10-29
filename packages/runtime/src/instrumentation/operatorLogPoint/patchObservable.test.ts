import patchObservable, { ORIGINAL_PIPE_PROPERTY_NAME } from './patchObservable';

describe('runtime', () => {
  describe('patchObservable()', () => {
    let wrap: jest.Mock;

    beforeEach(() => {
      wrap = jest.fn((x) => x);
    });

    test(`keeps the original pipe function of give Observable as ${ORIGINAL_PIPE_PROPERTY_NAME}`, () => {
      class FakeObservable {
        pipe() {} // eslint-disable-line @typescript-eslint/no-empty-function
        [ORIGINAL_PIPE_PROPERTY_NAME]: never;
      }
      const originalPipe = FakeObservable.prototype.pipe;

      patchObservable(FakeObservable as never, wrap);

      expect(FakeObservable.prototype[ORIGINAL_PIPE_PROPERTY_NAME]).toBe(originalPipe);
    });

    describe('overwrites the original pipe function', () => {
      test('so every given operator is wrapped using the wrapOperatorFunction', () => {
        class FakeObservable {
          pipe(a: string, b: string): string {
            return `${a}${b}`;
          }
        }

        patchObservable(FakeObservable as never, wrap);

        const observable = new FakeObservable();
        const operatorA = () => 'a';
        const operatorB = () => 'b';
        observable.pipe(operatorA(), operatorB());

        expect(wrap).toBeCalledTimes(2);
        expect(wrap).toHaveBeenNthCalledWith(1, 'a', 0);
        expect(wrap).toHaveBeenNthCalledWith(2, 'b', 1);
      });

      test('and calls the original pipe using the wrapped operators', () => {
        const originalPipeMock = jest.fn((...parameters: unknown[]) => parameters.join());

        class FakeObservable {
          pipe(...parameters: unknown[]): unknown {
            return originalPipeMock(...parameters);
          }
        }

        patchObservable(FakeObservable as never, wrap);

        const observable = new FakeObservable();
        const operatorA = () => 'a';
        const operatorB = () => 'b';
        const result = observable.pipe(operatorA(), operatorB());

        expect(originalPipeMock).toBeCalledTimes(1);
        expect(originalPipeMock).toBeCalledWith('a', 'b');
        expect(result).toEqual('a,b');
      });
    });
  });
});
