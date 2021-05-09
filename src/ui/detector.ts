import * as fs from 'fs';
import { injectable } from 'inversify';
import * as path from 'path';
import { TextDocument, WorkspaceFolder } from 'vscode';

export const IRxJSDetector = Symbol('RxJSDetector');

export interface IRxJSDetector {
  detect(workspace: WorkspaceFolder): Promise<boolean>;
}

@injectable()
export class RxJSDetector implements IRxJSDetector {
  async detect(workspaceFolder: WorkspaceFolder): Promise<boolean> {
    try {
      const packageJson = await readFile(path.join(workspaceFolder.uri.fsPath, 'package.json'));
      const hasRxJSDependency = packageJson.indexOf('"rxjs"') !== -1;
      return hasRxJSDependency;
    } catch (_) {
      return false;
    }
  }
}

function readFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (!err) {
        return resolve(data);
      }
      reject(err);
    });
  });
}

export function isSupportedDocument(document: TextDocument): boolean {
  return document.languageId === 'typescript';
}
