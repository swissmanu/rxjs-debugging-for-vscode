import { inject, injectable } from 'inversify';
import type * as vscodeApiType from 'vscode';
import { IDisposable } from '../shared/types';
import { Configuration } from './configuration';
import { VsCodeApi } from './ioc/types';
import { ILogPointRecommender } from './logPoint/logPointRecommender';

export const IWorkspaceMonitor = Symbol('WorkspaceMonitor');

export type IWorkspaceMonitor = IDisposable;

const DID_CHANGE_TEXT_DOCUMENT_DEBOUNCE_DELAY_MS = 500;

@injectable()
export default class WorkspaceMonitor implements IWorkspaceMonitor {
  private readonly disposables: IDisposable[] = [];
  private showLogPointRecommendations: boolean;

  constructor(
    @inject(VsCodeApi) private readonly vscode: typeof vscodeApiType,
    @inject(ILogPointRecommender) private readonly logPointRecommender: ILogPointRecommender
  ) {
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument(this.onDidOpenTextDocument),
      vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument),
      vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration)
    );

    this.showLogPointRecommendations = vscode.workspace
      .getConfiguration(Configuration.ShowLogPointRecommendations)
      .get(Configuration.ShowLogPointRecommendations, true);
  }

  private onDidOpenTextDocument = (document: vscodeApiType.TextDocument): void => {
    // Safe some CPU and start the recommender only when really required:
    if (this.showLogPointRecommendations) {
      this.logPointRecommender.recommend(document);
    }
  };

  private onDidChangeTextDocument = debounced(({ document }: vscodeApiType.TextDocumentChangeEvent) => {
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
