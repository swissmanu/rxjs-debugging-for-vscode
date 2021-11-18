import { inject, injectable } from 'inversify';
import type * as vscode from 'vscode';
import { VsCodeApi } from '../ioc/types';

export const IConfigurationAccessor = Symbol('IConfigurationAccessor');

/**
 * An injectable abstraction over vscodes Configuration API.
 */
export interface IConfigurationAccessor {
  get<T>(section: string, defaultValue: T): T;
  onDidChangeConfiguration: vscode.Event<vscode.ConfigurationChangeEvent>;
}

@injectable()
export default class ConfigurationAccessor implements IConfigurationAccessor {
  constructor(@inject(VsCodeApi) private readonly vscodeApi: typeof vscode) {}

  get<T>(section: string, defaultValue: T): T {
    const v = this.vscodeApi.workspace.getConfiguration().get(section, defaultValue);
    return v;
  }

  onDidChangeConfiguration(
    handler: (e: vscode.ConfigurationChangeEvent) => any,
    thisArg?: any,
    disposables?: vscode.Disposable[]
  ): vscode.Disposable {
    return this.vscodeApi.workspace.onDidChangeConfiguration(handler, thisArg, disposables);
  }
}
