import { inject, injectable } from 'inversify';
import { resolve } from 'path';
import { DebugConfiguration, DebugConfigurationProvider, window, WorkspaceFolder } from 'vscode';
import { RUNTIME_PROGRAM_ENV_VAR } from '../shared/telemetry';
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

      const program = debugConfiguration.program ?? '';
      const env = debugConfiguration.env ?? {};

      if (program === '') {
        this.logger.error(
          'Extension',
          `Debug configuration "${debugConfiguration.name}" is missing "program" property`
        );
        window.showErrorMessage(
          `Add "program" property to debug configuration "${debugConfiguration.name}" to enable RxJS Debugging.`
        );
      }

      const augmentedConfiguration = {
        ...debugConfiguration,
        env: {
          ...env,
          [RUNTIME_PROGRAM_ENV_VAR]: program,
        },
        runtimeArgs: augmentedRuntimeArgs,
      };

      return augmentedConfiguration;
    }

    return debugConfiguration;
  }
}
