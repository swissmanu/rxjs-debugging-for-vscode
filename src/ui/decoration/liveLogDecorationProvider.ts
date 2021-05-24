import { DecorationRangeBehavior, Range, TextDocument, TextEditor, ThemeColor, window, workspace } from 'vscode';
import { DocumentDecorationProvider } from '.';
import * as Telemetry from '../../shared/telemetry';
import { IDisposable } from '../../shared/types';
import { Colors } from '../colors';
import { Configuration } from '../configuration';
import { ISessionManager } from '../sessionManager';
import { ISession } from '../sessionManager/session';

export const ILiveLogDecorationProvider = Symbol('LiveLogDecorationProvider');

type Line = number;
type Character = number;

export default class LiveLogDecorationProvider extends DocumentDecorationProvider {
  private readonly lastLogForLine: Map<Line, Map<Character, ReadonlyArray<Telemetry.TelemetryEvent>>> = new Map();

  private readonly onDidChangeActiveSessionDisposable: IDisposable;
  private readonly onDidTerminateSessionDisposable: IDisposable;
  private onTelemetryEventDisposable?: IDisposable;

  decorationType = liveLogDecorationType;

  constructor(private readonly sessionManager: ISessionManager, textDocument: TextDocument) {
    super(textDocument);
    this.onDidChangeActiveSessionDisposable = sessionManager.onDidChangeActiveSession(this.onDidChangeActiveSession);
    this.onDidTerminateSessionDisposable = sessionManager.onDidTerminateSession(this.onDidTerminateSession);
  }

  private onDidChangeActiveSession = (session: ISession | undefined): void => {
    this.onTelemetryEventDisposable?.dispose();
    if (session) {
      this.onTelemetryEventDisposable = session.onTelemetryEvent(this.onTelemetryEvent);
    }
  };

  private onDidTerminateSession = (): void => {
    this.lastLogForLine.clear();

    const hideLiveLog: boolean = workspace.getConfiguration().get(Configuration.HideLiveLogWhenStoppingDebugger, true);
    if (hideLiveLog) {
      this.setDecorations([]);
    }
  };

  private onTelemetryEvent = (event: Telemetry.TelemetryEvent): void => {
    if (event.source.fileName !== this.document.fileName) {
      return;
    }

    const line = this.lastLogForLine.get(event.source.line);
    if (line) {
      if (shouldMemoizePreviousEvent(event)) {
        const prevEvents = line.get(event.source.character);
        if (prevEvents) {
          line.set(event.source.character, [...prevEvents, event]);
        } else {
          line.set(event.source.character, [event]);
        }
      } else {
        line.set(event.source.character, [event]);
      }
    } else {
      this.lastLogForLine.set(event.source.line, new Map([[event.source.character, [event]]]));
    }

    this.updateDecorations();
  };

  attach(textEditors: ReadonlyArray<TextEditor>): void {
    super.attach(textEditors);
    if (this.sessionManager.activeSession) {
      this.onTelemetryEventDisposable = this.sessionManager.activeSession.onTelemetryEvent(this.onTelemetryEvent);
    }
  }

  updateDecorations(): void {
    const decorationOptions = [...this.lastLogForLine.entries()].map(([line, characters]) => {
      const contentText = [...characters.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, events]) =>
          events
            .map((event) =>
              Telemetry.match({
                Completed: () => 'Completed',
                Error: () => 'Error',
                Next: ({ data: { value } }) => `Next: ${value}`,
                Subscribe: () => 'Subscribe',
                Unsubscribe: () => 'Unsubscribe',
              })(event)
            )
            .join(', ')
        )
        .join(' - ');

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
    this.onDidTerminateSessionDisposable.dispose();
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

const shouldMemoizePreviousEvent = Telemetry.match({
  Completed: () => true,
  Error: () => true,
  Next: () => false,
  Subscribe: () => false,
  Unsubscribe: () => true,
});
