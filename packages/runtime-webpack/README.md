# ![Archie the Debugger Owl](https://github.com/swissmanu/rxjs-debugging-for-vscode/raw/main/docs/brand/archie-small.png) @rxjs-debugging/runtime-webpack

> Webpack plugin to debug RxJS-based web applications with [RxJS Debugging for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=manuelalabor.rxjs-debugging-for-vs-code).

[![npm version](https://badge.fury.io/js/@rxjs-debugging%2Fruntime-webpack.svg)](https://badge.fury.io/js/@rxjs-debugging%2Fruntime-webpack)

In order to debug an RxJS-based web application bundled using Webpack with [RxJS Debugging for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=manuelalabor.rxjs-debugging-for-vs-code), the `@rxjs-debugging/runtime-webpack` plugin is required.

The plugin augments RxJS so the debugger can communicate with your application at runtime. This augmentation happens *only* during development, hence your production builds will stay clear of any debugging augmentation.

![runtime-webpack Demo](https://github.com/swissmanu/rxjs-debugging-for-vscode/raw/main/packages/runtime-webpack/docs/demo.gif)



## Usage

1. Install `@rxjs-debugging/runtime-webpack`:

   ```bash
   npm i -D @rxjs-debugging/runtime-webpack
   yarn add -D @rxjs-debugging/runtime-webpack
   ```

2. Import and add the `RxJSDebuggingPlugin` to your Webpack configuration:

   ```javascript
   import RxJSDebuggingPlugin from '@rxjs-debugging/runtime-webpack';

   export default {
     // your configuration
     plugins: [
       // your plugins
       new RxJSDebuggingPlugin() // <-- Add this line
     ]
   };
   ```

3. (Re-)start Webpack and debug your web application with [RxJS Debugging for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=manuelalabor.rxjs-debugging-for-vs-code).

## Example

The [Webpack Testbench](https://github.com/swissmanu/rxjs-debugging-for-vscode/tree/main/packages/testbench-webpack) demonstrates how `@rxjs-debugging/runtime-webpack` can be integrated allowing to debug a web application with [RxJS Debugging for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=manuelalabor.rxjs-debugging-for-vs-code).
