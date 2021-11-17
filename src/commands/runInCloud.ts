import { getDefaultWorkspace, indentString, readUP9CredsFromConfig } from "../utils";
import * as vscode from 'vscode';
import { UP9Auth } from "../up9Auth";
import { UP9ApiProvider } from "../up9Api";

const openUP9SettingsDialogOption = "Open UP9 Settings";

export const terminalLineDelimeter = '\r\n';

export class CloudRunner {
    private context: vscode.ExtensionContext;
    // used for tests as there is no way to get terminal contents via vscode api
    private onTerminalEmitCallback: (terminalMessage: string) => void; 

    public constructor(context: vscode.ExtensionContext, onTerminalEmit?: (terminalMessage: string) => void) {
        this.context = context;
        this.onTerminalEmitCallback = onTerminalEmit;
    }

    public startTestRun = (code: string): Promise<void> => {
        return new Promise<any>(async (resolve, reject) => {
            const up9Auth = await this.getStoredUP9Auth(this.context);
            let token: string;
            if (!up9Auth) {
                this.showSettingsError('UP9 authentication hasn\'t been configured yet, please configure the up9 extension in vscode configuration');
                return reject(Error("up9 auth not configured"));
            }

            try {
                token = await up9Auth.getNewToken();
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
            const up9Api = new UP9ApiProvider(up9Auth.getEnv());
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
    

    private getStoredUP9Auth = async (context: vscode.ExtensionContext): Promise<UP9Auth> => {
        const storedAuthCredentials = await readUP9CredsFromConfig();
        if (storedAuthCredentials) {
            return new UP9Auth(storedAuthCredentials.up9Env, storedAuthCredentials.clientId, storedAuthCredentials.clientSecret, () => {}, (err) => {console.error(err)});
        }
        return null;
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

    private processTerminalOutputAndPrint = (text: string, terminalEmitter: vscode.EventEmitter<string>) => {
        const formattedMessage = text.replace(/\n/g, terminalLineDelimeter);
        terminalEmitter.fire(formattedMessage);

        if (this.onTerminalEmitCallback) {
            this.onTerminalEmitCallback(formattedMessage);
        }
    }
}
