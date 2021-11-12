import {
  DecorationOptions,
  DecorationRangeBehavior,
  Position,
  Range,
  TextDocument,
  TextEditor,
  window,
  workspace,
} from 'vscode';
import { DocumentDecorationProvider } from '..';
import OperatorLogPoint from '../../operatorLogPoint';
import { IOperatorLogPointManager } from '../../operatorLogPoint/manager';
import { IOperatorLogPointRecommendationEvent, IOperatorLogPointRecommender } from '../../operatorLogPoint/recommender';
import difference from '../../util/map/difference';
import { IDisposable } from '../../util/types';
import { IDecorationSetter } from '../decorationSetter';
import createHoverMessageForLogPoints from './createHoverMessageForLogPoint';

type OperatorLogPointKey = string;
type OperatorLogPointMap = Map<OperatorLogPointKey, OperatorLogPoint>;

export default class OperatorLogPointDecorationProvider extends DocumentDecorationProvider {
  private recommendedLogPoints: OperatorLogPointMap = new Map();
  private enabledLogPoints: OperatorLogPointMap = new Map();

  private readonly onRecommendOperatorLogPointsDisposable: IDisposable;
  private readonly onDidChangeLogPointsDisposable: IDisposable;
  private readonly onDidChangeTextDocumentDisposable: IDisposable;

  decorationType = OperatorLogPointDecorationType;

  constructor(
    operatorLogPointRecommender: IOperatorLogPointRecommender,
    private readonly operatorLogPointManager: IOperatorLogPointManager,
    decorationSetter: IDecorationSetter,
    textDocument: TextDocument
  ) {
    super(textDocument, decorationSetter);

    this.onRecommendOperatorLogPointsDisposable = operatorLogPointRecommender.onRecommendOperatorLogPoints(
      this.onRecommendOperatorLogPoints
    );
    this.onDidChangeLogPointsDisposable = operatorLogPointManager.onDidChangeLogPoints(this.onDidChangeLogPoints);

    this.onDidChangeTextDocumentDisposable = workspace.onDidChangeTextDocument(() => this.updateDecorations());
  }

  private onRecommendOperatorLogPoints = ({
    documentUri,
    operatorLogPoints,
  }: IOperatorLogPointRecommendationEvent): void => {
    if (documentUri.toString() !== this.document.uri.toString()) {
      return;
    }

    this.recommendedLogPoints = new Map(
      operatorLogPoints.reduce<ReadonlyArray<[OperatorLogPointKey, OperatorLogPoint]>>(
        (acc, l) => (l.operatorIdentifier.fileName === this.document.fileName ? [...acc, [l.key, l]] : acc),
        []
      )
    );
    this.updateDecorations();
  };

  private onDidChangeLogPoints = (operatorLogPoints: ReadonlyArray<OperatorLogPoint>): void => {
    this.enabledLogPoints = new Map(
      operatorLogPoints.reduce<ReadonlyArray<[OperatorLogPointKey, OperatorLogPoint]>>(
        (acc, l) => (l.operatorIdentifier.fileName === this.document.fileName ? [...acc, [l.key, l]] : acc),
        []
      )
    );
    this.updateDecorations();
  };

  attach(textEditors: ReadonlyArray<TextEditor>): void {
    super.attach(textEditors);
    this.onDidChangeLogPoints(this.operatorLogPointManager.logPoints);
  }

  updateDecorations(): void {
    const recommendedLogPoints = difference(this.recommendedLogPoints, this.enabledLogPoints);

    const hasOperatorLogPoints = this.enabledLogPoints.size > 0 || recommendedLogPoints.size > 0;
    if (!hasOperatorLogPoints) {
      this.setDecorations([]);
      return;
    }

    const decorationOptions: DecorationOptions[] = [];

    for (const logPoint of [...this.enabledLogPoints.values(), ...recommendedLogPoints.values()]) {
      const hoverMessage = createHoverMessageForLogPoints(logPoint);
      decorationOptions.push({
        hoverMessage,
        range: new Range(
          logPoint.sourcePosition,
          new Position(
            logPoint.sourcePosition.line,
            logPoint.sourcePosition.character + (logPoint.operatorName?.length ?? 3)
          )
        ),
      });
    }

    this.setDecorations(decorationOptions);
  }

  dispose(): void {
    super.dispose();
    this.onDidChangeLogPointsDisposable.dispose();
    this.onRecommendOperatorLogPointsDisposable.dispose();
    this.onDidChangeTextDocumentDisposable.dispose();
  }

  static get decorationTypeKey(): string {
    return OperatorLogPointDecorationType.key;
  }
}

const OperatorLogPointDecorationType = window.createTextEditorDecorationType({
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  textDecoration: 'underline',
});
