import { inject, injectable } from 'inversify';
import type * as vscodeApiType from 'vscode';
import { IDisposable } from '../shared/types';
import { VsCodeApi } from './ioc/types';
import { ILogPointRecommender } from './logPoint/logPointRecommender';

export const IWorkspaceMonitor = Symbol('WorkspaceMonitor');

export type IWorkspaceMonitor = IDisposable;

const DID_CHANGE_TEXT_DOCUMENT_DEBOUNCE_DELAY_MS = 500;

@injectable()
export default class WorkspaceMonitor implements IWorkspaceMonitor {
  private readonly disposables: IDisposable[] = [];

  constructor(
    @inject(VsCodeApi) vscode: typeof vscodeApiType,
    @inject(ILogPointRecommender) private readonly logPointRecommender: ILogPointRecommender
  ) {
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument(this.onDidOpenTextDocument),
      vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument)
    );
  }

  private onDidOpenTextDocument = (document: vscodeApiType.TextDocument): void => {
    this.logPointRecommender.recommend(document);
  };

  private onDidChangeTextDocument = debounced(({ document }: vscodeApiType.TextDocumentChangeEvent) => {
    this.logPointRecommender.recommend(document);
  }, DID_CHANGE_TEXT_DOCUMENT_DEBOUNCE_DELAY_MS);

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
