import { OperatorLogPointTelemetryEvent, TelemetryEvent } from '@rxjs-debugging/telemetry';
import matchTelemetryEvent from '@rxjs-debugging/telemetry/out/match';
import matchObservableEvent from '@rxjs-debugging/telemetry/out/observableEvent/match';
import { DecorationRangeBehavior, Range, TextDocument, TextEditor, ThemeColor, window } from 'vscode';
import { DocumentDecorationProvider } from '.';
import { Colors } from '../colors';
import { Configuration } from '../configuration';
import { IOperatorLogPointManager } from '../operatorLogPoint/manager';
import { ISessionManager } from '../sessionManager';
import { ISession } from '../sessionManager/session';
import { IConfigurationAccessor } from '../configuration/configurationAccessor';
import { IDisposable } from '../util/types';
import { IDecorationSetter } from './decorationSetter';

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
    private readonly configurationAccessor: IConfigurationAccessor,
    decorationSetter: IDecorationSetter,
    textDocument: TextDocument
  ) {
    super(textDocument, decorationSetter);
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
    const hideLiveLog: boolean = this.configurationAccessor.get(Configuration.HideLiveLogWhenStoppingDebugger, true);
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

  static get decorationTypeKey(): string {
    return liveLogDecorationType.key;
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
