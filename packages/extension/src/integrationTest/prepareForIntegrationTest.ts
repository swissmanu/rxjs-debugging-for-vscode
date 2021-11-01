import * as vscode from 'vscode';
import { IDecorationSetter } from '../decoration/decorationSetter';
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
    registerTestCommand(vscode.commands, TestCommands.GetDecorationSetterRecording, async () => {
      const dict: {
        [index: string]: ReadonlyArray<{
          decorationType: string;
          ranges: ReadonlyArray<string>;
          options: ReadonlyArray<string>;
        }>;
      } = {};

      DecorationSetterSpy.recordedCalls.forEach((calls, file) => {
        dict[file] = calls;
      });
      return JSON.stringify(dict);
    })
  );

  return {
    DecorationSetter: DecorationSetterSpy,
  };
}
