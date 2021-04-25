import { interfaces } from 'inversify';
import * as vscode from 'vscode';
import { Commands, registerCommand } from '.';
import { ISessionManager } from '../sessionManager';

const SUPPORTED_DEBUG_SESSION_TYPES = ['pwa-extensionHost', 'node-terminal', 'pwa-node', 'pwa-chrome', 'pwa-msedge'];

export function registerDebugRxJS(context: vscode.ExtensionContext, rootContainer: interfaces.Container): void {
  context.subscriptions.push(
    registerCommand(vscode.commands, Commands.DebugRxJS, async (debugSessionId) => {
      const debugSessionIdToConnectTo = debugSessionId || getActiveDebugSessionId();
      if (!debugSessionIdToConnectTo) {
        vscode.window.showErrorMessage('Could not find an active, supported debug session.');
        return;
      }

      try {
        const sessionManager = rootContainer.get<ISessionManager>(ISessionManager);
        const session = await sessionManager.createSession(debugSessionIdToConnectTo);
        await session.start();

        vscode.window.showInformationMessage('Ready to debug!');
      } catch (e) {
        vscode.window.showErrorMessage(`Could not create and start session (${e})`);
      }
    })
  );
}

function getActiveDebugSessionId(): string | undefined {
  const activeDebugSession = vscode.debug.activeDebugSession;
  if (activeDebugSession && isSupportedDebugSession(activeDebugSession)) {
    return activeDebugSession.id;
  }
  return;
}

function isSupportedDebugSession(debugSession: vscode.DebugSession): boolean {
  return SUPPORTED_DEBUG_SESSION_TYPES.some((t) => t === debugSession.type);
}
