import { inject, injectable } from 'inversify';
import { DecorationRangeBehavior, Range, TextEditor, ThemeColor, window } from 'vscode';
import * as Telemetry from '../../shared/telemetry';
import { IDisposable } from '../../shared/types';
import { Colors } from '../colors';
import { ISessionManager } from '../sessionManager';
import { ISession } from '../sessionManager/session';

export const ILiveLogDecorationProvider = Symbol('LiveLogDecorationProvider');

export interface ILiveLogDecorationProvider extends IDisposable {
  attach(editor: TextEditor): void;
  detach(): void;
  reset(): void;
}

type Line = number;
type Character = number;

@injectable()
export default class LiveLogDecorationProvider implements ILiveLogDecorationProvider {
  private editor: TextEditor | undefined;
  private readonly lastLogForLine: Map<Line, Map<Character, Telemetry.TelemetryEvent>> = new Map();
  private disposables: IDisposable[] = [];

  constructor(@inject(ISessionManager) sessionManager: ISessionManager) {
    this.disposables.push(sessionManager.onDidChangeActiveSession(this.onDidChangeActiveSession));
  }

  attach(editor: TextEditor): void {
    if (this.editor) {
      this.detach();
    }
    this.editor = editor;
  }

  detach(): void {
    if (this.editor && (this.editor as any)._disposed !== true) {
      this.removeAllDecorations(this.editor);
      this.editor = undefined;
    }
  }

  reset(): void {
    if (this.editor) {
      this.removeAllDecorations(this.editor);
    }
  }

  private onDidChangeActiveSession = (session: ISession | undefined): void => {
    this.dispose();

    if (session) {
      this.disposables.push(session.onTelemetryEvent(this.onTelemetryEvent));
    }
  };

  private onTelemetryEvent = (event: Telemetry.TelemetryEvent): void => {
    const line = this.lastLogForLine.get(event.source.line);
    if (line) {
      line.set(event.source.character, event);
    } else {
      this.lastLogForLine.set(event.source.line, new Map([[event.source.character, event]]));
    }

    if (this.editor) {
      this.updateDecorations(this.editor);
    }
  };

  private updateDecorations(editor: TextEditor): void {
    const decorationOptions = [...this.lastLogForLine.entries()].map(([line, characters]) => {
      const contentText = [...characters.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, event]) =>
          Telemetry.match({
            Completed: () => 'Completed',
            Error: () => 'Error',
            Next: ({ data: { value } }) => `Next: ${value}`,
            Subscribe: () => 'Subscribe',
            Unsubscribe: () => 'Unsubscribe',
          })(event)
        )
        .join(', ');

      return {
        renderOptions: { after: { contentText } },
        range: new Range(line - 1, Number.MAX_SAFE_INTEGER, line - 1, Number.MAX_SAFE_INTEGER),
      };
    });

    editor.setDecorations(liveLogDecorationType, decorationOptions);
  }

  private removeAllDecorations(editor: TextEditor): void {
    editor.setDecorations(liveLogDecorationType, []);
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}

const liveLogDecorationType = window.createTextEditorDecorationType({
  after: {
    margin: '0 0 0 3em',
    color: new ThemeColor(Colors.LiveLogLineForegroundColor),
    backgroundColor: new ThemeColor(Colors.LiveLogLineBackgroundColor),
  },
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});
