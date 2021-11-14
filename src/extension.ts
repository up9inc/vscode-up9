import * as vscode from 'vscode';
import {
    UP9Panel
} from './panel';

const startCommandName = 'up9.openTestsBrowser';


function onCommand(context: vscode.ExtensionContext): void {
    UP9Panel.createOrShow(context)
}

export function activate(context: vscode.ExtensionContext) {
    const startCommand = vscode.commands.registerCommand(startCommandName, () => onCommand(context));

    context.subscriptions.push(startCommand);
}