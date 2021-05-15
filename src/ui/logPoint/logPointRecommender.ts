import { inject, injectable } from 'inversify';
import ts, { Node, SourceFile, SyntaxKind } from 'typescript';
import * as vscode from 'vscode';
import { LogPoint } from '.';
import { IDisposable } from '../../shared/types';
import { ILogger } from '../logger';
import { isSupportedDocument } from '../workspaceMonitor/supportedDocument';

export const ILogPointRecommender = Symbol('LogPointRecommender');

export interface ILogPointRecommendationEvent {
  documentUri: vscode.Uri;
  logPoints: ReadonlyArray<LogPoint>;
}
export interface ILogPointRecommender extends IDisposable {
  onRecommendLogPoints: vscode.Event<ILogPointRecommendationEvent>;
  recommend(document: vscode.TextDocument): void;
}

@injectable()
export default class LogPointRecommender implements ILogPointRecommender {
  private _onRecommendLogPoints = new vscode.EventEmitter<ILogPointRecommendationEvent>();
  get onRecommendLogPoints(): vscode.Event<ILogPointRecommendationEvent> {
    return this._onRecommendLogPoints.event;
  }

  constructor(@inject(ILogger) private readonly logger: ILogger) {}

  async recommend(document: vscode.TextDocument): Promise<void> {
    if (!isSupportedDocument(document)) {
      return;
    }

    this.logger.info('LogPointRecommender', `Recommend log points for ${document.uri.toString()}`);

    const callExpressionRanges = await getCallExpressionRanges(document);
    const recommendedLogPointRanges = await recommendLogPointRangesUsingHovers(document, callExpressionRanges);

    this._onRecommendLogPoints.fire({
      documentUri: document.uri,
      logPoints: recommendedLogPointRanges.map(({ start }) => new LogPoint(document.uri, start)),
    });
  }

  dispose(): void {
    this._onRecommendLogPoints.dispose();
  }
}

/**
 * Uses the TypeScript parser to return a list of `Range`s representing `CallExpression`s in the AST of the given
 * `TextDocument`.
 *
 * @param document
 * @returns
 */
async function getCallExpressionRanges(document: vscode.TextDocument): Promise<ReadonlyArray<vscode.Range>> {
  const sourceFile = ts.createSourceFile('parsed', document.getText(), ts.ScriptTarget.Latest);

  const callExpressions = traverseChildren(sourceFile, sourceFile).reduce<ReadonlyArray<Node>>((acc, n) => {
    if (n.kind === SyntaxKind.CallExpression) {
      const identifier = findFirstIdentifierChild(n, sourceFile);
      if (identifier) {
        return [...acc, identifier];
      }
    }
    return acc;
  }, []);

  return callExpressions.map((n) => {
    const { line: startLine, character: startCharacter } = sourceFile.getLineAndCharacterOfPosition(
      n.getStart(sourceFile)
    );
    const { line: endLine, character: endCharacter } = sourceFile.getLineAndCharacterOfPosition(n.getEnd());

    return new vscode.Range(new vscode.Position(startLine, startCharacter), new vscode.Position(endLine, endCharacter));
  });
}

/**
 * The hover contents provided through the TypeScript language server contain type information for a given position in
 * a `TextDocument`. This function uses this fact in order to determine the type of a call expression at such a
 * position.
 *
 * This is far from a desirable implementation, but until we have a real channel to the TypeScript language server, we
 * need this hack to recommend log points ot the user.
 *
 * @param document
 * @param callExpressionRanges
 * @returns
 * @see 🙏 https://github.com/microsoft/TypeScript/issues/43893 could lead to a better and more reliable implementation.
 */
async function recommendLogPointRangesUsingHovers(
  document: vscode.TextDocument,
  callExpressionRanges: ReadonlyArray<vscode.Range>
): Promise<ReadonlyArray<vscode.Range>> {
  const hovers: ReadonlyArray<{ result: vscode.Hover[]; range: vscode.Range } | undefined> = await Promise.all(
    callExpressionRanges.map((range) =>
      getHovers(document.uri, range.start).then(
        (result) => ({ result, range }),
        () => undefined
      )
    )
  );

  return hovers.reduce<ReadonlyArray<vscode.Range>>((acc, hover) => {
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
}

async function getHovers(uri: vscode.Uri, position: vscode.Position): Promise<vscode.Hover[]> {
  // When starting up typescript support, the hover with typescript type information might not be available yet.
  // Retry up to 10 times before giving up... Sorry... But it works, mostly. 😇
  async function retry(attemptNumber = 1): Promise<vscode.Hover[]> {
    if (attemptNumber >= 10) {
      return [];
    }

    const hovers: vscode.Hover[] | undefined = await vscode.commands.executeCommand(
      'vscode.executeHoverProvider',
      uri,
      position
    );

    if (hovers) {
      const startingUp =
        hovers.length === 0 ||
        hovers.some((h) =>
          (h.contents as vscode.MarkdownString[]).some(
            (c) => c.value.indexOf('```typescript') !== -1 && c.value.indexOf('(loading...)') !== -1
          )
        );

      if (startingUp) {
        await wait(1000);
        return await retry(attemptNumber + 1);
      }

      return hovers;
    }

    return [];
  }

  return await retry();
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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
