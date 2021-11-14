import { getStoredUP9Auth } from "../utils";
import * as vscode from 'vscode';
import { UP9Auth } from "../up9Auth";
import { UP9ApiProvider } from "../up9Api";

const terminalEscapeSequence = "00091";

export class CloudRunner {
    private context: vscode.ExtensionContext;
    private up9Auth: UP9Auth;
    private up9Api: UP9ApiProvider;
    private statusTerminal: vscode.Terminal;
    private statusTerminalEmitter: vscode.EventEmitter<string>;

    public constructor(context: vscode.ExtensionContext, code: string) {
        this.up9Auth = getStoredUP9Auth(context);
        if (this.up9Auth == null) {
            vscode.window.showErrorMessage('UP9 authentication hasn\'t been configured yet, cannot proceed.'); //TODO: give actual advice
        } else {
            this.up9Api = new UP9ApiProvider(this.up9Auth.getEnv());

            this.statusTerminalEmitter = new vscode.EventEmitter<string>();
            const terminalHandlers = {
                onDidWrite: this.statusTerminalEmitter.event,
                open: () => {},
                close: () => { /* noop*/ },
                handleInput: (_: string) => {} //seal terminal to user input
            };
            this.statusTerminal = vscode.window.createTerminal({ name: 'UP9 Test Run', pty: terminalHandlers });
            this.statusTerminal.show();
            // setInterval(() => {
            //     this.statusTerminalEmitter.fire("Sending code to UP9...\r\n\r\n");
            // }, 1500);
        
        }
    }
}