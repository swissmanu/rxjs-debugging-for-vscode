import * as vscode from 'vscode';
import { IDecorationSetter } from '../decoration/decorationSetter';
import LiveLogDecorationProvider from '../decoration/liveLogDecorationProvider';
import OperatorLogPointDecorationProvider from '../decoration/operatorLogPointDecorationProvider';
import OperatorLogPointGutterIconDecorationProvider from '../decoration/operatorLogPointGutterIconDecorationProvider';
import DecorationSetterSpy from './decorationSetterSpy';
import registerTestCommand from './registerTestCommand';
import { ITestCommandTypes, TestCommands } from './testCommands';

/**
 * Prepares the extension for an integration test run.
 *
 * @param context
 * @returns
 */
export default function prepareForIntegrationTest(context: vscode.ExtensionContext): {
  DecorationSetter: { new (): IDecorationSetter };
} {
  context.subscriptions.push(
    registerTestCommand(vscode.commands, TestCommands.GetDecorationSetterRecording, async (file, decorationType) => {
      const recordedDecorations = DecorationSetterSpy.recordedCalls.get(file) ?? [];
      const typeKey = decorationTypeKeyForDecorationType(decorationType);

      return recordedDecorations.filter(({ decorationType }) => decorationType === typeKey);
    })
  );

  return {
    DecorationSetter: DecorationSetterSpy,
  };
}

function decorationTypeKeyForDecorationType(
  decorationType: Parameters<ITestCommandTypes[TestCommands.GetDecorationSetterRecording]>[1]
): string {
  switch (decorationType) {
    case 'liveLog':
      return LiveLogDecorationProvider.decorationTypeKey;
    case 'logPointGutterIcon':
      return OperatorLogPointGutterIconDecorationProvider.decorationTypeKey;
    case 'logPoints':
      return OperatorLogPointDecorationProvider.decorationTypeKey;
  }
}
