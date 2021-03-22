import * as vscode from 'vscode';

export interface CDPProxyConnectionInformation {
  host: string;
  port: number;
}

export interface RxJSDebugConfigurationRequestArguments {
  cdpProxy: CDPProxyConnectionInformation;
}

export function createRxJSDebugConfiguration(
  connectionInformation: CDPProxyConnectionInformation,
  debugServer?: number
): vscode.DebugConfiguration {
  return {
    name: 'RxJS',
    type: 'rxjs',
    request: 'attach',
    debugServer,
    cdpProxy: connectionInformation,
  };
}
