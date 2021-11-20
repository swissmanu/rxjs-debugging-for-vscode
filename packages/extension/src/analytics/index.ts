import { inject, injectable } from 'inversify';
import Posthog from 'posthog-node';
import type * as vscode from 'vscode';
import { Configuration } from '../configuration';
import { ILogger } from '../logger';
import { IConfigurationAccessor } from '../configuration/configurationAccessor';
import { IEnvironmentInfo } from '../util/environmentInfo';
import { IDisposable } from '../util/types';
import { AnalyticsEventDataPoints, AnalyticsEvents } from './events';
import isBuiltInOperatorName from './isBuiltInOperatorName';
import { IPosthogConfiguration } from './posthogConfiguration';

export const IAnalyticsReporter = Symbol('AnalyticsReporter');

type EventToMethodMapping = {
  'debug session started': 'debugSessionStarted';
  'debug session stopped': 'debugSessionStopped';
  'operator log point enabled': 'operatorLogPointEnabled';
  'operator log point disabled': 'operatorLogPointDisabled';
};

type CaptureEventMethods = {
  [Property in keyof AnalyticsEventDataPoints as `capture${Capitalize<EventToMethodMapping[Property]>}`]: (
    dataPoints: AnalyticsEventDataPoints[Property]
  ) => void;
};

export interface IAnalyticsReporter extends IDisposable, CaptureEventMethods {}

/**
 * @see https://github.com/swissmanu/rxjs-debugging-for-vscode/blob/main/ANALYTICS.md
 */
@injectable()
export default class PosthogAnalyticsReporter implements IAnalyticsReporter {
  private postHog: Posthog | null = null;
  private readonly onDidChangeTelemetryEnabledDisposable: IDisposable;

  constructor(
    @inject(IPosthogConfiguration) private readonly posthogConfiguration: IPosthogConfiguration,
    @inject(IEnvironmentInfo) private readonly environmentInfo: IEnvironmentInfo,
    @inject(IConfigurationAccessor) private readonly configurationAccessor: IConfigurationAccessor,
    @inject(ILogger) private readonly logger: ILogger
  ) {
    if (configurationAccessor.get(Configuration.EnableAnalytics, false)) {
      this.start();
    }

    this.onDidChangeTelemetryEnabledDisposable = configurationAccessor.onDidChangeConfiguration(
      this.onDidChangeConfiguration,
      this
    );
  }

  private start(): void {
    if (!this.postHog) {
      this.logger.info('AnalyticsReporter', 'Starting Reporter');
      this.postHog = new Posthog(this.posthogConfiguration.projectApiKey, { host: this.posthogConfiguration.host });
      this.postHog.identify({
        distinctId: this.distinctId,
        properties: {
          vscodeVersion: this.environmentInfo.version,
          vscodeLanguage: this.environmentInfo.language,
          extensionVersion: this.environmentInfo.extensionVersion,
        },
      });
    }
  }

  private stop() {
    if (this.postHog) {
      this.logger.info('Analytics', 'Stopping Reporter');
      this.postHog.shutdown();
      this.postHog = null;
    }
  }

  private capture<E extends AnalyticsEvents>(event: E, dataPoints: AnalyticsEventDataPoints[E]): void {
    if (this.postHog) {
      this.logger.info('Analytics', `Capture "${event}" with data points: ${JSON.stringify(dataPoints)}`);
      this.postHog.capture({
        distinctId: this.distinctId,
        event,
        properties: dataPoints,
      });
    }
  }

  private onDidChangeConfiguration({ affectsConfiguration }: vscode.ConfigurationChangeEvent): void {
    if (affectsConfiguration(Configuration.EnableAnalytics)) {
      const enabled: boolean = this.configurationAccessor.get(Configuration.EnableAnalytics, false);

      if (enabled) {
        this.start();
      } else {
        this.stop();
      }
    }
  }

  private get distinctId(): string {
    return this.environmentInfo.machineId;
  }

  captureOperatorLogPointEnabled({ operatorName }: AnalyticsEventDataPoints['operator log point enabled']): void {
    const dataPoints = operatorName ? (isBuiltInOperatorName(operatorName) ? { operatorName } : {}) : {};
    this.capture('operator log point enabled', dataPoints);
  }

  captureOperatorLogPointDisabled({ operatorName }: AnalyticsEventDataPoints['operator log point disabled']): void {
    const dataPoints = operatorName ? (isBuiltInOperatorName(operatorName) ? { operatorName } : {}) : {};
    this.capture('operator log point disabled', dataPoints);
  }

  captureDebugSessionStarted(dataPoints: AnalyticsEventDataPoints['debug session started']): void {
    this.capture('debug session started', dataPoints);
  }

  captureDebugSessionStopped(): void {
    this.capture('debug session stopped', {});
  }

  dispose(): void {
    this.onDidChangeTelemetryEnabledDisposable.dispose();
    this.stop();
  }
}
