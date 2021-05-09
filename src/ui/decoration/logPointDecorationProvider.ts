import {
  DecorationOptions,
  DecorationRangeBehavior,
  MarkdownString,
  Range,
  TextDocument,
  TextEditor,
  window,
} from 'vscode';
import { DocumentDecorationProvider } from '.';
import { IDisposable } from '../../shared/types';
import { Commands, getMarkdownCommandWithArgs } from '../commands';
import { LogPoint } from '../logPoint';
import { ILogPointManager } from '../logPoint/logPointManager';
import { ILogPointRecommendationEvent, ILogPointRecommender } from '../logPoint/logPointRecommender';
import { IResourceProvider } from '../resources';

export default class LogPointDecorationProvider extends DocumentDecorationProvider {
  private recommendedLogPoints: Map<string, LogPoint> = new Map();
  private enabledLogPoints: Map<string, LogPoint> = new Map();

  private readonly onRecommendLogPointsDisposable: IDisposable;
  private readonly onDidChangeLogPointsDisposable: IDisposable;

  decorationType = RecommendedLogPointDecorationType;

  constructor(
    logPointRecommender: ILogPointRecommender,
    private readonly logPointManager: ILogPointManager,
    private readonly resourceProvider: IResourceProvider,
    textDocument: TextDocument
  ) {
    super(textDocument);

    this.onRecommendLogPointsDisposable = logPointRecommender.onRecommendLogPoints(this.onRecommendLogPoints);
    this.onDidChangeLogPointsDisposable = logPointManager.onDidChangeLogPoints(this.onDidChangeLogPoints);
  }

  private onRecommendLogPoints = ({ documentUri, logPoints }: ILogPointRecommendationEvent): void => {
    if (documentUri.toString() !== this.document.uri.toString()) {
      return;
    }

    this.recommendedLogPoints = new Map(
      logPoints.reduce<ReadonlyArray<[string, LogPoint]>>(
        (acc, l) => (l.fileName === this.document.fileName ? [...acc, [l.key, l]] : acc),
        []
      )
    );
    this.updateDecorations();
  };

  private onDidChangeLogPoints = (logPoints: ReadonlyArray<LogPoint>): void => {
    this.enabledLogPoints = new Map(
      logPoints.reduce<ReadonlyArray<[string, LogPoint]>>(
        (acc, l) => (l.fileName === this.document.fileName ? [...acc, [l.key, l]] : acc),
        []
      )
    );
    this.updateDecorations();
  };

  attach(textEditors: ReadonlyArray<TextEditor>): void {
    super.attach(textEditors);
    this.onDidChangeLogPoints(this.logPointManager.logPoints);
  }

  updateDecorations(): void {
    const logPoints = [...this.recommendedLogPoints.values()].reduce<ReadonlyArray<LogPoint>>(
      (acc, recommendedLogPoint) => [...acc, this.enabledLogPoints.get(recommendedLogPoint.key) ?? recommendedLogPoint],
      []
    );

    const decorationOptions = logPoints.reduce<DecorationOptions[]>((acc, logPoint) => {
      const hoverMessage = new MarkdownString(
        logPoint.enabled
          ? `$(bug) RxJS: [Remove Operator Log Point](${getMarkdownCommandWithArgs(Commands.DisableLogPoint, [
              this.document.uri,
              logPoint.position,
            ])} "Stop logging values emitted by this operator.")`
          : `$(bug)  RxJS: [Add Operator Log Point](${getMarkdownCommandWithArgs(Commands.EnableLogPoint, [
              this.document.uri,
              logPoint.position,
            ])} "Log values emitted by this operator.")`,
        true
      );
      hoverMessage.isTrusted = true;

      return [
        ...acc,
        logPoint.enabled
          ? {
              range: new Range(logPoint.position, logPoint.position.with(undefined, logPoint.position.character + 3)),
              hoverMessage,
              renderOptions: {
                before: {
                  contentIconPath: this.resourceProvider.uriForResource('debug-breakpoint-log.svg'),
                },
              },
            }
          : {
              range: new Range(logPoint.position, logPoint.position.with(undefined, logPoint.position.character + 3)),
              hoverMessage,
              renderOptions: {
                before: {
                  contentIconPath: this.resourceProvider.uriForResource('debug-breakpoint-log-unverified.svg'),
                },
              },
            },
      ];
    }, []);

    this.setDecorations(decorationOptions);
  }

  dispose(): void {
    super.dispose();
    this.onDidChangeLogPointsDisposable.dispose();
    this.onRecommendLogPointsDisposable.dispose();
  }
}

const RecommendedLogPointDecorationType = window.createTextEditorDecorationType({
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});
