import * as vscode from 'vscode';

export default async function openAndShowTextDocument(filePattern: string): Promise<vscode.TextDocument> {
  const [file] = await vscode.workspace.findFiles(filePattern);
  const document = await vscode.workspace.openTextDocument(file);
  await vscode.window.showTextDocument(document);

  return document;
}
