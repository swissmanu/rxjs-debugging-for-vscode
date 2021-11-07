import { IOperatorIdentifier } from '@rxjs-debugging/telemetry/out/operatorIdentifier';
import {
  CallExpression,
  createSourceFile,
  LineAndCharacter,
  Node,
  PropertyAccessExpression,
  ScriptTarget,
  SourceFile,
  SyntaxKind,
} from 'typescript';

interface Result {
  /**
   * The actual position of the operator in the source code.
   */
  position: Omit<IOperatorIdentifier, 'fileName' | 'operatorIndex'>;

  /**
   * The name of the operator, e.g. `map` or `take`.
   */
  operatorName: string | null;

  /**
   * The `IOperatorIdentifier` (without filename) identifying an operator.
   *
   * @see IOperatorIdentifier
   */
  operatorIdentifier: Omit<IOperatorIdentifier, 'fileName'>;
}

export default async function getOperatorPositions(sourceCode: string): Promise<ReadonlyArray<Result>> {
  const sourceFile = createSourceFile('parsed', sourceCode, ScriptTarget.Latest);

  const operatorPositions: Array<Result> = [];
  const children = collectChildren(sourceFile, sourceFile);

  for (const node of children) {
    if (node.kind === SyntaxKind.CallExpression) {
      const callExpression = node as CallExpression;
      const [firstCallExpressionChild] = getChildren(callExpression);

      if (firstCallExpressionChild.kind === SyntaxKind.PropertyAccessExpression) {
        const propertyAccessExpression = firstCallExpressionChild as PropertyAccessExpression;
        const { name } = propertyAccessExpression;
        const nameStart = getStartOf(name, sourceFile);

        if (name.getText(sourceFile) === 'pipe') {
          for (let i = 0, l = callExpression.arguments.length; i < l; i++) {
            const operator = callExpression.arguments[i];
            const operatorName = getOperatorName(operator, sourceFile);

            operatorPositions.push({
              position: getStartOf(operator, sourceFile),
              operatorName,
              operatorIdentifier: { line: nameStart.line + 1, character: nameStart.character + 1, operatorIndex: i },
            });
          }
        }
      }
    }
  }

  return operatorPositions;
}

function collectChildren(parent: Node, sourceFile: SourceFile, collector: Array<Node> = []): ReadonlyArray<Node> {
  parent.forEachChild((c) => {
    collector.push(c);
    collectChildren(c, sourceFile, collector);
  });
  return collector;
}

function getChildren(parent: Node): ReadonlyArray<Node> {
  const children: Array<Node> = [];
  parent.forEachChild((c) => children.push(c));
  return children;
}

function getStartOf(node: Node, sourceFile: SourceFile): LineAndCharacter {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
}

function getOperatorName(node: Node, sourceFile: SourceFile): string | null {
  if (node.kind === SyntaxKind.CallExpression) {
    const callExpression = node as CallExpression;
    return callExpression.expression.getText(sourceFile);
  }
  return null;
}
