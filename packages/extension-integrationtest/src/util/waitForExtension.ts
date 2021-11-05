import { Commands } from 'rxjs-debugging-for-vs-code/out/integrationTest';
import * as vscode from 'vscode';

async function waitForCommands(): Promise<void> {
  const command = Commands.EnableOperatorLogPoint;
  const commands = await vscode.commands.getCommands(true);
  if (commands.indexOf(command) !== -1) {
    return;
  }
  throw new Error(`"${command}" Command not found`);
}

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function waitForExtension(): Promise<void> {
  let ok = false;
  for (let retry = 0; retry < 5; retry++) {
    try {
      await waitForCommands();
      ok = true;
    } catch (_) {
      await wait(1000);
    }
  }

  if (!ok) {
    throw new Error('Could not determine if extension was available or not.');
  }
}
