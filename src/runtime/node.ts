import * as Module from 'module';
import * as path from 'path';
import * as StackTrace from 'stacktrace-js';
import { operate, TelemetrySubscriber } from './telemetry';

const origLoad = (Module as any)._load;
(Module as any)._load = fakeLoad;

function getAbsolutePath(relativePath: string, parentFileName: string): string {
  if (relativePath.startsWith('/') || /^(\w|@)/.test(relativePath)) {
    return relativePath;
  } else {
    return path.resolve(path.dirname(parentFileName), relativePath);
  }
}

function fakeLoad(
  request: string,
  parent?: { filename: string },
  isMain?: boolean
) {
  const absolutePath = parent
    ? getAbsolutePath(request, parent.filename)
    : request;

  if (absolutePath.indexOf('rxjs/internal/operators/') > -1) {
    const result = origLoad(request, parent, isMain);
    const name = path.basename(request);

    if (typeof result[name] === 'function') {
      const originalOperator = result[name];
      return {
        ...result,
        [name]: function (...args: unknown[]) {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const originalThis = this;
          const sourceLocation = StackTrace.get();

          return operate((source, subscriber) => {
            source
              .pipe(originalOperator.apply(originalThis, args))
              .subscribe(new TelemetrySubscriber(subscriber, sourceLocation));
          });
        },
      };
    }
    return result;
  }
  return origLoad(request, parent, isMain);
}
