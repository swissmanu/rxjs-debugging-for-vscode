# Contributing

This project welcomes any type of contribution! ❤️ [Opening an issue](https://github.com/swissmanu/rxjs-debugging-for-vscode/issues/new/choose) to document a problem you encountered or suggesting a new feature is always a good start.

Before you submit a pull request, please discuss potential changes with the maintainer either in an [issue](https://github.com/swissmanu/rxjs-debugging-for-vscode/issues/new/choose), using [GitHub Discussions](https://github.com/swissmanu/rxjs-debugging-for-vscode/discussions) or via email.

## Development

### Get Started

To get started with development, follow these four steps:

1. Clone the repo and run `yarn` to install all dependencies.
2. Open the repo in Visual Studio Code.
3. Run the "extension: Build and Watch" task, which will continuously (re-)build the extension.
4. Run the "Testbench: NodeJS" launch configuration.
   This opens `packages/testbench-nodejs` as workspace of a new instance of Visual Studio Code, running the development version of the extension.


### Repository Structure

This repository is organized as monorepo. We use [nx](https://nx.dev/) and [lerna](https://lerna.js.org/) to streamline tasks.

Following packages can be found in the [`packages`](./packages) directory:

- [`extension`](./packages/extension): The main package containing the debugging extension for Visual Studio Code.
- [`telemetry`](./packages/telemetry): TypeScript types and helper functions used for communication between runtime and debugging extension.
- [`runtime`](./packages/runtime): Contains rudimentary utilities to augment RxJS in an arbitrary runtime environment.
- [`runtime-nodejs`](./packages/runtime-nodejs): NodeJS specific augmentation functionalities.
- [`runtime-webpack`](./packages/runtime-webpack): Webpack plugin, published as `@rxjs-debugging/runtime-webpack`, providing runtime augmentation for web applications built with Webpack.
- [`testbench-*`](./packages): Test environments simulating various scenarios to test the debugger.

### Architecture Concepts

The [ARCHITECTURE.md](./ARCHITECTURE.md) file gives an overview on the most important architectural concepts.
