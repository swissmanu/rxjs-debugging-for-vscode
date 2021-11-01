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
import { Commands } from '../commands/commands';
import getMarkdownCommandWithArgs from '../commands/getMarkdownCommandWithArgs';
import { Configuration } from '../configuration';
import OperatorLogPoint from '../operatorLogPoint';
import { IOperatorLogPointManager } from '../operatorLogPoint/logPointManager';
import { IOperatorLogPointRecommendationEvent, IOperatorLogPointRecommender } from '../operatorLogPoint/recommender';
import { IResourceProvider } from '../resources';
import { difference } from '../util/map';
import { IDisposable } from '../util/types';
import { IDecorationSetter } from './decorationSetter';

const localize = nls.loadMessageBundle();

export default class LogPointDecorationProvider extends DocumentDecorationProvider {
  private recommendedLogPoints: Map<string, OperatorLogPoint> = new Map();
  private enabledLogPoints: Map<string, OperatorLogPoint> = new Map();

  private readonly onRecommendOperatorLogPointsDisposable: IDisposable;
  private readonly onDidChangeLogPointsDisposable: IDisposable;
  private readonly onDidChangeConfigurationDisposable: IDisposable;

  private showLogPointRecommendations: boolean;

  decorationType = RecommendedLogPointDecorationType;

  constructor(
    operatorLogPointRecommender: IOperatorLogPointRecommender,
    private readonly operatorLogPointManager: IOperatorLogPointManager,
    private readonly resourceProvider: IResourceProvider,
    decorationSetter: IDecorationSetter,
    textDocument: TextDocument
  ) {
    super(textDocument, decorationSetter);

    this.onRecommendOperatorLogPointsDisposable = operatorLogPointRecommender.onRecommendOperatorLogPoints(
      this.onRecommendOperatorLogPoints
    );
    this.onDidChangeLogPointsDisposable = operatorLogPointManager.onDidChangeLogPoints(this.onDidChangeLogPoints);
    this.onDidChangeConfigurationDisposable = workspace.onDidChangeConfiguration(this.onDidChangeConfiguration);

    this.showLogPointRecommendations = workspace
      .getConfiguration(Configuration.ShowLogPointRecommendations)
      .get(Configuration.ShowLogPointRecommendations, true);
  }

  private onRecommendOperatorLogPoints = ({
    documentUri,
    operatorLogPoints,
  }: IOperatorLogPointRecommendationEvent): void => {
    if (documentUri.toString() !== this.document.uri.toString()) {
      return;
    }

    this.recommendedLogPoints = new Map(
      operatorLogPoints.reduce<ReadonlyArray<[string, OperatorLogPoint]>>(
        (acc, l) => (l.operatorIdentifier.fileName === this.document.fileName ? [...acc, [l.key, l]] : acc),
        []
      )
    );
    this.updateDecorations();
  };

  private onDidChangeLogPoints = (operatorLogPoints: ReadonlyArray<OperatorLogPoint>): void => {
    this.enabledLogPoints = new Map(
      operatorLogPoints.reduce<ReadonlyArray<[string, OperatorLogPoint]>>(
        (acc, l) => (l.operatorIdentifier.fileName === this.document.fileName ? [...acc, [l.key, l]] : acc),
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
    this.onDidChangeLogPoints(this.operatorLogPointManager.logPoints);
  }

  updateDecorations(): void {
    const recommendedLogPoints = this.showLogPointRecommendations
      ? difference(this.recommendedLogPoints, this.enabledLogPoints)
      : new Map<string, OperatorLogPoint>();

    const logPoints = [...this.enabledLogPoints.values(), ...recommendedLogPoints.values()];

    const decorationOptions = logPoints.reduce<DecorationOptions[]>((acc, logPoint) => {
      const hoverMessage = new MarkdownString(
        logPoint.enabled
          ? `$(bug) RxJS: [${localize(
              'rxjs-debugging.logPointDecoration.removeOperatorLogPoint.title',
              'Remove Operator Log Point'
            )}](${getMarkdownCommandWithArgs(Commands.DisableOperatorLogPoint, [
              this.document.uri,
              logPoint.sourcePosition,
              logPoint.operatorIdentifier,
            ])} "${localize(
              'rxjs-debugging.logPointDecoration.removeOperatorLogPoint.description',
              'Stop logging events emitted by this operator.'
            )}")`
          : `$(bug)  RxJS: [${localize(
              'rxjs-debugging.logPointDecoration.addOperatorLogPoint.title',
              'Add Operator Log Point'
            )}](${getMarkdownCommandWithArgs(Commands.EnableOperatorLogPoint, [
              this.document.uri,
              logPoint.sourcePosition,
              logPoint.operatorIdentifier,
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
              range: new Range(
                logPoint.sourcePosition,
                logPoint.sourcePosition.with(undefined, logPoint.sourcePosition.character + 3)
              ),
              hoverMessage,
              renderOptions: {
                before: {
                  contentIconPath: this.resourceProvider.uriForResource('debug-breakpoint-log.svg'),
                },
              },
            }
          : {
              range: new Range(
                logPoint.sourcePosition,
                logPoint.sourcePosition.with(undefined, logPoint.sourcePosition.character + 3)
              ),
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
    this.onRecommendOperatorLogPointsDisposable.dispose();
    this.onDidChangeConfigurationDisposable.dispose();
  }
}

const RecommendedLogPointDecorationType = window.createTextEditorDecorationType({
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});
