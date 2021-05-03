import { inject, injectable } from 'inversify';
import {
  DecorationOptions,
  DecorationRangeBehavior,
  MarkdownString,
  Range,
  TextEditor,
  TextEditorDecorationType,
  window,
} from 'vscode';
import { IDisposable } from '../../shared/types';
import { Commands, getMarkdownCommandWithArgs } from '../commands';
import { LogPoint } from '../logPoint';
import { ILogPointManager } from '../logPoint/logPointManager';
import { ILogPointRecommender } from '../logPoint/logPointRecommender';
import { IResourceProvider } from '../resources';

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

  update(logPoints: ReadonlyArray<LogPoint>): void;
}

@injectable()
export default class LogPointDecorationProvider implements ILogPointDecorationProvider {
  private editor: TextEditor | undefined;
  private disposables: IDisposable[] = [];
  private recommendedLogPoints: Map<string, LogPoint> = new Map();
  private enabledLogPoints: Map<string, LogPoint> = new Map();

  private readonly recommendedLogPointDecorationType: TextEditorDecorationType;
  private readonly enabledLogPointDecorationType: TextEditorDecorationType;

  constructor(
    @inject(ILogPointRecommender) readonly logPointRecommender: ILogPointRecommender,
    @inject(ILogPointManager) readonly logPointManager: ILogPointManager,
    @inject(IResourceProvider) readonly resourceProvider: IResourceProvider
  ) {
    this.recommendedLogPointDecorationType = window.createTextEditorDecorationType({
      before: {
        contentIconPath: resourceProvider.uriForResource('debug-breakpoint-log-unverified.svg'),
      },
      rangeBehavior: DecorationRangeBehavior.ClosedClosed,
    });
    this.enabledLogPointDecorationType = window.createTextEditorDecorationType({
      before: {
        contentIconPath: resourceProvider.uriForResource('debug-breakpoint-log.svg'),
      },
      rangeBehavior: DecorationRangeBehavior.ClosedClosed,
    });

    this.disposables.push(
      logPointRecommender.onRecommendLogPoints(this.onRecommendLogPoints),
      logPointManager.onDidChangeLogPoints(this.onDidChangeLogPoints),
      this.recommendedLogPointDecorationType,
      this.enabledLogPointDecorationType
    );
  }

  attach(editor: TextEditor): void {
    this.logPointRecommender.recommend(editor.document);
    this.detach();
    this.update();
    this.editor = editor;
  }

  detach(): void {
    if (this.editor && (this.editor as any)._disposed !== true) {
      this.removeAllDecorations(this.editor);
      this.editor = undefined;
    }
  }

  update(): void {
    if (this.editor) {
      this.updateDecorations(
        this.editor,
        [...this.recommendedLogPoints.values()].reduce<ReadonlyArray<LogPoint>>((acc, recommendedLogPoint) => {
          const key = recommendedLogPoint.key;
          return [...acc, this.enabledLogPoints.get(key) ?? recommendedLogPoint];
        }, [])
      );
    }
  }

  private onRecommendLogPoints = (logPoints: ReadonlyArray<LogPoint>): void => {
    this.recommendedLogPoints = new Map(logPoints.map((l) => [l.key, l]));
    this.update();
  };

  private onDidChangeLogPoints = (logPoints: ReadonlyArray<LogPoint>): void => {
    this.enabledLogPoints = new Map(logPoints.map((l) => [l.key, l]));
    this.update();
  };

  private updateDecorations(editor: TextEditor, logPoints: ReadonlyArray<LogPoint>): void {
    const [recommended, enabled] = logPoints.reduce<[DecorationOptions[], DecorationOptions[]]>(
      ([recommended, enabled], logPoint) => {
        const hoverMessage = new MarkdownString(
          logPoint.enabled
            ? `$(bug) RxJS: [Remove Operator Log Point](${getMarkdownCommandWithArgs(Commands.DisableLogPoint, [
                editor.document.uri,
                logPoint.position,
              ])} "Stop logging values emitted by this operator.")`
            : `$(bug)  RxJS: [Add Operator Log Point](${getMarkdownCommandWithArgs(Commands.EnableLogPoint, [
                editor.document.uri,
                logPoint.position,
              ])} "Log values emitted by this operator.")`,
          true
        );
        hoverMessage.isTrusted = true;

        if (logPoint.enabled) {
          return [
            recommended,
            [
              ...enabled,
              {
                range: new Range(logPoint.position, logPoint.position.with(undefined, logPoint.position.character + 3)),
                hoverMessage,
              },
            ],
          ];
        }
        return [
          [
            ...recommended,
            {
              range: new Range(logPoint.position, logPoint.position.with(undefined, logPoint.position.character + 3)),
              hoverMessage,
            },
          ],
          enabled,
        ];
      },
      [[], []]
    );

    editor.setDecorations(this.recommendedLogPointDecorationType, recommended);
    editor.setDecorations(this.enabledLogPointDecorationType, enabled);
  }

  private removeAllDecorations(editor: TextEditor): void {
    editor.setDecorations(this.recommendedLogPointDecorationType, []);
    editor.setDecorations(this.enabledLogPointDecorationType, []);
  }

  dispose(): void {
    this.detach();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
