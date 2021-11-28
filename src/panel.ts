import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { UP9WebviewCommunicator } from './providers/webviewCommunicator';
import { UP9Auth } from './providers/up9Auth';
import { MessageCommandType } from './models/internal';

const panelId = "up9BrowserPanel";
const panelTitle = "UP9 Code Browser";
const panelColumn = vscode.ViewColumn.Two;

export class UP9Panel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: UP9Panel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _context: vscode.ExtensionContext;
    private readonly _webviewCommunicator: UP9WebviewCommunicator;
    private _disposables: vscode.Disposable[] = [];

    public static async createOrShow(context: vscode.ExtensionContext, up9Auth: UP9Auth): Promise<void> {
        const isAuthenticated = await up9Auth.isAuthenticated();

        // If we already have a panel, show it.
        if (UP9Panel.currentPanel) {
            UP9Panel.currentPanel._panel.reveal(panelColumn);
            if (isAuthenticated) {
                UP9Panel.currentPanel._panel.webview.postMessage({command: MessageCommandType.AuthSuccess});
            }
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            panelId,
            panelTitle,
            panelColumn,
            {
                enableScripts: true,
                retainContextWhenHidden: true // very important, the react app resets and loses state without this whenever the panel is hidden
            }
        );

        UP9Panel.currentPanel = new UP9Panel(panel, context, up9Auth);

        if (isAuthenticated) { //TODO: make this occur in one place, right now its duplicated code
            panel.webview.postMessage({command: MessageCommandType.AuthSuccess});
        }
    }

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, up9Auth: UP9Auth) {
        this._panel = panel;
        this._context = context;
        this._webviewCommunicator = new UP9WebviewCommunicator(this._panel, up9Auth);

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
        this._webviewCommunicator.registerOnMessageListeners(this._disposables);
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