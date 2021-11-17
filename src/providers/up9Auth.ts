import axios, {Method} from 'axios';
import {raiseForBadResponse} from'./utils';

const retryMs = 5000;

export class UP9Auth {
    public lastToken: string;

    private env: string;
    private clientId: string;
    private clientSecret: string;
    private newTokenCallback: (token: string) => void;
    private errorCallback: (error: any) => void;

    private timeout: any;

    constructor(env: string, clientId: string, clientSecret: string, onNewToken: (token: string) => void, onError: (error: any) => void) {
        this.env = env;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.newTokenCallback = onNewToken;
        this.errorCallback = onError;
        this.scheduleNewTokenRequest(0, true);
    }

    public stop = () => {
        clearTimeout(this.timeout);
    };


    //TODO: replace isFirstTime with a test auth func
    public getNewToken = async (isFirstTime?: boolean): Promise <string> => {
        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', this.clientId);
            params.append('client_secret', this.clientSecret);
            const response = await axios.post(`auth.${this.env}/auth/realms/testr/protocol/openid-connect/token`, params, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
    
            if (response.status < 300 && response.status > 199) {
                this.scheduleNewTokenRequest((response.data.expires_in * 1000) / 2);
                this.newTokenCallback(response.data.access_token);
                this.lastToken = response.data.access_token;
                return response.data.access_token;
            } else {
                throw response;
            }
        } catch (err) {
            console.log(err);
            this.errorCallback(err);
            if (!isFirstTime)
                this.scheduleNewTokenRequest(retryMs);
            throw err;
        }
    };

    public makeAuthedRequest = async (url: string, method: string, headers: any, body: any): Promise<any> => {
        const response = await axios.request({
            url,
            method: method as Method,
            headers: {'Authorization': `Bearer ${this.lastToken}`, ...headers || {}},
            data: body
        });

        raiseForBadResponse(response);

        return response.data;
    }

    public getEnv = (): string => {
        return this.env;
    }

    private scheduleNewTokenRequest = (timeFromNowMs: number, isFirstTime?: boolean) => {
        this.timeout = setTimeout(() => this.getNewToken(isFirstTime), timeFromNowMs);
    };
}
