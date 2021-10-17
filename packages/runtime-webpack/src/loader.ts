import type { LoaderContext } from 'webpack';

export default function patch(this: LoaderContext<unknown>, source: string): void {
  this.callback(
    null,
    `
      ${source}
      import webpackInstrumentation from "${require.resolve('./instrumentation.js')}";
      webpackInstrumentation(Observable);
    `
  );
}
