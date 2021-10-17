import { RUNTIME_PROGRAM_ENV_VAR } from '@rxjs-debugging/runtime/out/consts';
import { inject, injectable } from 'inversify';
import { join, resolve } from 'path';
import { DebugConfiguration, DebugConfigurationProvider, window, WorkspaceFolder } from 'vscode';
import { ILogger } from './logger';
import { IRxJSDetector } from './workspaceMonitor/detector';

const runtimeNodeJsPath = resolve(join(__dirname, 'runtime-nodejs', 'runtime.js'));

export const INodeWithRxJSDebugConfigurationResolver = Symbol('NodeWithRxJSDebugConfigurationResolver');

@injectable()
export class NodeWithRxJSDebugConfigurationResolver implements DebugConfigurationProvider {
  static readonly types = ['node', 'pwa-node'];

  constructor(
    @inject(IRxJSDetector) private readonly rxJsDetector: IRxJSDetector,
    @inject(ILogger) private readonly logger: ILogger
  ) {}

  async resolveDebugConfiguration(
    folder: WorkspaceFolder | undefined,
    debugConfiguration: DebugConfiguration & { __parentId?: string }
  ): Promise<DebugConfiguration> {
    if (!hasParentDebugConfiguration(debugConfiguration) && folder && (await this.rxJsDetector.detect(folder))) {
      this.logger.info('Extension', `Augment debug configuration "${debugConfiguration.name}" with NodeJS Runtime.`);
      const originalRuntimeArgs = debugConfiguration.runtimeArgs ?? [];
      const augmentedRuntimeArgs = [...originalRuntimeArgs, '-r', runtimeNodeJsPath];

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

/**
 * This function checks the presence uf the `__parentId` property in the configuration.
 *
 * ## Context
 * vscode-js-debug creates debug sessions with a parent-child dependency. The child session is usually the actual
 * debugging session holding the CDP connection to the application under inspection. Such a child session can be
 * identified by the presence of the `__parentId` property in its configuration. This property is private API and might
 * change in the future. Use with care.
 *
 * @param debugConfiguration
 * @returns
 * @see Could be improved once https://github.com/microsoft/vscode/issues/123403 is resolved.
 */
export function hasParentDebugConfiguration(debugConfiguration: DebugConfiguration & { __parentId?: string }): boolean {
  return typeof debugConfiguration.__parentId === 'string';
}
