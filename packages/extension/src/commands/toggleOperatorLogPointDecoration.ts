import * as vscode from 'vscode';
import { Configuration } from '../configuration';
import { Commands } from './commands';
import registerCommand from './registerCommand';

export default function registerToggleOperatorLogPointDecorationCommand(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    registerCommand(vscode.commands, Commands.ToggleOperatorLogPointRecommendations, async () => {
      const newValue = !vscode.workspace
        .getConfiguration(Configuration.ShowLogPointRecommendations)
        .get(Configuration.ShowLogPointRecommendations, true);
      vscode.workspace.getConfiguration().update(Configuration.ShowLogPointRecommendations, newValue, true);
    })
  );
}
