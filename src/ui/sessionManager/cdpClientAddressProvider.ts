import * as vscode from 'vscode';
import { ICDPClientAddress } from '../telemetryBridge/cdpClient';

export const ICDPClientAddressProvider = Symbol('CDPClientAddressProvider');

export interface ICDPClientAddressProvider {
  (debugSessionId: string): Promise<ICDPClientAddress | undefined>;
}

const JS_DEBUG_REQUEST_CDP_PROXY_COMMAND = 'extension.js-debug.requestCDPProxy';

/**
 * Checks if the `extension.js-debug.requestCDPProxy` command provided by `js-debug` is present. If present, executes
 * the command for the given debug session id and returns the connection information. This information in turn can be
 * used to connect to `js-debug`s CDP proxy.
 *
 * @param debugSessionId
 * @returns
 */
export default async function defaultCDPClientAddressProvider(
  debugSessionId: string
): Promise<ICDPClientAddress | undefined> {
  if (!isCDPProxyRequestAvailable()) {
    throw new Error(`Installed js-debug extension does not provide "${JS_DEBUG_REQUEST_CDP_PROXY_COMMAND}" command.`);
  }

  return vscode.commands.executeCommand(JS_DEBUG_REQUEST_CDP_PROXY_COMMAND, debugSessionId);
}

async function isCDPProxyRequestAvailable(): Promise<boolean> {
  const allCommands = await vscode.commands.getCommands();
  const hasRequestCDPProxyCommand = allCommands.find((c) => c === JS_DEBUG_REQUEST_CDP_PROXY_COMMAND);
  return typeof hasRequestCDPProxyCommand === 'string';
}
