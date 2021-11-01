import { injectable } from 'inversify';
import { DecorationOptions, Range, TextEditor, TextEditorDecorationType } from 'vscode';

export const IDecorationSetter = Symbol('DecorationSetter');

export interface IDecorationSetter {
  set(
    textEditor: TextEditor,
    decorationType: TextEditorDecorationType,
    rangeOrOptions: ReadonlyArray<Range> | ReadonlyArray<DecorationOptions>
  ): void;
}

/**
 * Default implementation of an `IDecorationSetter`. It simply forwards decorations to the `TextEditor` given.
 */
@injectable()
export default class DecorationSetter implements IDecorationSetter {
  set(
    textEditor: TextEditor,
    decorationType: TextEditorDecorationType,
    rangeOrOptions: ReadonlyArray<Range> | ReadonlyArray<DecorationOptions>
  ): void {
    textEditor.setDecorations(decorationType, rangeOrOptions);
  }
}
