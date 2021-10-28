import * as vscode from 'vscode';

export function isSupportedDocument(document: vscode.TextDocument): boolean {
  return document.languageId === 'typescript';
}
