import {
  CancellationToken,
  Disposable,
  Hover,
  languages,
  MarkdownString,
  Position,
  Range,
  TextDocument,
  TextEditor,
  Uri,
} from 'vscode';
import { Commands, getMarkdownCommandWithArgs } from '../commands';

export class HoverProvider implements Disposable {
  private uri: Uri | undefined;
  private hoverDisposable: Disposable | undefined;

  dispose(): void {
    this.detach();
  }

  attach(editor: TextEditor): void {
    this.detach();
    this.addHovers(editor);
  }

  detach(): void {
    this.uri = undefined;
    if (this.hoverDisposable) {
      this.hoverDisposable.dispose();
      this.hoverDisposable = undefined;
    }
  }

  private async provideHover(
    document: TextDocument,
    position: Position,
    _token: CancellationToken
  ): Promise<Hover | undefined> {
    if (
      position.line === 7 &&
      position.character >= 3 &&
      position.character <= 7
    ) {
      const markdown = new MarkdownString(
        `RxJS Debugger\n---\n\n[$(bug) Add Operator Log Point](${getMarkdownCommandWithArgs(
          Commands.EnableLogPoint,
          []
        )} "Add Log Point")`,
        true
      );
      markdown.isTrusted = true;

      return new Hover(
        markdown,
        new Range(position, position.with(undefined, position.character + 1))
      );
    }

    return undefined;
  }

  private addHovers(editor: TextEditor) {
    this.uri = editor.document.uri;

    this.hoverDisposable = languages.registerHoverProvider(
      { pattern: this.uri.fsPath },
      { provideHover: this.provideHover.bind(this) }
    );
  }
}
