import * as vscode from 'vscode';
import { CloudRunner } from './commands/runInCloud';
import {
    UP9Panel
} from './panel';
import { getAuthConfig, listenPorts, startServerForToken } from './providers/auth';

var http = require('http');

const testBrowserCommandName = 'up9.openTestsBrowser';
const runTestInCloudCommandName = 'up9.runTest';
const testCommandName = 'up9.testAuth';

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

    const testCommand = vscode.commands.registerCommand(testCommandName, () => {
        startServerForToken({client: { id: 'cli' }, auth: getAuthConfig('stg.testr.io')}, [...listenPorts], 'stg.testr.io');
    });

    context.subscriptions.push(openTestBrowserCommand);
    context.subscriptions.push(runCodeInCloudCommand);

    context.subscriptions.push(testCommand);

    // return the context so its usable by tests
    return context;
}