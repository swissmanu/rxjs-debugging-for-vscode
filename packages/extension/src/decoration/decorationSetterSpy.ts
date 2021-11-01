import { injectable } from 'inversify';
import 'reflect-metadata';
import { DecorationOptions, Range, TextEditor, TextEditorDecorationType } from 'vscode';
import type { IDecorationSetter } from './decorationSetter';

@injectable()
export default class DecorationSetterSpy implements IDecorationSetter {
  static recordedCalls: Map<
    string,
    ReadonlyArray<{ decorationType: string; ranges: ReadonlyArray<string>; options: ReadonlyArray<string> }>
  > = new Map();

  set(
    textEditor: TextEditor,
    decorationType: TextEditorDecorationType,
    rangeOrOptions: ReadonlyArray<Range> | ReadonlyArray<DecorationOptions>
  ): void {
    const file = textEditor.document.fileName;
    const recordedForFile = DecorationSetterSpy.recordedCalls.get(file) || [];

    const ranges: string[] = [];
    const options: string[] = [];

    rangeOrOptions.map((x) => {
      if (x instanceof Range) {
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
