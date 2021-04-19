import * as vscode from 'vscode';
import { Commands, registerCommand } from '.';
import { CDPProxyConnectionInformation } from '../../shared/types';
import Receiver from '../receiver';

const JS_DEBUG_REQUEST_CDP_PROXY_COMMAND = 'extension.js-debug.requestCDPProxy';
const SUPPORTED_DEBUG_SESSION_TYPES = [
  'pwa-extensionHost',
  'node-terminal',
  'pwa-node',
  'pwa-chrome',
  'pwa-msedge',
];

export function registerDebugRxJS(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    registerCommand(
      vscode.commands,
      Commands.DebugRxJS,
      async (debugSessionId) => {
        if (!isCDPProxyRequestAvailable()) {
          vscode.window.showErrorMessage(
            'Latest version of js-debug extension missing.'
          );
          return;
        }

        const sessionId = debugSessionId || getActiveDebugSessionId();
        if (!sessionId) {
          vscode.window.showErrorMessage(
            'Could not find an active, supported debug session.'
          );
          return;
        }

        const info = await getCDPProxyConnectionInformation(sessionId);
        if (info) {
          try {
            const receiver = new Receiver();
            receiver.onTelemetryEvent(console.log);
            receiver.attach(info.host, info.port);
          } catch (e) {
            vscode.window.showErrorMessage(
              `Could not create receiver (${JSON.stringify(e)})`
            );
          }
        } else {
          vscode.window.showErrorMessage(
            'Could not acquire CDP proxy connection information.'
          );
        }
      }
    )
  );
}

function getActiveDebugSessionId(): string | undefined {
  const activeDebugSession = vscode.debug.activeDebugSession;
  if (activeDebugSession && isSupportedDebugSession(activeDebugSession)) {
    return activeDebugSession.id;
  }
  return;
}

async function getCDPProxyConnectionInformation(
  debugSessionId: string
): Promise<CDPProxyConnectionInformation | undefined> {
  return await vscode.commands.executeCommand(
    JS_DEBUG_REQUEST_CDP_PROXY_COMMAND,
    debugSessionId
  );
}

async function isCDPProxyRequestAvailable(): Promise<boolean> {
  const allCommands = await vscode.commands.getCommands();
  const hasRequestCDPProxyCommand = allCommands.find(
    (c) => c === JS_DEBUG_REQUEST_CDP_PROXY_COMMAND
  );
  return typeof hasRequestCDPProxyCommand === 'string';
}

function isSupportedDebugSession(debugSession: vscode.DebugSession): boolean {
  return SUPPORTED_DEBUG_SESSION_TYPES.some((t) => t === debugSession.type);
}
