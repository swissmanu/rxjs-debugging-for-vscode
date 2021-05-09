import { DecorationRangeBehavior, Range, TextDocument, ThemeColor, window } from 'vscode';
import { DocumentDecorationProvider } from '.';
import * as Telemetry from '../../shared/telemetry';
import { IDisposable } from '../../shared/types';
import { Colors } from '../colors';
import { ISessionManager } from '../sessionManager';
import { ISession } from '../sessionManager/session';

export const ILiveLogDecorationProvider = Symbol('LiveLogDecorationProvider');

type Line = number;
type Character = number;

export default class LiveLogDecorationProvider extends DocumentDecorationProvider {
  private readonly lastLogForLine: Map<Line, Map<Character, Telemetry.TelemetryEvent>> = new Map();

  private readonly onDidChangeActiveSessionDisposable: IDisposable;
  private onTelemetryEventDisposable: IDisposable | undefined;

  decorationType = liveLogDecorationType;

  constructor(sessionManager: ISessionManager, textDocument: TextDocument) {
    super(textDocument);
    this.onDidChangeActiveSessionDisposable = sessionManager.onDidChangeActiveSession(this.onDidChangeActiveSession);
  }

  private onDidChangeActiveSession = (session: ISession | undefined): void => {
    this.onTelemetryEventDisposable?.dispose();
    if (session) {
      this.onTelemetryEventDisposable = session.onTelemetryEvent(this.onTelemetryEvent);
    }
  };

  private onTelemetryEvent = (event: Telemetry.TelemetryEvent): void => {
    if (event.source.fileName !== this.document.fileName) {
      return;
    }

    const line = this.lastLogForLine.get(event.source.line);
    if (line) {
      line.set(event.source.character, event);
    } else {
      this.lastLogForLine.set(event.source.line, new Map([[event.source.character, event]]));
    }

    this.updateDecorations();
  };

  updateDecorations(): void {
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

    this.setDecorations(decorationOptions);
  }

  dispose(): void {
    super.dispose();

    this.onDidChangeActiveSessionDisposable.dispose();
    this.onTelemetryEventDisposable?.dispose();
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
