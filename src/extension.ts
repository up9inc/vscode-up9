import * as vscode from 'vscode';
import { CloudRunner } from './commands/runInCloud';
import {
    UP9Panel
} from './panel';

const testBrowserCommandName = 'up9.openTestsBrowser';
const runTestInCloudCommandName = 'up9.runTest';


function onShowTestBrowserCommand(context: vscode.ExtensionContext): void {
    UP9Panel.createOrShow(context)
}

function onRunCodeInCloudCommand(context :vscode.ExtensionContext): void {
    const cloudRunner = new CloudRunner(context, vscode.window.activeTextEditor.document.getText());
}

export function activate(context: vscode.ExtensionContext) {
    const openTestBrowserCommand = vscode.commands.registerCommand(testBrowserCommandName, () => onShowTestBrowserCommand(context));
    const runCodeInCloudCommand = vscode.commands.registerCommand(runTestInCloudCommandName, () => onRunCodeInCloudCommand(context));

    context.subscriptions.push(openTestBrowserCommand);
    context.subscriptions.push(runCodeInCloudCommand);
}