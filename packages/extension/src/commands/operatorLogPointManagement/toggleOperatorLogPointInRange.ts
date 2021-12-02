import * as vscode from 'vscode';
import { IOperatorLogPointManager } from '../../operatorLogPoint/manager';

export default function toggleOperatorLogPointInRange(
  operatorLogPointManager: IOperatorLogPointManager
): () => Thenable<void> {
  return async () => {
    for (const selection of vscode.window.activeTextEditor?.selections ?? []) {
      for (const logPoint of operatorLogPointManager.logPointsForSelection(selection)) {
        if (logPoint.enabled) {
          operatorLogPointManager.disable(logPoint);
        } else {
          operatorLogPointManager.enable(logPoint);
        }
      }
    }
  };
}
