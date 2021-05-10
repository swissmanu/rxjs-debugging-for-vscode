import * as vscode from 'vscode';
import { Commands, registerCommand } from '.';
import { Configuration } from '../configuration';

export default function registerToggleLogPointDecorationCommand(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    registerCommand(vscode.commands, Commands.ToggleLogPointRecommendations, async () => {
      const newValue = !vscode.workspace
        .getConfiguration(Configuration.ShowLogPointRecommendations)
        .get(Configuration.ShowLogPointRecommendations, true);
      vscode.workspace.getConfiguration().update(Configuration.ShowLogPointRecommendations, newValue, true);
    })
  );
}
