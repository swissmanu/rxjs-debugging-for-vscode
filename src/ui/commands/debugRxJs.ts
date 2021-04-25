import { interfaces } from 'inversify';
import * as vscode from 'vscode';
import { Commands, registerCommand } from '.';
import { ISessionManager } from '../sessionManager';
import { ITelemetryBridge } from '../telemetryBridge';

const SUPPORTED_DEBUG_SESSION_TYPES = ['pwa-extensionHost', 'node-terminal', 'pwa-node', 'pwa-chrome', 'pwa-msedge'];

export function registerDebugRxJS(context: vscode.ExtensionContext, rootContainer: interfaces.Container): void {
  context.subscriptions.push(
    registerCommand(vscode.commands, Commands.DebugRxJS, async (debugSessionId) => {
      const sessionId = debugSessionId || getActiveDebugSessionId();
      if (!sessionId) {
        vscode.window.showErrorMessage('Could not find an active, supported debug session.');
        return;
      }

      const sessionManager = rootContainer.get<ISessionManager>(ISessionManager);
      const sessionContainer = await sessionManager.createSessionContainer(sessionId);

      try {
        const telemetryBridge = sessionContainer.get<ITelemetryBridge>(ITelemetryBridge);

        telemetryBridge.onTelemetryEvent(console.log);
        await telemetryBridge.attach();

        vscode.window.showInformationMessage('Ready to debug!');
      } catch (e) {
        vscode.window.showErrorMessage(`Could not create receiver (${e})`);
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
