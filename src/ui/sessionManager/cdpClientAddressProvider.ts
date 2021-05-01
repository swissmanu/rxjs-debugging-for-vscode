import { inject, injectable } from 'inversify';
import type * as vscodeApiType from 'vscode';
import { VsCodeApi } from '../ioc/types';
import { ICDPClientAddress } from '../telemetryBridge/cdpClient';

export const ICDPClientAddressProvider = Symbol('CDPClientAddressProvider');

export interface ICDPClientAddressProvider {
  getCDPClientAddress(debugSessionId: string): Promise<ICDPClientAddress | undefined>;
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
@injectable()
export default class DefaultCDPClientAddressProvider implements ICDPClientAddressProvider {
  constructor(@inject(VsCodeApi) private readonly vscode: typeof vscodeApiType) {}

  async getCDPClientAddress(debugSessionId: string): Promise<ICDPClientAddress | undefined> {
    if (!(await isCDPProxyRequestAvailable(this.vscode))) {
      throw new Error(`Installed js-debug extension does not provide "${JS_DEBUG_REQUEST_CDP_PROXY_COMMAND}" command.`);
    }

    return await this.vscode.commands.executeCommand(JS_DEBUG_REQUEST_CDP_PROXY_COMMAND, debugSessionId);
  }
}

async function isCDPProxyRequestAvailable(vscode: typeof vscodeApiType): Promise<boolean> {
  const allCommands = await vscode.commands.getCommands();
  const hasRequestCDPProxyCommand = allCommands.find((c) => c === JS_DEBUG_REQUEST_CDP_PROXY_COMMAND);
  return typeof hasRequestCDPProxyCommand === 'string';
}
