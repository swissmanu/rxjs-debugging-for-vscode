import { inject, injectable } from 'inversify';
import type * as vscode from 'vscode';
import { Configuration } from '.';
import { VsCodeApi } from '../ioc/types';

export const IConfigurationAccessor = Symbol('ConfigurationAccessor');

/**
 * An injectable abstraction over vscodes Configuration API.
 */
export interface IConfigurationAccessor {
  get<T>(section: Configuration, defaultValue: T): T;
  update<T>(section: Configuration, value: T, updateGlobally?: boolean): Promise<void>;
  hasGlobal(section: Configuration): boolean;
  onDidChangeConfiguration: vscode.Event<vscode.ConfigurationChangeEvent>;
}

@injectable()
export default class ConfigurationAccessor implements IConfigurationAccessor {
  constructor(@inject(VsCodeApi) private readonly vscodeApi: typeof vscode) {}

  get<T>(section: Configuration, defaultValue: T): T {
    const v = this.vscodeApi.workspace.getConfiguration().get(section, defaultValue);
    return v;
  }

  hasGlobal(section: Configuration): boolean {
    const inspection = this.vscodeApi.workspace.getConfiguration().inspect(section);

    if (inspection) {
      return inspection.globalValue !== undefined;
    }
    return false;
  }

  async update<T>(section: Configuration, value: T, updateGlobally = true): Promise<void> {
    await this.vscodeApi.workspace.getConfiguration().update(section, value, updateGlobally);
  }

  onDidChangeConfiguration(
    handler: (e: vscode.ConfigurationChangeEvent) => void,
    thisArg?: unknown,
    disposables?: vscode.Disposable[]
  ): vscode.Disposable {
    return this.vscodeApi.workspace.onDidChangeConfiguration(handler, thisArg, disposables);
  }
}
