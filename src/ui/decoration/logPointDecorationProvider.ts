import { injectable } from 'inversify';
import {
  DecorationOptions,
  DecorationRangeBehavior,
  Range,
  TextEditor,
  TextEditorDecorationType,
  window,
} from 'vscode';
import { IDisposable } from '../../shared/types';

export const ILogPointDecorationProvider = Symbol('LogPointDecorationProvider');

export interface ILogPointDecorationProvider extends IDisposable {
  /**
   * Attaches the `DecorationProvider` to a given `TextEditor`. If the provider is already attached to an editor, it
   * will first detach from this one.
   *
   * @param editor
   */
  attach(editor: TextEditor): void;

  /**
   * Detach the `DecorationProvider` from its current `TextEditor`. All decorations will get removed in turn.
   */
  detach(): void;

  update(ranges: ReadonlyArray<Range>): void;
}

@injectable()
export default class LogPointDecorationProvider implements ILogPointDecorationProvider {
  private editor: TextEditor | undefined;
  private ranges: ReadonlyArray<Range> = [];

  attach(editor: TextEditor): void {
    this.detach();
    this.updateDecorations(editor, this.ranges);
    this.editor = editor;
  }

  detach(): void {
    if (this.editor && (this.editor as any)._disposed !== true) {
      this.removeAllDecorations(this.editor);
      this.editor = undefined;
    }
  }

  update(ranges: ReadonlyArray<Range>): void {
    this.ranges = ranges;

    if (this.editor) {
      this.updateDecorations(this.editor, ranges);
    }
  }

  private updateDecorations(editor: TextEditor, ranges: ReadonlyArray<Range>): void {
    const decorationOptions = ranges.map<DecorationOptions>((range) => ({ range }));
    editor.setDecorations(logPointDecorationType, decorationOptions);
  }

  private removeAllDecorations(editor: TextEditor): void {
    editor.setDecorations(logPointDecorationType, []);
  }

  dispose(): void {
    this.detach();
  }
}

// https://github.com/eamodio/vscode-gitlens/blob/ff21b2dad55657cfe2db9f12807acdc89789e9c5/src/hovers/lineHoverController.ts#L22
// https://github.com/eamodio/vscode-gitlens/blob/ff21b2dad55657cfe2db9f12807acdc89789e9c5/src/annotations/annotations.ts#L229
// https://github.com/eamodio/vscode-gitlens/blob/main/src/annotations/lineAnnotationController.ts

const logPointDecorationType: TextEditorDecorationType = window.createTextEditorDecorationType({
  light: {
    before: {
      contentIconPath: '/Users/mal/git/private/mse-master-thesis/rxjs-debugger/eye-light.svg',
    },
  },
  dark: {
    before: {
      contentIconPath: '/Users/mal/git/private/mse-master-thesis/rxjs-debugger/eye-dark.svg',
    },
  },
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});
