import {
  ConfigurationChangeEvent,
  DecorationOptions,
  DecorationRangeBehavior,
  OverviewRulerLane,
  Range,
  TextDocument,
  TextEditor,
  window,
  workspace,
} from 'vscode';
import { DocumentDecorationProvider } from '..';
import { Configuration } from '../../configuration';
import OperatorLogPoint from '../../operatorLogPoint';
import { IOperatorLogPointManager } from '../../operatorLogPoint/logPointManager';
import { IOperatorLogPointRecommendationEvent, IOperatorLogPointRecommender } from '../../operatorLogPoint/recommender';
import { IResourceProvider } from '../../resources';
import { difference } from '../../util/map';
import { IDisposable } from '../../util/types';
import { IDecorationSetter } from '../decorationSetter';
import getEnabledState from './getEnabledState';
import getIconForEnabledState from './getIconForEnabledState';

type OperatorLogPointKey = string;
type OperatorLogPointMap = Map<OperatorLogPointKey, OperatorLogPoint>;

export default class OperatorLogPointGutterIconDecorationProvider extends DocumentDecorationProvider {
  private recommendedLogPoints: OperatorLogPointMap = new Map();
  private enabledLogPoints: OperatorLogPointMap = new Map();

  private readonly onRecommendOperatorLogPointsDisposable: IDisposable;
  private readonly onDidChangeLogPointsDisposable: IDisposable;
  private readonly onDidChangeConfigurationDisposable: IDisposable;

  private showLogPointRecommendations: boolean;

  decorationType = OperatorLogPointGutterIconDecorationType;

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
      .getConfiguration(Configuration.RecommendOperatorLogPointsWithAnIcon)
      .get(Configuration.RecommendOperatorLogPointsWithAnIcon, true);

    workspace.onDidChangeTextDocument(() => this.updateDecorations());
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

  private onDidChangeConfiguration = ({ affectsConfiguration }: ConfigurationChangeEvent) => {
    if (affectsConfiguration(Configuration.RecommendOperatorLogPointsWithAnIcon)) {
      this.showLogPointRecommendations = workspace
        .getConfiguration(Configuration.RecommendOperatorLogPointsWithAnIcon)
        .get(Configuration.RecommendOperatorLogPointsWithAnIcon, true);
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
      : new Map<OperatorLogPointKey, OperatorLogPoint>();

    const hasOperatorLogPoints = this.enabledLogPoints.size > 0 || recommendedLogPoints.size > 0;
    if (!hasOperatorLogPoints) {
      this.setDecorations([]);
      return;
    }

    const operatorLogPointsPerLine = collectLogPointsPerLine(this.enabledLogPoints, recommendedLogPoints);
    const decorationOptions: DecorationOptions[] = [];

    // Iterate through all lines of the document. If theres is at least one OperatorLogPoint for a line, add the
    // regarding decoration. Add an empty placeholder decoration otherwise.
    for (let line = 0, l = this.document.lineCount; line < l; line++) {
      const logPointsOnThisLine = operatorLogPointsPerLine.get(line);
      const range = new Range(line, 0, line, 0);

      if (logPointsOnThisLine) {
        const enabledState = getEnabledState(logPointsOnThisLine);
        const contentIconPath = getIconForEnabledState(this.resourceProvider, enabledState);

        decorationOptions.push({
          range,
          renderOptions: {
            before: { contentIconPath },
          },
        });
      } else {
        decorationOptions.push({ range, renderOptions: { before: { contentText: ' ' } } });
      }
    }

    this.setDecorations(decorationOptions);
  }

  dispose(): void {
    super.dispose();
    this.onDidChangeLogPointsDisposable.dispose();
    this.onRecommendOperatorLogPointsDisposable.dispose();
    this.onDidChangeConfigurationDisposable.dispose();
  }

  static get decorationTypeKey(): string {
    return OperatorLogPointGutterIconDecorationType.key;
  }
}

const OperatorLogPointGutterIconDecorationType = window.createTextEditorDecorationType({
  before: {
    width: '20px',
  },
  overviewRulerLane: OverviewRulerLane.Left,
  rangeBehavior: DecorationRangeBehavior.ClosedClosed,
});

type LineNumber = number;
function collectLogPointsPerLine(...maps: OperatorLogPointMap[]): Map<LineNumber, ReadonlyArray<OperatorLogPoint>> {
  const perLine: Map<number, ReadonlyArray<OperatorLogPoint>> = new Map();

  maps.forEach((map) => {
    for (const logPoint of map.values()) {
      const { line } = logPoint.sourcePosition;
      const ls = perLine.get(line) ?? [];
      perLine.set(line, [...ls, logPoint]);
    }
  });

  return perLine;
}
