import { getDefaultWorkspace, indentString, readUP9CredsFromConfig } from "../utils";
import * as vscode from 'vscode';
import { UP9Auth } from "../up9Auth";
import { UP9ApiProvider } from "../up9Api";

const terminalEscapeSequence = "00091";

export class CloudRunner {
    private context: vscode.ExtensionContext;

    public constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public startTestRun = (code: string): Promise<void> => {
        return new Promise<any>(async (resolve, reject) => {
            const up9Auth = await this.getStoredUP9Auth(this.context);
            let token: string;
            if (!up9Auth) {
                vscode.window.showErrorMessage('UP9 authentication hasn\'t been configured yet, please configure the up9 extension in vscode configuration');
                return reject(Error("up9 auth not configured"));
            }

            try {
                token = await up9Auth.getNewToken();
            } catch (error) {
                console.error(error);
                vscode.window.showErrorMessage('UP9 authentication failed, check console for more details or check up9 extension configuration for errors');
                return reject(error);
            }

            const defaultWorkspace = await getDefaultWorkspace();
            if (!defaultWorkspace) {
                vscode.window.showErrorMessage('No default workspace has been configured for test runs, please configure a default workspace in the up9 extension configuration');
                return reject(new Error("default workspace not configured"));
            }

            const consoleOutput = this.createAndShowTerminal("Running test through UP9...");
            const up9Api = new UP9ApiProvider(up9Auth.getEnv());
            try {
                const res = await up9Api.testRunSingle(defaultWorkspace, indentString(code, 4), token);

                const log = res.testLog + `\n${this.getLogOutputForRCA(res.rcaData)}`
                const formattedLog = log.replace(/\n/g, "\r\n");
                
                consoleOutput.fire(formattedLog);
                resolve(null);
            } catch (err) {
                console.error(err);
                reject(err);
            }
            
        });
    }

    private createAndShowTerminal = (initialMessage: string): vscode.EventEmitter<string> => {
        const statusTerminalEmitter = new vscode.EventEmitter<string>();
        const terminalHandlers = {
            onDidWrite: statusTerminalEmitter.event,
            open: () => {statusTerminalEmitter.fire(initialMessage);},
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
    


}