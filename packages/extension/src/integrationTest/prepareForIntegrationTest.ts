import * as vscode from 'vscode';
import { IDecorationSetter } from '../decoration/decorationSetter';
import LiveLogDecorationProvider from '../decoration/liveLogDecorationProvider';
import LogPointDecorationProvider from '../decoration/logPointDecorationProvider';
import DecorationSetterSpy from './decorationSetterSpy';
import registerTestCommand from './registerTestCommand';
import { TestCommands } from './testCommands';

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
      const typeKey =
        decorationType === 'liveLog'
          ? LiveLogDecorationProvider.decorationTypeKey
          : LogPointDecorationProvider.decorationTypeKey;

      return recordedDecorations.filter(({ decorationType }) => decorationType === typeKey);
    })
  );

  return {
    DecorationSetter: DecorationSetterSpy,
  };
}
