import * as vscode from 'vscode';
import { CloudRunner } from './commands/runInCloud';
import { envConfigKey } from './consts';
import { K8STunnel } from './k8sTunnel/tunnel';
import {
    UP9Panel
} from './panel';
import { UP9Auth } from './providers/up9Auth';
import { readConfigValue } from './utils';

var http = require('http');

const testBrowserCommandName = 'up9.openTestsBrowser';
const runTestInCloudCommandName = 'up9.runTest';
export const startAuthCommandName = 'up9.webAuth';
const signOutCommandName = 'up9.signOut';
const startTunnelCommandName = 'up9.startTunnel';
const stopTunnelCommandName = 'up9.stopTunnel';


// onTerminalEmit is used by tests to intercept terminal contents, theres no way to directly get terminal contents otherwise sadly
export async function onRunCodeInCloudCommand(up9Auth: UP9Auth, onTerminalEmit?: (terminalMessage: string) => void): Promise<void> {
    const cloudRunner = new CloudRunner(up9Auth, onTerminalEmit);
    await cloudRunner.startTestRun(vscode.window.activeTextEditor.document.getText());
}

export async function activate(context: vscode.ExtensionContext): Promise<vscode.ExtensionContext> {
    const up9Env = await readConfigValue(envConfigKey);
    const up9Auth = await UP9Auth.getInstance(up9Env, context);

    const openTestBrowserCommand = vscode.commands.registerCommand(testBrowserCommandName, () => UP9Panel.createOrShow(context, up9Auth));
    const runCodeInCloudCommand = vscode.commands.registerCommand(runTestInCloudCommandName, () => onRunCodeInCloudCommand(up9Auth));
    const startAuthCommand = vscode.commands.registerCommand(startAuthCommandName, () => up9Auth.startNewAuthentication());
    const signOutCommand = vscode.commands.registerCommand(signOutCommandName, () => up9Auth.signOut());
    const startTunnelCommand = vscode.commands.registerCommand(startTunnelCommandName, () => {
        const tunnel = K8STunnel.getInstance();
        tunnel.start();
        
        vscode.window.showInformationMessage(`Tunnel is running at ${tunnel.getProxyAddress()}`);
    });
    const stopTunnelCommand = vscode.commands.registerCommand(stopTunnelCommandName, () => K8STunnel.getInstance().stop());
    

    context.subscriptions.push(openTestBrowserCommand);
    context.subscriptions.push(runCodeInCloudCommand);
    context.subscriptions.push(startAuthCommand);
    context.subscriptions.push(signOutCommand);
    context.subscriptions.push(startTunnelCommand);
    context.subscriptions.push(stopTunnelCommand);

    // return the context so its usable by tests
    return context;
}