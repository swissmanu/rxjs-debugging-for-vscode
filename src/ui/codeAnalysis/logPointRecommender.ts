import { injectable } from 'inversify';
import ts, { Node, SourceFile, SyntaxKind } from 'typescript';
import * as vscode from 'vscode';
import { EventEmitter, IDisposable, IEvent } from '../../shared/types';

export const ILogPointRecommender = Symbol('LogPointRecommender');

export interface ILogPointRecommender extends IDisposable {
  onRecommendLogPoints: IEvent<IRecommendLogPointsEvent>;
  recommend(document: vscode.TextDocument): void;
}

interface IRecommendLogPointsEvent {
  uri: vscode.Uri;
  logPoints: ReadonlyArray<vscode.Range>;
}

@injectable()
export default class LogPointRecommender implements ILogPointRecommender {
  private _onRecommendLogPoints = new EventEmitter<IRecommendLogPointsEvent>();
  get onRecommendLogPoints(): IEvent<IRecommendLogPointsEvent> {
    return this._onRecommendLogPoints.event;
  }

  async recommend(document: vscode.TextDocument): Promise<void> {
    const documentText = document.getText();
    const sourceFile = ts.createSourceFile('parsed', documentText, ts.ScriptTarget.Latest);

    const callExpressions = traverseChildren(sourceFile, sourceFile).reduce<ReadonlyArray<Node>>((acc, n) => {
      if (n.kind === SyntaxKind.CallExpression) {
        const identifier = findFirstIdentifierChild(n, sourceFile);
        if (identifier) {
          return [...acc, identifier];
        }
      }
      return acc;
    }, []);

    const positions = callExpressions.map((n) => {
      const { line: startLine, character: startCharacter } = sourceFile.getLineAndCharacterOfPosition(
        n.getStart(sourceFile)
      );
      const { line: endLine, character: endCharacter } = sourceFile.getLineAndCharacterOfPosition(n.getEnd());

      return new vscode.Range(
        new vscode.Position(startLine, startCharacter),
        new vscode.Position(endLine, endCharacter)
      );
    });

    const hovers: ReadonlyArray<{ result: vscode.Hover[]; range: vscode.Range } | undefined> = await Promise.all(
      positions.map((range) =>
        vscode.commands.executeCommand('vscode.executeHoverProvider', document.uri, range.start).then(
          (result) => ({ result: result as vscode.Hover[], range }),
          () => undefined
        )
      )
    );

    const logPoints = hovers.reduce<ReadonlyArray<vscode.Range>>((acc, hover) => {
      if (hover) {
        const { result, range } = hover;

        try {
          const filteredHints = result.reduce<vscode.MarkdownString[]>(
            (acc, r) => [
              ...acc,
              ...(r.contents as vscode.MarkdownString[]).reduce<vscode.MarkdownString[]>(
                (acc, m) =>
                  m.value.indexOf('```typescript') !== -1 && m.value.indexOf('OperatorFunction') !== -1
                    ? [...acc, m]
                    : acc,
                []
              ),
            ],
            []
          );

          if (filteredHints.length > 0) {
            return [...acc, range];
          }
        } catch (e) {
          /* ignore */
        }
      }
      return acc;
    }, []);

    this._onRecommendLogPoints.fire({
      uri: document.uri,
      logPoints,
    });
  }

  dispose(): void {
    this._onRecommendLogPoints.dispose();
  }
}

function traverseChildren(parent: Node, sourceFile: SourceFile): ReadonlyArray<Node> {
  return [
    parent,
    ...parent
      .getChildren(sourceFile)
      .reduce<ReadonlyArray<Node>>((acc, child) => [...acc, ...traverseChildren(child, sourceFile)], []),
  ];
}

function findFirstIdentifierChild(parent: Node, sourceFile: SourceFile): Node | undefined {
  const children = parent.getChildren(sourceFile);
  return children.filter((c) => c.kind === SyntaxKind.Identifier)[0];
}
