import { inject, injectable } from 'inversify';
import { resolve } from 'path';
import { DebugConfiguration, DebugConfigurationProvider, WorkspaceFolder } from 'vscode';
import { IRxJSDetector } from './detector';

const nodeRuntimePath = resolve(__dirname, 'runtime.node.js'); // TODO

export const INodeWithRxJSDebugConfigurationResolver = Symbol('NodeWithRxJSDebugConfigurationResolver');

@injectable()
export class NodeWithRxJSDebugConfigurationResolver implements DebugConfigurationProvider {
  static type = 'node';

  constructor(@inject(IRxJSDetector) private readonly rxJsDetector: IRxJSDetector) {}

  async resolveDebugConfiguration(
    folder: WorkspaceFolder | undefined,
    debugConfiguration: DebugConfiguration
  ): Promise<DebugConfiguration> {
    if (folder && (await this.rxJsDetector.detect(folder))) {
      const originalRuntimeArgs = debugConfiguration.runtimeArgs ?? [];
      const augmentedRuntimeArgs = [...originalRuntimeArgs, '-r', nodeRuntimePath];

      const augmentedConfiguration = {
        ...debugConfiguration,
        runtimeArgs: augmentedRuntimeArgs,
      };

      return augmentedConfiguration;
    }

    return debugConfiguration;
  }
}
