import { inject, injectable } from 'inversify';
import type * as vscodeApiType from 'vscode';
import { IDisposable } from '../../shared/types';
import { Configuration } from '../configuration';
import { VsCodeApi } from '../ioc/types';
import { ILogger } from '../logger';
import { ILogPointRecommender } from '../logPoint/logPointRecommender';

export const IWorkspaceMonitor = Symbol('WorkspaceMonitor');

export type IWorkspaceMonitor = IDisposable;

const DID_CHANGE_TEXT_DOCUMENT_DEBOUNCE_DELAY_MS = 500;

@injectable()
export default class WorkspaceMonitor implements IWorkspaceMonitor {
  private readonly disposables: IDisposable[] = [];
  private showLogPointRecommendations: boolean;

  constructor(
    @inject(VsCodeApi) private readonly vscode: typeof vscodeApiType,
    @inject(ILogPointRecommender) private readonly logPointRecommender: ILogPointRecommender,
    @inject(ILogger) private readonly logger: ILogger
  ) {
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument(this.onDidOpenTextDocument),
      vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument),
      vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration)
    );

    this.showLogPointRecommendations = vscode.workspace
      .getConfiguration(Configuration.ShowLogPointRecommendations)
      .get(Configuration.ShowLogPointRecommendations, true);

    for (const textEditor of vscode.window.visibleTextEditors) {
      this.onDidOpenTextDocument(textEditor.document);
    }
  }

  private onDidOpenTextDocument = (document: vscodeApiType.TextDocument): void => {
    if (document.uri.scheme !== 'file') {
      return;
    }

    this.logger.info('WorkspaceMonitor', `Opened ${document.fileName} (${document.languageId})`);

    // Safe some CPU and start the recommender only when really required:
    if (this.showLogPointRecommendations) {
      this.logPointRecommender.recommend(document);
    }
  };

  private onDidChangeTextDocument = debounced(({ document }: vscodeApiType.TextDocumentChangeEvent) => {
    if (document.uri.scheme !== 'file') {
      return;
    }

    this.logger.info('WorkspaceMonitor', `Changed ${document.fileName} (${document.languageId})`);

    // Safe some CPU and start the recommender only when really required:
    if (this.showLogPointRecommendations) {
      this.logPointRecommender.recommend(document);
    }
  }, DID_CHANGE_TEXT_DOCUMENT_DEBOUNCE_DELAY_MS);

  private onDidChangeConfiguration = ({ affectsConfiguration }: vscodeApiType.ConfigurationChangeEvent) => {
    if (affectsConfiguration(Configuration.ShowLogPointRecommendations)) {
      this.showLogPointRecommendations = this.vscode.workspace
        .getConfiguration(Configuration.ShowLogPointRecommendations)
        .get(Configuration.ShowLogPointRecommendations, true);
    }
  };

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}

function debounced<A>(fn: (a: A) => void, delayMs: number): (a: A) => void {
  let timeout: NodeJS.Timeout | undefined;

  return (a) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      timeout = undefined;
      fn(a);
    }, delayMs);
  };
}
