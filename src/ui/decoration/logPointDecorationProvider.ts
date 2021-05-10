import {
  ConfigurationChangeEvent,
  DecorationOptions,
  DecorationRangeBehavior,
  MarkdownString,
  Range,
  TextDocument,
  TextEditor,
  window,
  workspace,
} from 'vscode';
import * as nls from 'vscode-nls';
import { DocumentDecorationProvider } from '.';
import { difference } from '../../shared/map';
import { IDisposable } from '../../shared/types';
import { Commands, getMarkdownCommandWithArgs } from '../commands';
import { Configuration } from '../configuration';
import { LogPoint } from '../logPoint';
import { ILogPointManager } from '../logPoint/logPointManager';
import { ILogPointRecommendationEvent, ILogPointRecommender } from '../logPoint/logPointRecommender';
import { IResourceProvider } from '../resources';

const localize = nls.loadMessageBundle();

export default class LogPointDecorationProvider extends DocumentDecorationProvider {
  private recommendedLogPoints: Map<string, LogPoint> = new Map();
  private enabledLogPoints: Map<string, LogPoint> = new Map();

  private readonly onRecommendLogPointsDisposable: IDisposable;
  private readonly onDidChangeLogPointsDisposable: IDisposable;
  private readonly onDidChangeConfigurationDisposable: IDisposable;

  private showLogPointRecommendations: boolean;

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
    this.onDidChangeConfigurationDisposable = workspace.onDidChangeConfiguration(this.onDidChangeConfiguration);

    this.showLogPointRecommendations = workspace
      .getConfiguration(Configuration.ShowLogPointRecommendations)
      .get(Configuration.ShowLogPointRecommendations, true);
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

  private onDidChangeConfiguration = ({ affectsConfiguration }: ConfigurationChangeEvent) => {
    if (affectsConfiguration(Configuration.ShowLogPointRecommendations)) {
      this.showLogPointRecommendations = workspace
        .getConfiguration(Configuration.ShowLogPointRecommendations)
        .get(Configuration.ShowLogPointRecommendations, true);
      this.updateDecorations();
    }
  };

  attach(textEditors: ReadonlyArray<TextEditor>): void {
    super.attach(textEditors);
    this.onDidChangeLogPoints(this.logPointManager.logPoints);
  }

  updateDecorations(): void {
    const recommendedLogPoints = this.showLogPointRecommendations
      ? difference(this.recommendedLogPoints, this.enabledLogPoints)
      : new Map<string, LogPoint>();

    const logPoints = [...this.enabledLogPoints.values(), ...recommendedLogPoints.values()];

    const decorationOptions = logPoints.reduce<DecorationOptions[]>((acc, logPoint) => {
      const hoverMessage = new MarkdownString(
        logPoint.enabled
          ? `$(bug) RxJS: [${localize(
              'rxjs-debugging.logPointDecoration.removeOperatorLogPoint.title',
              'Remove Operator Log Point'
            )}](${getMarkdownCommandWithArgs(Commands.DisableLogPoint, [
              this.document.uri,
              logPoint.position,
            ])} "${localize(
              'rxjs-debugging.logPointDecoration.removeOperatorLogPoint.description',
              'Stop logging events emitted by this operator.'
            )}")`
          : `$(bug)  RxJS: [${localize(
              'rxjs-debugging.logPointDecoration.addOperatorLogPoint.title',
              'Add Operator Log Point'
            )}](${getMarkdownCommandWithArgs(Commands.EnableLogPoint, [
              this.document.uri,
              logPoint.position,
            ])} "${localize(
              'rxjs-debugging.logPointDecoration.addOperatorLogPoint.description',
              'Log events emitted by this operator.'
            )}")`,
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
    this.onDidChangeConfigurationDisposable.dispose();
  }
}

const RecommendedLogPointDecorationType = window.createTextEditorDecorationType({
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});
