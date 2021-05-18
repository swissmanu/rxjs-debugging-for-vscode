import * as fs from 'fs';
import { inject, injectable } from 'inversify';
import { Uri, WorkspaceFolder } from 'vscode';
import { ILogger } from '../logger';

export const IRxJSDetector = Symbol('RxJSDetector');

export interface IRxJSDetector {
  detect(workspace: WorkspaceFolder): Promise<boolean>;
}

@injectable()
export class RxJSDetector implements IRxJSDetector {
  constructor(@inject(ILogger) private readonly logger: ILogger) {}

  async detect(workspaceFolder: WorkspaceFolder): Promise<boolean> {
    try {
      const packageJson = await readFile(Uri.joinPath(workspaceFolder.uri, 'package.json').fsPath);
      const hasRxJSDependency = packageJson.indexOf('"rxjs"') !== -1;
      this.logger.info('Detector', `RxJS detected in ${workspaceFolder.uri.fsPath}`);
      return hasRxJSDependency;
    } catch (_) {
      this.logger.info('Detector', `RxJS not detected in ${workspaceFolder.uri.fsPath}`);
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
