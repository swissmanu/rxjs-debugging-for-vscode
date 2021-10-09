export default function patch(source: string): void {
  const loaderContext = this; // eslint-disable-line @typescript-eslint/no-this-alias
  loaderContext.callback(
    null,
    `
      ${source}
      import webpackInstrumentation from "${require.resolve('./instrumentation.js')}";
      webpackInstrumentation(Observable);
    `
  );
}
