import { inject, injectable } from 'inversify';
import { ExtensionContext, Uri } from 'vscode';
import { ExtensionContext as ExtensionContextFromIoC } from './ioc/types';

export const IResourceProvider = Symbol('ResourceProvider');

export interface IResourceProvider {
  uriForResource(fileName: string): Uri;
}

@injectable()
export default class DefaultResourceProvider implements IResourceProvider {
  constructor(@inject(ExtensionContextFromIoC) private readonly context: ExtensionContext) {}

  uriForResource(fileName: string): Uri {
    return Uri.joinPath(this.context.extensionUri, 'resources', fileName);
  }
}
