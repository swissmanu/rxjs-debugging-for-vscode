# ![Archie the Debugger Owl](./docs/brand/archie-small.png) RxJS Debugging for Visual Studio Code

[![Click to visit marketplace](https://vsmarketplacebadge.apphb.com/version-short/manuelalabor.rxjs-debugging-for-vs-code.svg)](https://marketplace.visualstudio.com/items?itemName=manuelalabor.rxjs-debugging-for-vs-code) [![Twitter](https://img.shields.io/badge/Follow-%40rxjsdebuggung-blue?logo=twitter)](https://twitter.com/rxjsdebugging)

> Never, ever use `tap(console.log)` again.

Add non-intrusive debugging capabilities for [RxJS](https://rxjs.dev/) applications to [Visual Studio Code](https://code.visualstudio.com/).

![Operator Log Points with RxJS Debugging for Visual Studio Code](./docs/demo.gif)

## Features

- RxJS debugging, fully integrated with Visual Studio Code
- Works with RxJS 6.6.7 and newer
- Support for Node.js and Webpack-based RxJS applications

## Requirements

- [Visual Studio Code 1.61](https://code.visualstudio.com/) or newer
- [RxJS 6.6.7](https://rxjs.dev/) or newer
- To debug NodeJS-based applications:
  - [Node.js 12](https://nodejs.org/) or newer
- To debug Webpack-based web applications:
  - [Webpack 5.60.0](https://webpack.js.org/) or newer
  - The [@rxjs-debugging/runtime-webpack](https://www.npmjs.com/package/@rxjs-debugging/runtime-webpack) Webpack plugin

## Usage

### Operator Log Points

Operator log points make manually added `console.log` statements a thing of the past: RxJS Debugger detects [operators](https://rxjs.dev/guide/operators) automatically and recommends a log point. Hover the mouse cursor on the operator to add or remove a log point to the respective operator:

<img src="./docs/manage-operator-log-points.gif" alt="Manage Operator Log Points" style="zoom: 50%;" />

Once you launch your application with the JavaScript debugger built-in to Visual Studio Code, enabled log points display [events of interest](https://rxjs.dev/guide/observable#anatomy-of-an-observable) inline in the editor:

- Subscribe
- Emitted values (next, error, complete)
- Unsubscribe

<img src="./docs/live-operator-logs.gif" alt="Live Operator Log Points" style="zoom: 50%;" />

By default, RxJS Debugger clears logged events from the editor after you stop the JavaScript debugger. You can customize this behavior in the settings.

Finally, you can toggle gutter indicators for recommended log points via the command palette:

<img src="./docs/toggle-log-points.gif" alt="Toggle Display of Log Point Recommendations" style="zoom: 50%;" />



----



## Roadmap & Future Development

Refer to the [milestones overview](https://github.com/swissmanu/rxjs-debugging-for-vscode/milestones) for planned, future iterations. The [issue list](https://github.com/swissmanu/rxjs-debugging-for-vscode/issues) provides an overview on all open development topics.

## Contributing

"RxJS Debugging for Visual Studio Code" welcomes any type of contribution! ❤️
Have a look at [CONTRIBUTING.md](./CONTRIBUTING.md) for further details.

## Playground

Jump right in and explore, how "RxJS Debugging for Visual Studio Code" can improve your RxJS debugging workflow:

https://github.com/swissmanu/playground-rxjs-debugging-for-vscode

## Analytics Data

The "RxJS Debugging for Visual Studio Code" extension collects usage analytics data from users who opt-in. See [ANALYTICS.md](./ANALYTICS.md) for more information on what data is collected and why.

## Research

This extension is based on research by Manuel Alabor. See [RESEARCH.md](./RESEARCH.md) for more information.
