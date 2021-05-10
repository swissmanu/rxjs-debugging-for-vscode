import { inject, injectable } from 'inversify';
import { resolve } from 'path';
import { DebugConfiguration, DebugConfigurationProvider, WorkspaceFolder } from 'vscode';
import { ILogger } from './logger';
import { IRxJSDetector } from './workspaceMonitor/detector';

const nodeRuntimePath = resolve(__dirname, 'runtime.node.js'); // TODO

export const INodeWithRxJSDebugConfigurationResolver = Symbol('NodeWithRxJSDebugConfigurationResolver');

@injectable()
export class NodeWithRxJSDebugConfigurationResolver implements DebugConfigurationProvider {
  static type = 'node';

  constructor(
    @inject(IRxJSDetector) private readonly rxJsDetector: IRxJSDetector,
    @inject(ILogger) private readonly logger: ILogger
  ) {}

  async resolveDebugConfiguration(
    folder: WorkspaceFolder | undefined,
    debugConfiguration: DebugConfiguration
  ): Promise<DebugConfiguration> {
    if (folder && (await this.rxJsDetector.detect(folder))) {
      this.logger.info('Extension', `Augment debug configuration "${debugConfiguration.name}" with NodeJS Runtime.`);
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
