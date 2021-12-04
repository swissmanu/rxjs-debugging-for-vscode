import * as vscode from 'vscode';

const SUPPORTED_LANGUAGES = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact'];

export default function isSupportedDocument({ languageId }: vscode.TextDocument): boolean {
  return SUPPORTED_LANGUAGES.includes(languageId);
}
