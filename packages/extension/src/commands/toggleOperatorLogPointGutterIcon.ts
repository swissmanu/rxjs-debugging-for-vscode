import * as vscode from 'vscode';
import { Configuration } from '../configuration';
import { Commands } from './commands';
import registerCommand from './registerCommand';

export default function registerToggleOperatorLogPointDecorationCommand(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    registerCommand(vscode.commands, Commands.ToggleOperatorLogPointGutterIcon, async () => {
      const newValue = !vscode.workspace
        .getConfiguration(Configuration.RecommendOperatorLogPointsWithAnIcon)
        .get(Configuration.RecommendOperatorLogPointsWithAnIcon, true);
      vscode.workspace.getConfiguration().update(Configuration.RecommendOperatorLogPointsWithAnIcon, newValue);
    })
  );
}
