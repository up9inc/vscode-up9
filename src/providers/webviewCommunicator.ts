import * as vscode from 'vscode';
import { UP9ApiProvider } from './up9Api';
import { UP9Auth } from './up9Auth';
import { WebViewApiMessage, MessageCommandType, ApiMessageType } from '../models/internal';
import { defaultWorkspaceConfigKey } from '../consts';
import { readConfigValue, setConfigValue } from '../utils';


// this class is the only link the webview has to the "outside world", the webview is limited by CORS which means all up9 api https requests have to go through here where CORS isnt an issue.
export class UP9WebviewCommunicator {
    private _panel: vscode.WebviewPanel;
    private _authProvider: UP9Auth;
    private _apiProvider: UP9ApiProvider;

    public constructor(panel: vscode.WebviewPanel, up9Auth: UP9Auth) {
        this._panel = panel;
        this._authProvider = up9Auth;
        this._apiProvider = new UP9ApiProvider(up9Auth.getEnv()); //TODO: this has to reload somehow on config change, maybe theres a way to reset the extension completely on config change

        this._authProvider.onAuth(authStatus => {
            this.notifyPanelOfAuthStateChange(authStatus);
        });
    }

    public async registerOnMessageListeners(disposables: vscode.Disposable[]): Promise<void> {
        this._panel.webview.onDidReceiveMessage(
            message => {
                console.log('received message', message);
                switch (message.command) {
                    case MessageCommandType.Alert:
                        vscode.window.showErrorMessage(message.text);
                        break;
                    case MessageCommandType.InfoAlert:
                        vscode.window.showInformationMessage(message.text);
                        break;
                    case MessageCommandType.StartAuth:
                        (async () => {
                            try {
                                await this._authProvider.startNewAuthentication();
                                this.notifyPanelOfAuthStateChange(true);
                            } catch (error) {
                                this._panel.webview.postMessage({
                                    command: MessageCommandType.AuthError,
                                    authError: error
                                });
                            }
                        })();
                        break;
                    case MessageCommandType.ApiRequest:
                        this.handlePanelUP9APIRequest(message);
                        break;
                    case MessageCommandType.SetDefaultWorkspace:
                        (async () => {
                            await setConfigValue(defaultWorkspaceConfigKey, message.workspaceId);
                        })();
                    case MessageCommandType.PushText:
                        this.pushCodeToActiveEditor(message.code, message.header);
                        break;
                }
            },
            null,
            disposables
        );

        if (await this._authProvider.isAuthenticated()) {
            this.notifyPanelOfAuthStateChange(true);
        }
        await this.sendStoredDataToPanel();
    }

    private notifyPanelOfAuthStateChange(authStatus: boolean): void {
        try {
            if (authStatus) {
                this._panel.webview.postMessage({
                    command: MessageCommandType.AuthSuccess,    
                    username: this._authProvider.getUsernameFromToken()
                });
            } else {
                this._panel.webview.postMessage({
                    command: MessageCommandType.AuthSignOut,
                });
            }
        } catch (error) {
            console.warn('failed to send auth state to panel', error);
        }   
    }

    private async sendStoredDataToPanel(): Promise<void> {
        const defaultWorkspace = await readConfigValue(defaultWorkspaceConfigKey);
        this._panel.webview.postMessage({
            command: MessageCommandType.StoredData,
            defaultWorkspace: defaultWorkspace
        });
    }

    private handlePanelUP9APIRequest = async (messageData: WebViewApiMessage) => {
        if (!this._apiProvider || !this._authProvider) {
            console.error('panel attempted to send http request when apiProvider or auth provider are null');
            return;
        }
        let token = await this._authProvider.getToken();
        try {
            let response;
            switch (messageData.messageType) {
                case ApiMessageType.WorkspacesList:
                    response = await this._apiProvider.getWorkspaces(token);
                    break;
                case ApiMessageType.EndpointsList:
                    response = await this._apiProvider.getWorkspaceEndpoints(messageData.params.workspaceId, token);
                    break;
                case ApiMessageType.EndpointTests:
                    response = await this._apiProvider.getTestsForSpan(messageData.params.workspaceId, messageData.params.spanGuid, token);
                    break;
                case ApiMessageType.Swagger:
                    response = await this._apiProvider.getSwagger(messageData.params.workspaceId, token);
                    break;
                case ApiMessageType.Spans:
                    response = await this._apiProvider.getSpans(messageData.params.workspaceId, messageData.params.spanId, token);
                    break;
            }

            this.handlePanelUP9ApiResponse(messageData, response, null);
        } catch (error) {
            console.error("error handling api request from panel", messageData, error);
            this.handlePanelUP9ApiResponse(messageData, null, error);
        }
    }

    private handlePanelUP9ApiResponse = (panelMessageData: WebViewApiMessage, apiResponse, error) => {
        const replyMessage = {
            apiMessageId: panelMessageData.apiMessageId,
            messageType: panelMessageData.messageType,
            params: panelMessageData.params,
            apiResponse: apiResponse,
            error: error
        };
        this._panel.webview.postMessage({
            command: MessageCommandType.ApiResponse,
            data: replyMessage
        });
    }

    private pushCodeToActiveEditor = (code: string, header: string) => { 
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            editor = vscode.window.visibleTextEditors?.[0];
        }

        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const currentEditorContents = editor.document.getText();
        if (currentEditorContents) {
            editor.insertSnippet(new vscode.SnippetString(`\n\n${code.replace('    ', '')}`));
        } else {
            editor.insertSnippet(new vscode.SnippetString(`${header}\n${code}`));
        }
    }
}