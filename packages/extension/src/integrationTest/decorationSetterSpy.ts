import { injectable } from 'inversify';
import * as path from 'path';
import 'reflect-metadata';
import * as vscode from 'vscode';
import type { IDecorationSetter } from '../decoration/decorationSetter';

@injectable()
export default class DecorationSetterSpy implements IDecorationSetter {
  static recordedCalls: Map<
    string,
    ReadonlyArray<{ decorationType: string; ranges: ReadonlyArray<string>; options: ReadonlyArray<string> }>
  > = new Map();

  set(
    textEditor: vscode.TextEditor,
    decorationType: vscode.TextEditorDecorationType,
    rangeOrOptions: ReadonlyArray<vscode.Range> | ReadonlyArray<vscode.DecorationOptions>
  ): void {
    const file = path.relative(
      vscode.workspace.getWorkspaceFolder(textEditor.document.uri)!.uri.fsPath,
      textEditor.document.fileName
    );
    const recordedForFile = DecorationSetterSpy.recordedCalls.get(file) || [];

    const ranges: string[] = [];
    const options: string[] = [];

    rangeOrOptions.map((x) => {
      if (x instanceof vscode.Range) {
        ranges.push(`(${x.start.line}:${x.start.character}):(${x.end.line}:${x.end.character})`);
      } else {
        options.push(
          `(${x.range.start.line}:${x.range.start.character}):(${x.range.end.line}:${
            x.range.end.character
          })-${x.hoverMessage?.toString()}-${JSON.stringify(x.renderOptions)}`
        );
      }
    });

    DecorationSetterSpy.recordedCalls.set(file, [
      ...recordedForFile,
      { decorationType: decorationType.key, ranges, options },
    ]);
  }
}
