import type { Observable as RxJSObservable, OperatorFunction } from 'rxjs';
import { WrapOperatorFn } from '.';

export const ORIGINAL_PIPE_PROPERTY_NAME = '__RxJSDebugger_originalPipe';

/**
 * Patches the `pipe` function in the prototype of the RxJS `Observable`. The original `pipe` function well be kept as
 * `__RxJSDebugger_originalPipe`.
 *
 * ## Caution!
 * This function is NOT pure! It modifies the given `Observable` parameter in-place.
 *
 * @param Observable
 * @param wrapOperatorFunction
 * @returns
 */
export default function patchObservable(
  Observable: RxJSObservable<unknown> & {
    prototype: RxJSObservable<unknown> & { [ORIGINAL_PIPE_PROPERTY_NAME]?: RxJSObservable<unknown>['pipe'] };
  },
  wrapOperatorFunction: ReturnType<WrapOperatorFn>
): void {
  const origPipe = Observable.prototype.pipe;
  Observable.prototype[ORIGINAL_PIPE_PROPERTY_NAME] = origPipe;
  Observable.prototype.pipe = function (...operators: OperatorFunction<unknown, unknown>[]) {
    return origPipe.apply(
      this,
      operators.map((o, i) => wrapOperatorFunction(o, i)) as any // TODO Can we circument any?
    );
  };
}
