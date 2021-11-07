import { inject, injectable } from 'inversify';
import type * as vscodeApiType from 'vscode';
import { VsCodeApi } from '../ioc/types';
import { ILogger } from '../logger';
import { IOperatorLogPointRecommender } from '../operatorLogPoint/recommender';
import { IDisposable } from '../util/types';

export const IWorkspaceMonitor = Symbol('WorkspaceMonitor');

export type IWorkspaceMonitor = IDisposable;

const DID_CHANGE_TEXT_DOCUMENT_DEBOUNCE_DELAY_MS = 500;

@injectable()
export default class WorkspaceMonitor implements IWorkspaceMonitor {
  private readonly disposables: IDisposable[] = [];

  constructor(
    @inject(VsCodeApi) readonly vscode: typeof vscodeApiType,
    @inject(IOperatorLogPointRecommender) private readonly operatorLogPointRecommender: IOperatorLogPointRecommender,
    @inject(ILogger) private readonly logger: ILogger
  ) {
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument(this.onDidOpenTextDocument),
      vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument)
    );

    for (const textEditor of vscode.window.visibleTextEditors) {
      this.onDidOpenTextDocument(textEditor.document);
    }
  }

  private onDidOpenTextDocument = (document: vscodeApiType.TextDocument): void => {
    if (document.uri.scheme !== 'file') {
      return;
    }

    this.logger.info('WorkspaceMonitor', `Opened ${document.fileName} (${document.languageId})`);

    this.operatorLogPointRecommender.recommend(document);
  };

  private onDidChangeTextDocument = debounced(({ document }: vscodeApiType.TextDocumentChangeEvent) => {
    if (document.uri.scheme !== 'file') {
      return;
    }

    this.logger.info('WorkspaceMonitor', `Changed ${document.fileName} (${document.languageId})`);

    this.operatorLogPointRecommender.recommend(document);
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
