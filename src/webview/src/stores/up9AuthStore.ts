import {action, makeObservable, observable} from "mobx";

class UP9AuthStore {
    up9Env: string;
    clientId: string;
    clientSecret: string;
    token: string;
    authError: string;
    isAuthOk: boolean;
    isAuthConfigured: boolean; //indicates whether user intervention is necessary for authentication

    constructor() {
        makeObservable(this, {
            up9Env: observable,
            clientId: observable,
            clientSecret: observable,
            token: observable,
            authError: observable,
            isAuthConfigured: observable,

            setUP9Env: action,
            setClientId: action,
            setClientSecret: action,
            setToken: action,
            setAuthError: action,
            setIsAuthConfigured: action
        });
    }

    setUP9Env(up9Env: string) {
        this.up9Env = up9Env;
    }

    setClientId(clientId: string) {
        this.clientId = clientId;
    }

    setClientSecret(clientSecret: string) {
        this.clientSecret = clientSecret;
    }

    setToken(token: string) {
        this.token = token;
    }

    setAuthError(authError: string) {
        this.authError = authError;
    }

    setIsAuthConfigured(isAuthConfigured: boolean) {
        this.isAuthConfigured = isAuthConfigured;
    }
}

export const up9AuthStore = new UP9AuthStore();
