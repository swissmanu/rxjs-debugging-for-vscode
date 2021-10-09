import { inject, injectable, interfaces } from 'inversify';
import type * as vscodeApiType from 'vscode';
import { IDisposable } from '../../shared/types';
import { RootContainer, VsCodeApi } from '../ioc/types';
import { ILogger } from '../logger';
import { IOperatorLogPointManager } from '../operatorLogPoint/logPointManager';
import { IOperatorLogPointRecommender } from '../operatorLogPoint/recommender';
import { IResourceProvider } from '../resources';
import { ISessionManager } from '../sessionManager';
import { isSupportedDocument } from '../workspaceMonitor/supportedDocument';
import { IDecorationProvider } from './';
import LiveLogDecorationProvider from './liveLogDecorationProvider';
import LogPointDecorationProvider from './logPointDecorationProvider';

export const IDecorationManager = Symbol('DecorationManager');

export type IDecorationManager = IDisposable;

@injectable()
export default class DecorationManager implements IDecorationManager {
  private readonly decorators: Map<string, ReadonlyArray<IDecorationProvider>> = new Map();
  private disposables: IDisposable[] = [];

  constructor(
    @inject(VsCodeApi) vscode: typeof vscodeApiType,
    @inject(ILogger) private readonly logger: ILogger,
    @inject(RootContainer) private readonly rootContainer: interfaces.Container
  ) {
    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument(this.onDidCloseTextDocument),
      vscode.window.onDidChangeVisibleTextEditors(this.onDidChangeVisibleTextEditors)
    );
    this.onDidChangeVisibleTextEditors(vscode.window.visibleTextEditors);
  }

  private onDidCloseTextDocument = (document: vscodeApiType.TextDocument): void => {
    if (!isSupportedDocument(document)) {
      return;
    }

    const uri = document.uri.toString();
    const decorators = this.decorators.get(uri);

    if (decorators) {
      this.logger.info('DecorationManager', `Remove decoration providers for ${uri}`);
      for (const decorator of decorators) {
        decorator.dispose();
      }
      this.decorators.delete(uri);
    }
  };

  private onDidChangeVisibleTextEditors = (editors: ReadonlyArray<vscodeApiType.TextEditor>): void => {
    for (const editor of editors) {
      const { document } = editor;
      if (!isSupportedDocument(document)) {
        continue;
      }

      const uri = document.uri.toString();
      if (!this.decorators.has(uri)) {
        this.logger.info('DecorationManager', `Create decoration providers for ${uri}`);
        const operatorLogPointManager = this.rootContainer.get<IOperatorLogPointManager>(IOperatorLogPointManager);

        this.decorators.set(uri, [
          new LogPointDecorationProvider(
            this.rootContainer.get(IOperatorLogPointRecommender),
            operatorLogPointManager,
            this.rootContainer.get(IResourceProvider),
            document
          ),
          new LiveLogDecorationProvider(this.rootContainer.get(ISessionManager), operatorLogPointManager, document),
        ]);
      }
    }

    const editorsForUri = editors.reduce<Record<string, ReadonlyArray<vscodeApiType.TextEditor>>>((acc, e) => {
      const documentUri = e.document.uri.toString();
      if (acc[documentUri]) {
        return {
          ...acc,
          [documentUri]: [...acc[documentUri], e],
        };
      }
      return { ...acc, [documentUri]: [e] };
    }, {});

    for (const uri of Object.keys(editorsForUri)) {
      for (const decorator of this.decorators.get(uri) ?? []) {
        decorator.attach(editorsForUri[uri]);
      }
    }
  };

  dispose(): void {
    const disposables = [
      ...this.disposables,
      ...[...this.decorators.values()].reduce((acc, ds) => [...acc, ...ds], []),
    ];
    this.decorators.clear();

    for (const disposable of disposables) {
      disposable.dispose();
    }
  }
}
