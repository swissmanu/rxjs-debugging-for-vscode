import { IOperatorIdentifier } from '@rxjs-debugging/telemetry/out/operatorIdentifier';
import operatorIdentifierToString from '@rxjs-debugging/telemetry/out/operatorIdentifier/toString';
import { inject, injectable } from 'inversify';
import { Event, EventEmitter, Selection } from 'vscode';
import OperatorLogPoint from '..';
import { IAnalyticsReporter } from '../../analytics';
import { ILogger } from '../../logger';
import { IDisposable } from '../../util/types';
import { IOperatorLogPointRecommender } from '../recommender';
import OperatorLogPointMerger from './merger';

export const IOperatorLogPointManager = Symbol('OperatorLogPointManager');

export interface IOperatorLogPointManager extends IDisposable {
  enable(operatorLogPoint: OperatorLogPoint): void;
  disable(operatorLogPoint: OperatorLogPoint): void;
  logPoints: ReadonlyArray<OperatorLogPoint>;
  logPointForIdentifier(operatorIdentifier: IOperatorIdentifier): OperatorLogPoint | undefined;
  logPointsForSelection(selection: Selection): ReadonlyArray<OperatorLogPoint>;
  onDidChangeLogPoints: Event<ReadonlyArray<OperatorLogPoint>>;
}

/**
 * Manages enabled `OperatorLogPoint`s.
 */
@injectable()
export default class OperatorLogPointManager implements IOperatorLogPointManager {
  /**
   * A map with `OperatorLogPoint`s. The key is equivalent with the operator log points `key` property.
   */
  private _logPoints: Map<string, OperatorLogPoint> = new Map();

  private _onDidChangeLogPoints = new EventEmitter<ReadonlyArray<OperatorLogPoint>>();
  get onDidChangeLogPoints(): Event<ReadonlyArray<OperatorLogPoint>> {
    return this._onDidChangeLogPoints.event;
  }

  private readonly onRecommendOperatorLogPointsDisposable: IDisposable;

  constructor(
    @inject(IOperatorLogPointRecommender) recommender: IOperatorLogPointRecommender,
    @inject(IAnalyticsReporter) private readonly analyticsReporter: IAnalyticsReporter,
    @inject(ILogger) private readonly logger: ILogger
  ) {
    const merger = new OperatorLogPointMerger();

    this.onRecommendOperatorLogPointsDisposable = recommender.onRecommendOperatorLogPoints(
      ({ operatorLogPoints: newlyRecommended }) => {
        this.logger.info('LogPointManager', 'Update log points with latest recommendations');
        this._logPoints = new Map(merger.merge(this.logPoints, newlyRecommended).map((l) => [l.key, l]));
        this._onDidChangeLogPoints.fire(this.logPoints);
      }
    );
  }

  enable(operatorLogPoint: OperatorLogPoint): void {
    const enabledOperatorLogPoint = operatorLogPoint.with({ enabled: true });
    const { key } = enabledOperatorLogPoint;

    if (!this._logPoints.has(key)) {
      this.logger.info('LogPointManager', `Enable log point at ${enabledOperatorLogPoint}`);
      this._logPoints.set(key, enabledOperatorLogPoint);
      this._onDidChangeLogPoints.fire(this.logPoints);

      this.analyticsReporter.captureOperatorLogPointEnabled({
        operatorName: operatorLogPoint.operatorName ?? undefined,
      });
    }
  }

  disable(operatorLogPoint: OperatorLogPoint): void {
    const disabledOperatorLogPoint = operatorLogPoint.with({ enabled: false });
    const { key } = disabledOperatorLogPoint;

    if (this._logPoints.has(key)) {
      this.logger.info('LogPointManager', `Disable log point at ${disabledOperatorLogPoint}`);
      this._logPoints.delete(key);
      this._onDidChangeLogPoints.fire(this.logPoints);

      this.analyticsReporter.captureOperatorLogPointDisabled({
        operatorName: operatorLogPoint.operatorName ?? undefined,
      });
    }
  }

  get logPoints(): ReadonlyArray<OperatorLogPoint> {
    return [...this._logPoints.values()];
  }

  logPointForIdentifier(operatorIdentifier: IOperatorIdentifier): OperatorLogPoint | undefined {
    return this._logPoints.get(operatorIdentifierToString(operatorIdentifier));
  }

  logPointsForSelection(selection: Selection): ReadonlyArray<OperatorLogPoint> {
    const logPoints: OperatorLogPoint[] = [];

    for (const [, logPoint] of this._logPoints) {
      if (selection.contains(logPoint.sourcePosition)) {
        logPoints.push(logPoint);
      }
    }

    return logPoints;
  }

  dispose(): void {
    this._onDidChangeLogPoints.dispose();
    this.onRecommendOperatorLogPointsDisposable.dispose();
  }
}
