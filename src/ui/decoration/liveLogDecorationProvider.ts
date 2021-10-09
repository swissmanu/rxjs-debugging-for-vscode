import { DecorationRangeBehavior, Range, TextDocument, TextEditor, ThemeColor, window, workspace } from 'vscode';
import { DocumentDecorationProvider } from '.';
import { OperatorLogPointTelemetryEvent, TelemetryEvent } from '../../shared/telemetry';
import matchTelemetryEvent from '../../shared/telemetry/match';
import matchObservableEvent from '../../shared/telemetry/observableEvent/match';
import { IDisposable } from '../../shared/types';
import { Colors } from '../colors';
import { Configuration } from '../configuration';
import { IOperatorLogPointManager } from '../operatorLogPoint/logPointManager';
import { ISessionManager } from '../sessionManager';
import { ISession } from '../sessionManager/session';

export const ILiveLogDecorationProvider = Symbol('LiveLogDecorationProvider');

type Line = number;
type Character = number;

export default class LiveLogDecorationProvider extends DocumentDecorationProvider {
  private readonly lastLogForLine: Map<Line, Map<Character, OperatorLogPointTelemetryEvent>> = new Map();

  private readonly onDidChangeActiveSessionDisposable: IDisposable;
  private readonly onDidTerminateSessionDisposable: IDisposable;
  private onTelemetryEventDisposable?: IDisposable;

  decorationType = liveLogDecorationType;

  constructor(
    private readonly sessionManager: ISessionManager,
    private readonly operatorLogPointManager: IOperatorLogPointManager,
    textDocument: TextDocument
  ) {
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
    const hideLiveLog: boolean = workspace.getConfiguration().get(Configuration.HideLiveLogWhenStoppingDebugger, true);
    if (hideLiveLog) {
      this.setDecorations([]);
    }
  };

  private onTelemetryEvent = (event: TelemetryEvent): void => {
    matchTelemetryEvent({
      OperatorLogPoint: (operatorTelemetryEvent) => {
        if (operatorTelemetryEvent.operator.fileName !== this.document.fileName) {
          return;
        }

        const operatorLogPoint = this.operatorLogPointManager.logPointForIdentifier(operatorTelemetryEvent.operator);
        if (!operatorLogPoint) {
          return;
        }

        const line = this.lastLogForLine.get(operatorLogPoint.sourcePosition.line);
        if (line) {
          line.set(operatorLogPoint.sourcePosition.character, operatorTelemetryEvent);
        } else {
          this.lastLogForLine.set(
            operatorLogPoint.sourcePosition.line,
            new Map([[operatorLogPoint.sourcePosition.character, operatorTelemetryEvent]])
          );
        }

        this.updateDecorations();
      },
    })(event);
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
        .map(([, operatorLogPointTelemetryEvent]) =>
          matchObservableEvent({
            Completed: () => 'Completed',
            Error: () => 'Error',
            Next: ({ value }) => `Next: ${value}`,
            Subscribe: () => 'Subscribe',
            Unsubscribe: () => 'Unsubscribe',
          })(operatorLogPointTelemetryEvent)
        )
        .join(', ');

      return {
        renderOptions: { after: { contentText } },
        range: new Range(line, Number.MAX_SAFE_INTEGER, line, Number.MAX_SAFE_INTEGER),
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
