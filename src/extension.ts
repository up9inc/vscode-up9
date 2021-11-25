import * as vscode from 'vscode';
import { CloudRunner } from './commands/runInCloud';
import { envConfigKey } from './consts';
import {
    UP9Panel
} from './panel';
import { UP9Auth } from './providers/up9Auth';
import { readConfigValue } from './utils';

var http = require('http');

const testBrowserCommandName = 'up9.openTestsBrowser';
const runTestInCloudCommandName = 'up9.runTest';
const testCommandName = 'up9.testAuth';


// onTerminalEmit is used by tests to intercept terminal contents, theres no way to directly get terminal contents otherwise sadly
export async function onRunCodeInCloudCommand(context: vscode.ExtensionContext, up9Auth: UP9Auth, onTerminalEmit?: (terminalMessage: string) => void): Promise<void> {
    const cloudRunner = new CloudRunner(context, up9Auth, onTerminalEmit);
    await cloudRunner.startTestRun(vscode.window.activeTextEditor.document.getText());
}

export async function activate(context: vscode.ExtensionContext): Promise<vscode.ExtensionContext> {
    const up9Env = await readConfigValue(envConfigKey);
    const up9Auth = await UP9Auth.getInstance(up9Env, context);


    const openTestBrowserCommand = vscode.commands.registerCommand(testBrowserCommandName, () => UP9Panel.createOrShow(context, up9Auth));
    const runCodeInCloudCommand = vscode.commands.registerCommand(runTestInCloudCommandName, () => onRunCodeInCloudCommand(context, up9Auth));

    const testCommand = vscode.commands.registerCommand(testCommandName, () => {
        // startServerForToken({client: { id: 'cli' }, auth: getAuthConfig('stg.testr.io')}, [...listenPorts], 'stg.testr.io');
    });

    context.subscriptions.push(openTestBrowserCommand);
    context.subscriptions.push(runCodeInCloudCommand);

    context.subscriptions.push(testCommand);

    // return the context so its usable by tests
    return context;
}