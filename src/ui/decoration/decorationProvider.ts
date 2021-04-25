import {
  DecorationOptions,
  DecorationRangeBehavior,
  Disposable,
  Position,
  Range,
  TextEditor,
  TextEditorDecorationType,
  window,
} from 'vscode';

// https://github.com/eamodio/vscode-gitlens/blob/ff21b2dad55657cfe2db9f12807acdc89789e9c5/src/hovers/lineHoverController.ts#L22
// https://github.com/eamodio/vscode-gitlens/blob/ff21b2dad55657cfe2db9f12807acdc89789e9c5/src/annotations/annotations.ts#L229
// https://github.com/eamodio/vscode-gitlens/blob/main/src/annotations/lineAnnotationController.ts

const logPointToggleDecoration: TextEditorDecorationType = window.createTextEditorDecorationType(
  {
    light: {
      before: {
        contentIconPath:
          '/Users/mal/git/private/mse-master-thesis/rxjs-debugger/eye-light.svg',
      },
    },
    dark: {
      before: {
        contentIconPath:
          '/Users/mal/git/private/mse-master-thesis/rxjs-debugger/eye-dark.svg',
      },
    },
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  }
);

export class DecorationProvider implements Disposable {
  private editor: TextEditor | undefined;

  dispose(): void {
    this.detach();
  }

  attach(editor: TextEditor): void {
    this.detach();
    this.addDecorations(editor);
    this.editor = editor;
  }

  detach(): void {
    if (this.editor && (this.editor as any)._disposed !== true) {
      this.removeDecorations(this.editor);
      this.editor = undefined;
    }
  }

  private addDecorations(editor: TextEditor): void {
    const decorationOptions: DecorationOptions = {
      range: new Range(new Position(7, 4), new Position(7, 4)),
    };

    editor.setDecorations(logPointToggleDecoration, [decorationOptions]);
  }

  private removeDecorations(editor: TextEditor): void {
    editor.setDecorations(logPointToggleDecoration, []);
  }
}
