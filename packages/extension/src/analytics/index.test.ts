/* eslint-disable @typescript-eslint/no-non-null-assertion */
import 'reflect-metadata';
import { Configuration } from '../configuration';
import { IConfigurationAccessor } from '../configuration/configurationAccessor';
import Logger from '../logger';
import { IEnvironmentInfo } from '../util/environmentInfo';
import PosthogAnalyticsReporter, { IAnalyticsReporter } from './index';
import { IPosthogConfiguration } from './posthogConfiguration';
import { getPosthogMockInstance, resetPosthogMock } from './__mocks__/posthog-node';

describe('Analytics', () => {
  describe('PosthogAnalyticsReporter', () => {
    let configurationAccessor: IConfigurationAccessor;
    const posthogConfiguration: IPosthogConfiguration = {
      host: 'https://posthog',
      projectApiKey: 'foobar',
    };
    const environmentInfo: IEnvironmentInfo = {
      extensionVersion: '1.0.0',
      language: 'de-CH',
      machineId: 'machine',
      version: '1.62.0',
    };

    beforeEach(() => {
      configurationAccessor = {
        get: jest.fn(),
        hasGlobal: jest.fn(),
        update: jest.fn(),
        onDidChangeConfiguration: jest.fn(),
      };
    });

    afterEach(() => {
      resetPosthogMock();
    });

    describe('having analytics disabled,', () => {
      beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configurationAccessor.get = jest.fn(() => false as any);
        new PosthogAnalyticsReporter(posthogConfiguration, environmentInfo, configurationAccessor, Logger.nullLogger());
      });

      test('does not create a Posthog reporter on creation', () => {
        expect(configurationAccessor.get).toBeCalledWith(Configuration.EnableAnalytics, false);
        expect(getPosthogMockInstance()).toBeNull();
      });
    });

    describe('having analytics enabled,', () => {
      let posthog: IAnalyticsReporter;

      beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configurationAccessor.get = jest.fn(() => true as any);
        posthog = new PosthogAnalyticsReporter(
          posthogConfiguration,
          environmentInfo,
          configurationAccessor,
          Logger.nullLogger()
        );
      });

      test('creates a Posthog reporter using provided PosthogConfiguration on creation', () => {
        expect(configurationAccessor.get).toBeCalledWith(Configuration.EnableAnalytics, false);

        const createdInstance = getPosthogMockInstance();
        expect(createdInstance).not.toBeNull();
        expect(createdInstance!.projectApiKey).toEqual(posthogConfiguration.projectApiKey);
        expect(createdInstance!.options).toEqual({ host: posthogConfiguration.host });
      });

      test('calls Posthog.identify() on creation', () => {
        expect(getPosthogMockInstance()!.identify).toBeCalledWith({
          distinctId: environmentInfo.machineId,
          properties: {
            vscodeVersion: environmentInfo.version,
            vscodeLanguage: environmentInfo.language,
            extensionVersion: environmentInfo.extensionVersion,
          },
        });
      });

      describe('captures "operator log point enabled" events', () => {
        test('for built-in operators', () => {
          posthog.captureOperatorLogPointEnabled({ operatorName: 'map' });
          expect(getPosthogMockInstance()!.capture).toBeCalledWith({
            distinctId: environmentInfo.machineId,
            event: 'operator log point enabled',
            properties: { operatorName: 'map' },
          });
        });

        test('for custom operators without the operator name', () => {
          posthog.captureOperatorLogPointEnabled({ operatorName: 'customOperator' });
          expect(getPosthogMockInstance()!.capture).toBeCalledWith({
            distinctId: environmentInfo.machineId,
            event: 'operator log point enabled',
            properties: {},
          });
        });
      });

      describe('captures "operator log point disabled" events', () => {
        test('for built-in operators', () => {
          posthog.captureOperatorLogPointDisabled({ operatorName: 'map' });
          expect(getPosthogMockInstance()!.capture).toBeCalledWith({
            distinctId: environmentInfo.machineId,
            event: 'operator log point disabled',
            properties: { operatorName: 'map' },
          });
        });

        test('for custom operators without the operator name', () => {
          posthog.captureOperatorLogPointDisabled({ operatorName: 'customOperator' });
          expect(getPosthogMockInstance()!.capture).toBeCalledWith({
            distinctId: environmentInfo.machineId,
            event: 'operator log point disabled',
            properties: {},
          });
        });
      });

      test('captures "debug sessions started" events', () => {
        posthog.captureDebugSessionStarted({ runtime: 'nodejs' });
        expect(getPosthogMockInstance()!.capture).toBeCalledWith({
          distinctId: environmentInfo.machineId,
          event: 'debug session started',
          properties: { runtime: 'nodejs' },
        });
      });

      test('captures "debug sessions stopped" events', () => {
        posthog.captureDebugSessionStopped({});
        expect(getPosthogMockInstance()!.capture).toBeCalledWith({
          distinctId: environmentInfo.machineId,
          event: 'debug session stopped',
          properties: {},
        });
      });
    });
  });
});
