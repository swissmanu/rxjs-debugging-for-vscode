import { inject, injectable } from 'inversify';
import { DecorationRangeBehavior, Range, TextEditor, window } from 'vscode';
import { IDisposable } from '../../shared/types';
import { ISessionManager } from '../sessionManager';
import { ISession } from '../sessionManager/session';
import * as Telemetry from '../../shared/telemetry';

export const ILiveLogDecorationProvider = Symbol('LiveLogDecorationProvider');

export interface ILiveLogDecorationProvider extends IDisposable {
  attach(editor: TextEditor): void;
  detach(): void;
  reset(): void;
}

@injectable()
export default class LiveLogDecorationProvider implements ILiveLogDecorationProvider {
  private editor: TextEditor | undefined;
  private readonly lastLogForLine: Map<number, string> = new Map();
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
    const contentText = Telemetry.match({
      Completed: () => 'Completed',
      Error: () => 'Error',
      Next: ({ data: { value } }) => `Next: ${value}`,
      Subscribe: () => 'Subscribe',
      Unsubscribe: () => 'Unsubscribe',
    })(event);
    this.editor?.setDecorations(liveLogDecorationType, [
      {
        range: new Range(
          event.source.line - 1,
          Number.MAX_SAFE_INTEGER,
          event.source.line - 1,
          Number.MAX_SAFE_INTEGER
        ),
        renderOptions: { after: { contentText } },
      },
    ]);
  };

  private removeAllDecorations(editor: TextEditor): void {
    editor.setDecorations(liveLogDecorationType, []);
  }

  dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}

const liveLogDecorationType = window.createTextEditorDecorationType({
  after: {
    margin: '0 0 0 3em',
  },
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});
