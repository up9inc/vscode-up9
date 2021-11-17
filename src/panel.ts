import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


import {
    UP9Auth
} from "./up9Auth";
import {
    UP9ApiProvider
} from "./up9Api";
import { clientIdConfigKey, clientSecretConfigKey, envConfigKey, up9ConfigSectionName } from './consts';
import { readUP9CredsFromConfig, saveUP9CredsToConfig } from './utils';

const panelId = "up9BrowserPanel";
const panelTitle = "UP9 Code Browser";
const panelColumn = vscode.ViewColumn.Two;


//TODO: Refactor this god class
export class UP9Panel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: UP9Panel | undefined;
    private static up9Auth: UP9Auth;
    private static up9ApiProvider: UP9ApiProvider;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _context: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(context: vscode.ExtensionContext) {
        // If we already have a panel, show it.
        if (UP9Panel.currentPanel) {
            UP9Panel.currentPanel._panel.reveal(panelColumn);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            panelId,
            panelTitle,
            panelColumn,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        UP9Panel.currentPanel = new UP9Panel(panel, context);
    }

    public static revive(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        UP9Panel.currentPanel = new UP9Panel(panel, context);
    }

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._context = context;

        // Set the webview's initial html content
        this._panel.webview.html = this._getHtmlForWebview();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );

        this._panel.iconPath = {
            dark: vscode.Uri.file(`${this._context.extensionPath}/images/ui_logo.svg`),
            light: vscode.Uri.file(`${this._context.extensionPath}/images/ui_logo.svg`)
        }

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                console.log('received message', message);
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        break;
                    case 'infoAlert':
                        vscode.window.showInformationMessage(message.text);
                        break;
                    case 'startAuth':
                        (async () => {
                            try {
                                this.startNewAuthForPanel(message.up9Env, message.clientId, message.clientSecret)
                                await saveUP9CredsToConfig(message.up9Env, message.clientId, message.clientSecret);
                                await this.initializePanelAuth();
                            } catch (error) {
                                this._panel.webview.postMessage({
                                    command: 'authError',
                                    authError: error
                                });
                            }
                        })();
                        break;
                    case 'apiRequest':
                        this.handlePanelUP9APIRequest(message);
                        break;
                }
            },
            null,
            this._disposables
        );

        this.initializePanelAuth();
    }

    private handlePanelUP9APIRequest = async (messageData) => {
        if (!UP9Panel.up9ApiProvider || !UP9Panel.up9Auth) {
            console.error('panel attempted to send http request when apiProvider or auth provider are null');
            return;
        }
        let token = UP9Panel.up9Auth.lastToken
        if (!token) {
            console.warn('panel attempted to send http request when up9Auth holds no token, trying to fetch now');
            token = await UP9Panel.up9Auth.getNewToken();
        }
        try {
            //TODO: fix loose typings and magic strings
            switch (messageData.messageType) {
                case "workspaceList":
                    const workspaces = await UP9Panel.up9ApiProvider.getWorkspaces(token);
                    this.handlePanelUP9ApiResponse(messageData, workspaces, null);
                    break;
                case "endpointList":
                    const endpoints = await UP9Panel.up9ApiProvider.getWorkspaceEndpoints(messageData.params.workspaceId, token);
                    this.handlePanelUP9ApiResponse(messageData, endpoints, null);
                    break;
                case "endpointTests":
                    const tests = await UP9Panel.up9ApiProvider.getTestsForSpan(messageData.params.workspaceId, messageData.params.spanGuid, token);
                    this.handlePanelUP9ApiResponse(messageData, tests, null);
                    break;
            }
        } catch (error) {
            console.error("error handling api request from panel", messageData, error);
            this.handlePanelUP9ApiResponse(messageData, null, error);
        }
    }

    private handlePanelUP9ApiResponse = (panelMessageData, apiResponse, error) => {
        const replyMessage = {
            messageId: panelMessageData.messageId,
            messageType: panelMessageData.messageType,
            params: panelMessageData.params,
            apiResponse: apiResponse,
            error: error
        };
        this._panel.webview.postMessage({
            command: 'apiResponse',
            data: replyMessage
        });
    }

    private initializePanelAuth() {
        readUP9CredsFromConfig()
            .then(storedAuthCredentials => {
                if (storedAuthCredentials.clientId) {
                    this._panel.webview.postMessage({
                        command: 'savedData',
                        data: {
                            auth: storedAuthCredentials
                        }
                    });
                    this.startNewAuthForPanel(storedAuthCredentials.up9Env, storedAuthCredentials.clientId, storedAuthCredentials.clientSecret);
                }
            });
    }

    private startNewAuthForPanel(up9Env: string, clientId: string, clientSecret: string) {
        if (UP9Panel.up9Auth) {
            UP9Panel.up9Auth.stop();
        }
        UP9Panel.up9Auth = new UP9Auth(up9Env, clientId, clientSecret,
            (token: string) => {
                this._panel.webview.postMessage({
                    command: 'authResponse',
                    token
                });
            }, (error: string) => {
                this._panel.webview.postMessage({
                    command: 'authError',
                    authError: error
                });
            });

        UP9Panel.up9ApiProvider = new UP9ApiProvider(up9Env);
    }

    public doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({
            command: 'refactor'
        });
    }

    public dispose() {
        UP9Panel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        //the panel's react app is reset when this occurs, we need to send it the user auth config again
        UP9Panel.currentPanel.initializePanelAuth();
    }

    private _getHtmlForWebview(): string {
        try {
            const reactApplicationHtmlFilename = 'index.html';
            const htmlPath = path.join(__dirname, reactApplicationHtmlFilename);
            const html = fs.readFileSync(htmlPath).toString();

            return html;
        } catch (e) {
            return `Error getting HTML for web view: ${e}`;
        }
    }
}