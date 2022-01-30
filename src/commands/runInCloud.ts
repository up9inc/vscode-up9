import { delay, indentString, readStoredValue } from "../utils";
import * as vscode from 'vscode';
import { UP9Auth } from "../providers/up9Auth";
import { UP9ApiProvider } from "../providers/up9Api";
import { startAuthCommandName } from "../extension";
import { defaultWorkspaceConfigKey } from "../consts";
import axios from "axios";

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

    public startTestRun = (context: vscode.ExtensionContext, code: string): Promise<void> => {
        const promise = new Promise<any>(async (resolve, reject) => {
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

            const defaultWorkspace = await readStoredValue(context, defaultWorkspaceConfigKey);
            if (!defaultWorkspace) {
                this.showSettingsError('No default workspace has been configured for test runs, please configure a default workspace in the up9 extension configuration');
                return reject(new Error("default workspace not configured"));
            }

            //TODO: reuse the same terminal (will require having only 1 simultaneous test run)
            const terminalOutputter = this.createAndShowTerminal(`Running Code in UP9 - ${this._up9Auth.getEnv()} on workspace ${defaultWorkspace}\n\r(in order to change env\workspace, please change configuration in the UP9:Code browser)\n\r`, promise);

            // terminal takes a second to properly initialize, calls to print before its ready will result in nothing being printed
            await delay(1000);

            const up9Api = new UP9ApiProvider(this._up9Auth.getEnv(), this._up9Auth.getEnvProtocol());
            try {
                const res = await up9Api.runTestCodeOnAgent(defaultWorkspace, code, token);
                if (!res.testLog) {
                    throw "Unknown error occured: received unexpected response from UP9";
                }
                const log = res.testLog + `\n${this.getLogOutputForRCA(res.rcaData)}`
                this.processTerminalOutputAndPrint(log, terminalOutputter);
                resolve(null);
            } catch (err) {
                console.error(err);                
                this.processTerminalOutputAndPrint(this.getTestRunErrorForPrinting(err), terminalOutputter);
                
                reject(err);
            }
            
        });

        return promise;
    }

    private createAndShowTerminal = (initialMessage: string, commandPromise: Promise<any>): vscode.EventEmitter<string> => {
        const statusTerminalEmitter = new vscode.EventEmitter<string>();
        let statusTerminal: vscode.Terminal;

        let isPromiseResolved = false;
        commandPromise.then(() => {
            statusTerminalEmitter.fire(`\n\rExecution completed, Press 'enter' to quit this terminal\n\r`);
            isPromiseResolved = true;
        });

        const terminalHandlers = {
            onDidWrite: statusTerminalEmitter.event,
            open: () => {this.processTerminalOutputAndPrint(initialMessage, statusTerminalEmitter);},
            close: () => { /* noop*/ },
            handleInput: (input: string) => {
                if (isPromiseResolved && input.charCodeAt(0) == 13) {
                    statusTerminal.dispose();
                }
            }
        };
        statusTerminal = vscode.window.createTerminal({ name: 'UP9 Test Run', pty: terminalHandlers });
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

    private getTestRunErrorForPrinting = (error: any): string => {
        let errorMessage: string;
        if (typeof error === 'string') {
            errorMessage = error; ``
        } else {
            if (error?.response) {
                switch (error.response?.data?.errorCode) {
                    case "noAgentAvailable":
                        errorMessage = "Test run failed: UP9 could not find a live agent associated with this workspace, try selecting a different workspace in UP9 code browser or check your agent's status";
                        break;
                    default:
                        const responseBody = JSON.stringify(error?.response?.data, null, 4).replace('\n', '\n\r');
                        errorMessage = `Test run failed: API returned error ${error.response.status} ${responseBody}`
                        break;
                }
            } else {
                if (error?.code) {
                    errorMessage = `Test run failed: Could not connect to UP9, please check your network connection (${error.message})`;
                } else {
                    errorMessage = `Test run failed: Unknown error occured ${JSON.stringify(error)}`;
                }
            }
        }
    
        return errorMessage;
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
