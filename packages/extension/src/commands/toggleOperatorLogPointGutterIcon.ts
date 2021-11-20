import * as vscode from 'vscode';
import { Configuration } from '../configuration';
import { IConfigurationAccessor } from '../configuration/configurationAccessor';
import { Commands } from './commands';
import registerCommand from './registerCommand';

export default function registerToggleOperatorLogPointDecorationCommand(
  context: vscode.ExtensionContext,
  configurationAccessor: IConfigurationAccessor
): void {
  context.subscriptions.push(
    registerCommand(vscode.commands, Commands.ToggleOperatorLogPointGutterIcon, async () => {
      const newValue = !configurationAccessor.get(Configuration.RecommendOperatorLogPointsWithAnIcon, true);
      configurationAccessor.update(Configuration.RecommendOperatorLogPointsWithAnIcon, newValue);
    })
  );
}
