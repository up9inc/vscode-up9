import axios, {Method} from 'axios';
import {raiseForBadResponse} from '../utils';

const retryMs = 5000;

export class UP9Auth {
    public lastToken: string;

    private env: string;
    private clientId: string;
    private clientSecret: string;
    private isExpired: boolean;

    constructor(env: string, clientId: string, clientSecret: string) {
        this.env = env;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public getToken = async (): Promise <string> => {
        if (!this.isExpired && this.lastToken) {
            return this.lastToken;
        }

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
                this.lastToken = response.data.access_token;
                // mark token as expired in half the expiration period
                setTimeout(() => this.isExpired = true, (response.data.expires_in * 1000) / 2);
                return response.data.access_token;
            } else {
                throw response;
            }
        } catch (err) {
            console.log(err);
            throw err;
        }
    };

    public getEnv = (): string => {
        return this.env;
    }
}
