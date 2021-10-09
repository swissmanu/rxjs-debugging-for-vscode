/**
 * Identifies an operator within its surrounding `pipe` statement in a specific file.
 *
 * ### Example
 * The `map` operator can be identified with the position information of the `pipe` statement (L 1, C 15) and the
 * argument index (1). `fileName` is obviously the path to the actual source file.
 *
 * ```
interval(1000).pipe( // pipe: line 1, character 15
  take(2),           // operatorIndex: 0
  map(x => x - 1)    // operatorIndex: 1
);
```
 */
export interface IOperatorIdentifier {
  fileName: string;

  /**
   * The 1-based line index of the operators `pipe` statement.
   */
  line: number;

  /**
   * The 1-based character index of the operators `pipe` statement.
   */
  character: number;

  /**
   * 0-based index of the operator within its `pipe` statement.
   */
  operatorIndex: number;
}
