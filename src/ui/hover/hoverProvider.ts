import { inject, injectable } from 'inversify';
import { Disposable, Hover, languages, MarkdownString, Position, Range, TextDocument, TextEditor, Uri } from 'vscode';
import { IDisposable } from '../../shared/types';
import { Commands, getMarkdownCommandWithArgs } from '../commands';
import { ILogPointManager } from '../logPointManager';

export const ILogPointHoverProvider = Symbol('LogPointHoverProvider');

export interface ILogPointHoverProvider extends IDisposable {
  attach(editor: TextEditor): void;
  detach(): void;
  update(ranges: ReadonlyArray<Range>): void;
}

@injectable()
export default class LogPointHoverProvider implements ILogPointHoverProvider {
  private uri: Uri | undefined;
  private hoverDisposable: Disposable | undefined;
  private ranges: ReadonlyArray<Range> = [];

  constructor(@inject(ILogPointManager) private readonly logPointManager: ILogPointManager) {}

  attach(editor: TextEditor): void {
    this.detach();

    this.uri = editor.document.uri;
    this.hoverDisposable = languages.registerHoverProvider(
      { pattern: this.uri.fsPath },
      { provideHover: this.provideHover.bind(this) }
    );
  }

  detach(): void {
    this.uri = undefined;
    if (this.hoverDisposable) {
      this.hoverDisposable.dispose();
      this.hoverDisposable = undefined;
    }
  }

  update(ranges: ReadonlyArray<Range>): void {
    this.ranges = ranges;
  }

  private async provideHover(
    document: TextDocument,
    position: Position
    // _token: CancellationToken
  ): Promise<Hover | undefined> {
    if (document.uri.toString() !== this.uri?.toString()) {
      return undefined;
    }

    const range = this.ranges.find((range) => range.contains(position));
    if (range) {
      const enabled = !!this.logPointManager.logPoints.find(
        ({ fileName, lineNumber, columnNumber }) =>
          fileName === document.fileName && range.contains(new Position(lineNumber, columnNumber))
      );
      const markdown = new MarkdownString(
        enabled
          ? `[$(bug) Remove Operator Log Point](${getMarkdownCommandWithArgs(Commands.DisableLogPoint, [
              document.uri,
              range.start,
            ])} "Remove Log Point")`
          : `[$(bug) Add Operator Log Point](${getMarkdownCommandWithArgs(Commands.EnableLogPoint, [
              document.uri,
              range.start,
            ])} "Add Log Point")`,
        true
      );
      markdown.isTrusted = true;

      return new Hover(markdown, range);
    }

    return undefined;
  }

  dispose(): void {
    this.detach();
  }
}
