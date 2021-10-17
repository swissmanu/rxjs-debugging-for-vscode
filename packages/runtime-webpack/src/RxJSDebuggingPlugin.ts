import * as path from 'path';
import type { Compiler } from 'webpack';
import { NormalModule } from 'webpack';

const PLUGIN_NAME = 'RxJSDebuggingPlugin';
const loaderPath = require.resolve('./loader.js');
const here = path.dirname(loaderPath);

const observableRegex = /rxjs\/(_esm5\/)?internal\/Observable(\.js)?$/g;

export default class RxJSDebuggingPlugin {
  apply(compiler: Compiler): void {
    if (compiler.options.mode === 'production') {
      return;
    }

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      NormalModule.getCompilationHooks(compilation).beforeLoaders.tap(PLUGIN_NAME, (loaders, normalModule) => {
        if (normalModule.resource.startsWith(here)) {
          // Never add loader to ourselves:
          return;
        }

        const { userRequest = '' } = normalModule;
        if (observableRegex.exec(userRequest) !== null) {
          loaders.push({
            loader: loaderPath,
            options: {},
            ident: null,
            type: null,
          });
        }
      });
    });
  }
}
