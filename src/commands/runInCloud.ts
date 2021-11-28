import { getDefaultWorkspace, indentString } from "../utils";
import * as vscode from 'vscode';
import { UP9Auth } from "../providers/up9Auth";
import { UP9ApiProvider } from "../providers/up9Api";
import { startAuthCommandName } from "../extension";

const openUP9SettingsDialogOption = 'Open UP9 Settings';
const openUP9SignInDialogOption = 'Sign In To UP9';

export const terminalLineDelimeter = '\r\n';

export class CloudRunner {
    private _up9Auth: UP9Auth;

    // used for tests as there is no way to get terminal contents via vscode api
    private _onTerminalEmitCallback: (terminalMessage: string) => void; 

    public constructor(up9Auth: UP9Auth, onTerminalEmit?: (terminalMessage: string) => void) {
        this._up9Auth = up9Auth;
        this._onTerminalEmitCallback = onTerminalEmit;
    }

    public startTestRun = (code: string): Promise<void> => {
        return new Promise<any>(async (resolve, reject) => {
            let token: string;

            if (!(await this._up9Auth.isAuthenticated())) {
                this.showAuthenticationError('You must sign in to UP9 first');
                return;
            }

            try {
                token = await this._up9Auth.getToken();
            } catch (error) {
                console.error(error);
                this.showSettingsError('UP9 authentication failed, check console for more details or check up9 extension configuration for errors');
                
                return reject(error);
            }

            const defaultWorkspace = await getDefaultWorkspace();
            if (!defaultWorkspace) {
                this.showSettingsError('No default workspace has been configured for test runs, please configure a default workspace in the up9 extension configuration');
                return reject(new Error("default workspace not configured"));
            }

            //TODO: reuse the same terminal (will require having only 1 simultaneous test run)
            const terminalOutputter = this.createAndShowTerminal("Running test through UP9...\n\r");
            const up9Api = new UP9ApiProvider(this._up9Auth.getEnv());
            try {
                const res = await up9Api.testRunSingle(defaultWorkspace, indentString(code, 4), token);
                if (!res.testLog) {
                    throw "UP9 API returned empty response, does this workspace have a live agent?";
                }
                const log = res.testLog + `\n${this.getLogOutputForRCA(res.rcaData)}`
                this.processTerminalOutputAndPrint(log, terminalOutputter);
                resolve(null);
            } catch (err) {
                console.error(err);
                let terminalErrorMessage: string;
                if (typeof err === 'string') {
                    terminalErrorMessage = err;
                } else {
                    if (err?.response) {
                        const responseBody = JSON.stringify(err?.response?.data, null, 4).replace('\n', '\n\r');
                        terminalErrorMessage = `API returned error: ${err.response.status} ${responseBody}`
                    } else {
                        terminalErrorMessage = `Unknown error occured: ${JSON.stringify(err)}`;
                    }
                }
                
                this.processTerminalOutputAndPrint(terminalErrorMessage, terminalOutputter);
                
                reject(err);
            }
            
        });
    }

    private createAndShowTerminal = (initialMessage: string): vscode.EventEmitter<string> => {
        const statusTerminalEmitter = new vscode.EventEmitter<string>();
        const terminalHandlers = {
            onDidWrite: statusTerminalEmitter.event,
            open: () => {this.processTerminalOutputAndPrint(initialMessage, statusTerminalEmitter);},
            close: () => { /* noop*/ },
            handleInput: (_: string) => {} //seal terminal to user input
        };
        const statusTerminal = vscode.window.createTerminal({ name: 'UP9 Test Run', pty: terminalHandlers });
        statusTerminal.show();

        return statusTerminalEmitter;
    }

    private getLogOutputForRCA = (rca: any): string => {
        let logOutput = "";
        for (const testObj of Object.values(rca.tests)) {
            const rcaTestName = Object.keys(testObj)?.[0];
            if (!rcaTestName) {
                continue;
            }

            const splitRcaIdentifiers = rcaTestName.split("::");
            const testName = splitRcaIdentifiers[splitRcaIdentifiers.length - 1];
            const test = testObj[rcaTestName];

            //@ts-ignore
            const status = test.success;

            logOutput += `${testName}: ${status ? "SUCCESS" : "FAIL"}`;

            if (!status) {
                //@ts-ignore
                const err = test.steps[test.steps.length - 1].errorMessage;
                logOutput += ` ${err}`
            }
            logOutput += `\n`;
        }

        return logOutput;
    }

    private showSettingsError = async (message: string): Promise<void> => {
        const res = await vscode.window.showErrorMessage(message, openUP9SettingsDialogOption);
        if (res === openUP9SettingsDialogOption) {
            vscode.commands.executeCommand('workbench.action.openSettings', 'up9'); //opens settings with `up9` search query
        }
    }

    private showAuthenticationError = async (message: string): Promise<void> => {
        const res = await vscode.window.showErrorMessage(message, openUP9SignInDialogOption);
        if (res === openUP9SignInDialogOption) {
            vscode.commands.executeCommand(startAuthCommandName);
        }
    }

    private processTerminalOutputAndPrint = (text: string, terminalEmitter: vscode.EventEmitter<string>) => {
        const formattedMessage = text.replace(/\n/g, terminalLineDelimeter);
        terminalEmitter.fire(formattedMessage);

        if (this._onTerminalEmitCallback) {
            this._onTerminalEmitCallback(formattedMessage);
        }
    }
}
