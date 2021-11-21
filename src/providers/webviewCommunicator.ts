import * as vscode from 'vscode';
import { UP9ApiProvider } from './up9Api';
import { UP9Auth } from './up9Auth';
import { readUP9CredsFromConfig, saveUP9CredsToConfig } from '../utils';


// this class is the only link the webview has to the "outside world", the webview is limited by CORS which means all up9 api https requests have to go through here where CORS isnt an issue.
export class UP9WebviewCommunicator {
    private _panel: vscode.WebviewPanel;
    private _authProvider: UP9Auth;
    private _apiProvider: UP9ApiProvider;

    public constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
    }

    public registerOnMessageListeners(disposables: vscode.Disposable[]) {
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
                                await this.applyAuthenticationCredentials(message.up9Env, message.clientId, message.clientSecret)
                                await saveUP9CredsToConfig(message.up9Env, message.clientId, message.clientSecret);
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
            disposables
        );
    }

    private applyAuthenticationCredentials = async (up9Env: string, clientId: string, clientSecret: string) => {
        this._authProvider = new UP9Auth(up9Env, clientId, clientSecret);
        this._apiProvider = new UP9ApiProvider(up9Env);
        try {
            // attempt to get token to verify all credentials work
            await this._authProvider.getToken();

            this._panel.webview.postMessage({
                command: 'authSuccess'
            });
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'authError',
                authError: error
            });
            console.error('error getting token with supplied credentials', error);
        }
    }

    public syncStoredCredentialsToWebView() {
        readUP9CredsFromConfig()
            .then(storedAuthCredentials => {
                if (storedAuthCredentials.clientId) {
                    this._panel.webview.postMessage({
                        command: 'savedData',
                        data: {
                            auth: storedAuthCredentials
                        }
                    });
                    this.applyAuthenticationCredentials(storedAuthCredentials.up9Env, storedAuthCredentials.clientId, storedAuthCredentials.clientSecret);
                }
            });
    }

    private handlePanelUP9APIRequest = async (messageData) => {
        if (!this._apiProvider || !this._authProvider) {
            console.error('panel attempted to send http request when apiProvider or auth provider are null');
            return;
        }
        let token = await this._authProvider.getToken();
        try {
            //TODO: fix loose typings and magic strings
            switch (messageData.messageType) {
                case "workspaceList":
                    const workspaces = await this._apiProvider.getWorkspaces(token);
                    this.handlePanelUP9ApiResponse(messageData, workspaces, null);
                    break;
                case "endpointList":
                    const endpoints = await this._apiProvider.getWorkspaceEndpoints(messageData.params.workspaceId, token);
                    this.handlePanelUP9ApiResponse(messageData, endpoints, null);
                    break;
                case "endpointTests":
                    const tests = await this._apiProvider.getTestsForSpan(messageData.params.workspaceId, messageData.params.spanGuid, token);
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
            apiMessageId: panelMessageData.apiMessageId,
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
}