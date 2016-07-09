'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext)
{
    let docs: vscode.DocumentFilter[] = [ { language: 'css' }, { language: 'less' }, { language: 'sass' } ];
    let px2rem = new Px2Rem(context.subscriptions);

    vscode.languages.registerCodeActionsProvider(docs, px2rem);
}
/**
 * Px2Rem
 */
class Px2Rem implements vscode.CodeActionProvider
{
    public static commandId = "px2rem.execPx2Rem";
    public static keybindId = "px2rem.canPx2Rem";
    
    private convertibles: vscode.TextEdit[] = [];

    constructor(subscriptions: vscode.Disposable[])
    {
        vscode.window.onDidChangeTextEditorSelection(this.OnSelectionChange, this, subscriptions);

        let d1 = vscode.commands.registerCommand(Px2Rem.commandId, this.ExecutePx2Rem, this);
        subscriptions.push(d1, this);
    }

    public dispose()
    {
    }

    public provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.Command[]
    {
        // TODO
        return [];
    }

    private ExecutePx2Rem()
    {
        this.convertibles.forEach(convertEdit => {
            if (convertEdit) {
                let edit = new vscode.WorkspaceEdit();
                edit.replace(vscode.window.activeTextEditor.document.uri, convertEdit.range, convertEdit.newText);
                vscode.workspace.applyEdit(edit);

                let position = convertEdit.range.start;
                position = position.translate(0, convertEdit.newText.length);
                vscode.window.activeTextEditor.selection = new vscode.Selection(position, position);
            }
        });
    }

    private OnSelectionChange(e: vscode.TextEditorSelectionChangeEvent)
    {
        vscode.commands.executeCommand('setContext', Px2Rem.keybindId, false);

        let editor = e.textEditor;
        let selections = e.selections;

        if (selections.length === 0) {
            return;
        }

        let document = editor.document;
        let ok = false;

        this.convertibles = selections.map((selection) => {
            let position = selection.active;

            let wordAtPosition = document.getWordRangeAtPosition(position);
            let currentWord = '';
            if (wordAtPosition && wordAtPosition.start.character < position.character) {
                let word = document.getText(wordAtPosition);
                currentWord = word.substr(0, position.character - wordAtPosition.start.character);
            }

            if (!currentWord.endsWith('px')) {
                return null;
            }

            let px = parseFloat(currentWord);
            if (isNaN(px)) {
                return null;
            }

            let config = vscode.workspace.getConfiguration('px2rem');
            let rem = px / config.get<number>('ratios');
            let remVal = parseFloat(rem.toFixed(config.get<number>('ndigits'))) + 'rem'; 

            ok = true;
            return new vscode.TextEdit(
                new vscode.Range(wordAtPosition.start, new vscode.Position(wordAtPosition.end.line, wordAtPosition.start.character + currentWord.length)),
                remVal
            );
        });

        if (ok) {
            vscode.commands.executeCommand('setContext', Px2Rem.keybindId, true);    
        }
    }

    
}