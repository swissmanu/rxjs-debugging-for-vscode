import type * as vscodeApi from 'vscode';

export const IEnvironmentInfo = Symbol('IEnvironmentInfo');

/**
 * An injectable abstraction for various vscode specific environment information.
 */
export interface IEnvironmentInfo {
  version: string;
  machineId: string;
  language: string;
  extensionVersion: string;
}

export default function createEnvironmentInfo(vscode: typeof vscodeApi): IEnvironmentInfo {
  return {
    language: vscode.env.language,
    machineId: vscode.env.machineId,
    version: vscode.version,
    extensionVersion: EXTENSION_VERSION,
  };
}
