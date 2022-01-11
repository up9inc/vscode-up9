import * as vscode from 'vscode';
import { UP9ApiProvider } from './up9Api';
import { UP9Auth } from './up9Auth';
import { WebViewApiMessage, MessageCommandType, ApiMessageType } from '../models/internal';
import { defaultUP9Env, defaultUP9EnvProtocol, defaultWorkspaceConfigKey, envConfigKey, envProtocolConfigKey, microTestsClassDef, microTestsHeader } from '../consts';
import { readStoredValue, setStoredValue } from '../utils';
import { env } from 'process';


// this class is the only link the webview has to the "outside world", the webview is limited by CORS which means all up9 api https requests have to go through here where CORS isnt an issue.
export class UP9WebviewCommunicator {
    private _panel: vscode.WebviewPanel;
    private _authProvider: UP9Auth;
    private _apiProvider: UP9ApiProvider;
    private _context: vscode.ExtensionContext;

    public constructor(context: vscode.ExtensionContext, panel: vscode.WebviewPanel, up9Auth: UP9Auth) {
        this._panel = panel;
        this._authProvider = up9Auth;
        this._apiProvider = new UP9ApiProvider(up9Auth.getEnv(), up9Auth.getEnvProtocol());
        this._context = context;

        this._authProvider.onAuth(authStatus => {
            this.notifyPanelOfAuthStateChange(authStatus);
        });
    }

    public async registerOnMessageListeners(disposables: vscode.Disposable[]): Promise<void> {
        this._panel.webview.onDidReceiveMessage(
            message => {
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
                                await this.handleNewAuth(message.env);
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
                            await setStoredValue(this._context, defaultWorkspaceConfigKey, message.workspaceId);
                        })();
                        break;
                    case MessageCommandType.PushText:
                        this.pushCodeToActiveEditor(message.code, message.header);
                        break;
                    case MessageCommandType.AuthSignOut:
                        (async () => {
                            try {
                                await this._authProvider.signOut();
                                this.notifyPanelOfAuthStateChange(false);
                            } catch (error) {
                                console.error(error);
                                vscode.window.showErrorMessage('An unexpected error occured while signing out');
                            }
                        })();
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

    private async handleNewAuth(up9EnvUrl: string): Promise<void> {
        const {env, protocol} = this.getEnvHostAndProtocol(up9EnvUrl);

        await this._authProvider.startNewAuthentication(env, protocol);
        this._apiProvider = new UP9ApiProvider(this._authProvider.getEnv(), this._authProvider.getEnvProtocol());
        await setStoredValue(this._context, envConfigKey, env);
        await setStoredValue(this._context, envProtocolConfigKey, protocol);
        await setStoredValue(this._context, defaultWorkspaceConfigKey, null);
        await this.sendStoredDataToPanel();
        this.notifyPanelOfAuthStateChange(true);

    }

    private getEnvHostAndProtocol(up9EnvUrl: string): { env: string, protocol: string } {
        let protocol = defaultUP9EnvProtocol;
        let env = up9EnvUrl;
        if (up9EnvUrl.indexOf("://") > 0) {
            const parsedUrl = new URL(up9EnvUrl);
            protocol = parsedUrl.protocol.replace(":", "");
            env = parsedUrl.host;
        }

        return {env, protocol};
    }

    private async sendStoredDataToPanel(): Promise<void> {
        const defaultWorkspace = await readStoredValue(this._context, defaultWorkspaceConfigKey);
        const env = await readStoredValue(this._context, envConfigKey, defaultUP9Env);
        const envProtocol = await readStoredValue(this._context, envProtocolConfigKey, defaultUP9EnvProtocol);
        this._panel.webview.postMessage({
            command: MessageCommandType.StoredData,
            defaultWorkspace,
            env: `${envProtocol}://${env}`
        });
    }

    private handlePanelUP9APIRequest = async (messageData: WebViewApiMessage) => {
        if (!this._apiProvider || !this._authProvider) {
            console.error('panel attempted to send http request when apiProvider or auth provider are null');
        }
        try {
            let response;
            switch (messageData.messageType) {
                case ApiMessageType.WorkspacesList:
                    response = await this._apiProvider.getWorkspaces(await this._authProvider.getToken());
                    break;
                case ApiMessageType.EndpointsList:
                    response = await this._apiProvider.getWorkspaceEndpoints(messageData.params.workspaceId, await this._authProvider.getToken());
                    break;
                case ApiMessageType.EndpointTests:
                    response = await this._apiProvider.getTestsForSpan(messageData.params.workspaceId, messageData.params.spanGuid, await this._authProvider.getToken());
                    break;
                case ApiMessageType.Swagger:
                    response = await this._apiProvider.getSwagger(messageData.params.workspaceId, await this._authProvider.getToken());
                    break;
                case ApiMessageType.Spans:
                    response = await this._apiProvider.getSpans(messageData.params.workspaceId, messageData.params.spanId, await this._authProvider.getToken());
                    break;
                case ApiMessageType.EnvCheck:
                    const {env, protocol} = this.getEnvHostAndProtocol(messageData.params.env);
                    response = await this._apiProvider.checkEnv(protocol, env);
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
            if (currentEditorContents.indexOf("class ") == -1) {
                editor.insertSnippet(new vscode.SnippetString(`${microTestsClassDef}\n${code}`));
            } else {
                editor.insertSnippet(new vscode.SnippetString(`\n\n${code.replace('    ', '')}`));
            }
            
        } else {
            editor.insertSnippet(new vscode.SnippetString(`${microTestsHeader}\n${code}`));
        }
    }
}