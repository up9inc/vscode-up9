import * as http from 'http';
import * as open from 'open';
import * as vscode from 'vscode';
import { randomString } from '../utils';
import * as  ClientOAuth2 from 'client-oauth2';
import { authGlobalStorageKey } from '../consts';

const retryMs = 5000;
export const listenPorts = [3141, 4001, 5002, 6003, 7004, 8005, 9006, 10007];

export class UP9Auth {
    private static _instance: UP9Auth;


    private _env: string;
    private _extensionContext: vscode.ExtensionContext;

    private _token: ClientOAuth2.Token;


    public static async getInstance(up9Env: string, extensionContext: vscode.ExtensionContext): Promise<UP9Auth> {
        if (!this._instance) {
            this._instance = new UP9Auth(up9Env, extensionContext);
            await this._instance.tryToLoadStoredToken();
        }
        return this._instance;
    }

    private constructor(up9Env: string, extensionContext: vscode.ExtensionContext) {
        this._env = up9Env;
        this._extensionContext = extensionContext;
    }

    public getToken = async(): Promise<string> => {
        if (!this._token) {
            throw "not authenticated";
        }
        await this.refreshTokenIfNecessary();
        return this._token.accessToken;
    }

    public isAuthenticated = async (): Promise<boolean> => {
        if (!this._token) {
            return false;
        }
        try {
            await this.refreshTokenIfNecessary();
        } catch (err) {
            return false;
        }
        return true;
    }

    private refreshTokenIfNecessary = async(): Promise<void> => {
        if (!this._token) {
            throw "not authenticated";
        }
        if (this._token.expired()) {
            await this._token.refresh();
            await this.saveTokenToStorage();
        }
    }

    private saveTokenToStorage = async(): Promise<void> => {
        await this._extensionContext.globalState.update(authGlobalStorageKey, this._token.data);
    }

    public tryToLoadStoredToken = async(): Promise<boolean> => {
        const storedTokenData = await this._extensionContext.globalState.get(authGlobalStorageKey) as ClientOAuth2.Data;
        if (storedTokenData) {
            const up9AuthClient = this.getOAuth2Client();
            const parsedToken = up9AuthClient.createToken(storedTokenData);

            try {
                // refresh to make sure the token credentials are still valid
                await parsedToken.refresh();
                this._token = parsedToken;
            } catch (error) {
                console.warn('error refreshing stored up9 token');
            }
        }
        return null;
    };

    public startNewAuthentication = async(): Promise<void> => {
        this._token = await this.getTokenByWebApp(listenPorts, this._env);
        this.saveTokenToStorage();
    };

    public getEnv = (): string => {
        return this._env;
    }

    private getOAuth2Client = (redirectUri?: string): ClientOAuth2 => {
        const tokenHost = `https://auth.${this._env}`;
        const accessTokenUri = `${tokenHost}/auth/realms/testr/protocol/openid-connect/token`;
        const authorizationUri = `${tokenHost}/auth/realms/testr/protocol/openid-connect/auth`;

        return new ClientOAuth2({
            clientId: 'cli',
            clientSecret: undefined,
            accessTokenUri,
            authorizationUri,
            redirectUri
        });
    }

    private getTokenByWebApp = (ports: number[], up9Env: string): Promise<ClientOAuth2.Token> => {
        const TIMEOUT = 120000;
        let timeoutHandle: NodeJS.Timeout;
        let socket: any;
    
        return new Promise((resolve, reject) => {
            const port = ports.pop();
    
            if (port === undefined) {
                reject(new Error('Cannot set up local server'));
                return;
            }
    
            const redirectUri = `http://localhost:${port}/callback`;

            const up9AuthClient = this.getOAuth2Client(redirectUri);
    
            const randomState = randomString(20);
    
            const webAuthorizationUri = up9AuthClient.code.getUri({
                redirectUri,
                state: randomState
            });
    
            const httpServer = http.createServer(async (req, res) => {
                if (!req.url || !req.url.startsWith('/callback')) {
                    return;
                }
    
                try {
                    const accessToken = await up9AuthClient.code.getToken(req.url);
                    const data = accessToken.data;
                    res.writeHead(301, {
                        Location: `http://${up9Env}/CliLogin`
                    });
                    res.end();
                    resolve(accessToken);
                    clearTimeout(timeoutHandle);
                } catch (error) {
                    reject(error);
                } finally {
                    httpServer.close();
                    socket?.destroy();
                }
            });
    
            const server = httpServer.listen(port, '127.0.0.1');
    
            server.on('error', async (e: any) => {
                // Retry with other available ports
                if (e.code === 'EADDRINUSE') {
                    resolve((await this.getTokenByWebApp(ports, up9Env)));
                }
            });
    
            server.on('connection', _socket => {
                socket = _socket;
            });
    
            server.on('listening', () => {
                open(webAuthorizationUri).then(() => {
                    timeoutHandle = setTimeout(() => {
                        reject(new Error('Timed out'));
                    }, TIMEOUT);
                });
            });
        });
    }
}
