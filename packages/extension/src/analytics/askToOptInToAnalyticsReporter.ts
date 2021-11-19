import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { Configuration } from '../configuration';
import { IConfigurationAccessor } from '../configuration/configurationAccessor';

const localize = nls.loadMessageBundle();
const analyticsDocumentation: vscode.Uri = vscode.Uri.parse(
  'https://github.com/swissmanu/rxjs-debugging-for-vscode/blob/main/ANALYTICS.md'
);

export default async function askToOptInToAnalyticsReporter(
  configurationAccessor: IConfigurationAccessor
): Promise<void> {
  if (configurationAccessor.hasGlobal(Configuration.EnableAnalytics)) {
    return;
  }

  const text = localize(
    'rxjs-debugging.askToOptInToAnalyticsReporter.text',
    'To improve RxJS Debugging, the extension would like to collect anonymous usage analytics data.\nClick on "Learn More" for a full disclosure on what data would be collected and why.\nClose this notification to disable analytics data collection.'
  );
  const learnMore = localize('rxjs-debugging.askToOptInToAnalyticsReporter.action.learnMore', 'Learn More');
  const enable = localize('rxjs-debugging.askToOptInToAnalyticsReporter.action.enable', 'Enable Anonymous Analytics');
  const result = await vscode.window.showInformationMessage(text, learnMore, enable);

  if (result === enable) {
    configurationAccessor.update(Configuration.EnableAnalytics, true, true);
  } else if (result === learnMore) {
    vscode.env.openExternal(analyticsDocumentation);
    askToOptInToAnalyticsReporter(configurationAccessor);
  } else {
    configurationAccessor.update(Configuration.EnableAnalytics, false, true);
  }
}
