import { inject, injectable, interfaces } from 'inversify';
import type * as vscodeApiType from 'vscode';
import { IDisposable } from '../../shared/types';
import { RootContainer, VsCodeApi } from '../ioc/types';
import { ILogger } from '../logger';
import { ILogPointManager } from '../logPoint/logPointManager';
import { ILogPointRecommender } from '../logPoint/logPointRecommender';
import { IResourceProvider } from '../resources';
import { ISessionManager } from '../sessionManager';
import { IDecorationProvider } from './';
import LiveLogDecorationProvider from './liveLogDecorationProvider';
import LogPointDecorationProvider from './logPointDecorationProvider';

export const IDecorationManager = Symbol('DecorationManager');

export type IDecorationManager = IDisposable;

@injectable()
export default class DecorationManager implements IDecorationManager {
  private readonly decorators: Map<string, ReadonlyArray<IDecorationProvider>> = new Map();
  private readonly onDidChangeVisibleTextEditorsDisposable: IDisposable;

  constructor(
    @inject(VsCodeApi) vscode: typeof vscodeApiType,
    @inject(ILogger) private readonly logger: ILogger,
    @inject(RootContainer) private readonly rootContainer: interfaces.Container
  ) {
    this.onDidChangeVisibleTextEditorsDisposable = vscode.window.onDidChangeVisibleTextEditors(
      this.onDidChangeVisibleTextEditors
    );
    this.onDidChangeVisibleTextEditors(vscode.window.visibleTextEditors);
  }

  private onDidChangeVisibleTextEditors = (editors: ReadonlyArray<vscodeApiType.TextEditor>): void => {
    for (const editor of editors) {
      const { document } = editor;
      const stringUri = document.uri.toString();

      if (!this.decorators.has(stringUri)) {
        this.logger.info('DecorationManager', `Create decoration providers for ${stringUri}`);
        this.decorators.set(stringUri, [
          new LogPointDecorationProvider(
            this.rootContainer.get(ILogPointRecommender),
            this.rootContainer.get(ILogPointManager),
            this.rootContainer.get(IResourceProvider),
            document
          ),
          new LiveLogDecorationProvider(this.rootContainer.get(ISessionManager), document),
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
      this.onDidChangeVisibleTextEditorsDisposable,
      ...[...this.decorators.values()].reduce((acc, ds) => [...acc, ...ds], []),
    ];
    this.decorators.clear();

    for (const disposable of disposables) {
      disposable.dispose();
    }
  }
}
