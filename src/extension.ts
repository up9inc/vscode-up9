import * as vscode from 'vscode';
import { CloudRunner } from './commands/runInCloud';
import { runCreateTunneledLaunchConfig } from './commands/tunneledLaunchConfig';
import { defaultUP9Env, defaultUP9EnvProtocol, envConfigKey, envProtocolConfigKey } from './consts';
import { K8STunnel } from './k8sTunnel/tunnel';
import {
    UP9Panel
} from './panel';
import { UP9Auth } from './providers/up9Auth';
import { readStoredValue } from './utils';

const testBrowserCommandName = 'up9.openTestsBrowser';
const runTestInCloudCommandName = 'up9.runTest';
export const startAuthCommandName = 'up9.webAuth';
const signOutCommandName = 'up9.signOut';
export const startTunnelCommandName = 'up9.startTunnel';
const stopTunnelCommandName = 'up9.stopTunnel';
const createTunneledConfigCommandName = 'up9.createTunneledLaunchConfig';


// onTerminalEmit is used by tests to intercept terminal contents, theres no way to directly get terminal contents otherwise sadly
export async function onRunCodeInCloudCommand(context: vscode.ExtensionContext, up9Auth: UP9Auth, onTerminalEmit?: (terminalMessage: string) => void): Promise<void> {
    const cloudRunner = new CloudRunner(up9Auth, onTerminalEmit);
    await cloudRunner.startTestRun(context, vscode.window.activeTextEditor.document.getText());
}

export async function activate(context: vscode.ExtensionContext): Promise<vscode.ExtensionContext> {
    const up9Env = await readStoredValue(context, envConfigKey, defaultUP9Env);
    const up9EnvProtocol = await readStoredValue(context, envProtocolConfigKey, defaultUP9EnvProtocol);
    const up9Auth = await UP9Auth.getInstance(up9Env, up9EnvProtocol, context);

    const openTestBrowserCommand = vscode.commands.registerCommand(testBrowserCommandName, () => UP9Panel.createOrShow(context, up9Auth));
    const runCodeInCloudCommand = vscode.commands.registerCommand(runTestInCloudCommandName, () => onRunCodeInCloudCommand(context, up9Auth));
    const startAuthCommand = vscode.commands.registerCommand(startAuthCommandName, () => up9Auth.startNewAuthentication(up9Env, up9EnvProtocol));
    const signOutCommand = vscode.commands.registerCommand(signOutCommandName, () => up9Auth.signOut());
    const startTunnelCommand = vscode.commands.registerCommand(startTunnelCommandName, () => {
        const tunnel = K8STunnel.getInstance();
        tunnel.start();

        vscode.window.showInformationMessage(`Tunnel is running at ${tunnel.getProxyAddress()}`);
    });
    const stopTunnelCommand = vscode.commands.registerCommand(stopTunnelCommandName, () => K8STunnel.getInstance().stop());
    const createTunneledConfigCommand = vscode.commands.registerCommand(createTunneledConfigCommandName, () => runCreateTunneledLaunchConfig(K8STunnel.getInstance().getProxyAddress()));

    const triggerPushTestCodeCommand = vscode.commands.registerCommand('up9.pushCode', () => {
        UP9Panel?.currentPanel?.webviewCommunicator?.requestPushCodeFromPanel();
    });
    const triggerCopyTestCodeCommand = vscode.commands.registerCommand('up9.copyCode', () => {
        UP9Panel?.currentPanel?.webviewCommunicator?.requestCopyCodeFromPanel();
    });
    

    context.subscriptions.push(openTestBrowserCommand);
    context.subscriptions.push(runCodeInCloudCommand);
    context.subscriptions.push(startAuthCommand);
    context.subscriptions.push(signOutCommand);
    context.subscriptions.push(startTunnelCommand);
    context.subscriptions.push(stopTunnelCommand);
    context.subscriptions.push(createTunneledConfigCommand);
    context.subscriptions.push(triggerPushTestCodeCommand);
    context.subscriptions.push(triggerCopyTestCodeCommand);

    // return the context so its usable by tests
    return context;
}