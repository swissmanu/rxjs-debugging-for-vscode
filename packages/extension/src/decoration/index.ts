import { DecorationOptions, TextDocument, TextEditor, TextEditorDecorationType } from 'vscode';
import { IDisposable } from '../util/types';

export interface IDecorationProvider extends IDisposable {
  /**
   * The `TextEditorDecorationType` provided by this `IDecorationProvider`.
   */
  readonly decorationType: TextEditorDecorationType;

  attach(textEditors: ReadonlyArray<TextEditor>): void;

  detach(): void;

  /**
   * (Re-)create `TextEditor` decorations.
   */
  updateDecorations(): void;
}

/**
 * A `DocumentDecorationProvider` belongs to a specific `TextDocument` and provides decorations to multiple
 * `TextEditor`s showing that document.
 */
export abstract class DocumentDecorationProvider implements IDecorationProvider {
  private textEditors: ReadonlyArray<TextEditor> = [];

  /**
   * @inheritdoc
   */
  abstract decorationType: TextEditorDecorationType;

  constructor(protected readonly document: TextDocument) {}

  /**
   * Provide decorations to a new set of text editors. `attach` takes care that decorations are only provided if an
   * editor shows the document of this `DocumentDecorationProvider`.
   *
   * @param textEditors
   */
  attach(textEditors: ReadonlyArray<TextEditor>): void {
    this.detach();
    this.textEditors = textEditors.filter((t) => t.document.uri.toString() === this.document.uri.toString());
    this.updateDecorations();
  }

  /**
   * Remove decorations from currently tracked `TextEditor`s and reset tracked editors.
   */
  detach(): void {
    this.setDecorations([]);
    this.textEditors = [];
  }

  /**
   * (Re-)create `TextEditor` decorations. You can use `setDecorations` in the concrete `DocumentDecorationProvider`
   * implementation to update all currently tracked text editors with the new decorations.
   */
  abstract updateDecorations(): void;

  /**
   * Set decorations for all `TextEditor`s currently served through this decoration provider.
   *
   * @param decorationOptions
   */
  protected setDecorations(decorationOptions: DecorationOptions[]): void {
    for (const editor of this.textEditors) {
      editor.setDecorations(this.decorationType, decorationOptions);
    }
  }

  dispose(): void {
    this.detach();
  }
}
