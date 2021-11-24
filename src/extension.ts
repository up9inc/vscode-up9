import * as vscode from 'vscode';
import { CloudRunner } from './providers/runInCloud';
import {
    UP9Panel
} from './panel';
import { startTelepresence, stopTelepresence } from './commands/telepresenceCommands';

const testBrowserCommandName = 'up9.openTestsBrowser';
const runTestInCloudCommandName = 'up9.runTest';
const startTelepresenceCommandName = 'up9.startTelepresence';
const stopTelepresenceCommandName = 'up9.stopTelepresence';

function onShowTestBrowserCommand(context: vscode.ExtensionContext): void {
    UP9Panel.createOrShow(context)
}

// onTerminalEmit is used by tests to intercept terminal contents, theres no way to directly get terminal contents otherwise sadly
export async function onRunCodeInCloudCommand(context: vscode.ExtensionContext, onTerminalEmit?: (terminalMessage: string) => void): Promise<void> {
    const cloudRunner = new CloudRunner(context, onTerminalEmit);
    await cloudRunner.startTestRun(vscode.window.activeTextEditor.document.getText());
}

export function activate(context: vscode.ExtensionContext) {
    const openTestBrowserCommand = vscode.commands.registerCommand(testBrowserCommandName, () => onShowTestBrowserCommand(context));

    const runCodeInCloudCommand = vscode.commands.registerCommand(runTestInCloudCommandName, () => onRunCodeInCloudCommand(context));

    const startTelepresenceCommand = vscode.commands.registerCommand(startTelepresenceCommandName, () => startTelepresence(context));
    const stopTelepresenceCommand = vscode.commands.registerCommand(stopTelepresenceCommandName, () => stopTelepresence(context));

    context.subscriptions.push(openTestBrowserCommand);
    context.subscriptions.push(runCodeInCloudCommand);
    context.subscriptions.push(startTelepresenceCommand);
    context.subscriptions.push(stopTelepresenceCommand);

    // return the context so its usable by tests
    return context;
}