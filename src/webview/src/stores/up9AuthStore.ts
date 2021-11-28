import {action, makeObservable, observable} from "mobx";

class UP9AuthStore {
    up9Env: string;
    clientId: string;
    clientSecret: string;
    authError: string;
    isAuthConfigured: boolean; //indicates whether user intervention is necessary for authentication

    constructor() {
        makeObservable(this, {
            authError: observable,
            isAuthConfigured: observable,

            setAuthError: action,
            setIsAuthConfigured: action
        });
    }

    setAuthError(authError: string) {
        this.authError = authError;
    }

    setIsAuthConfigured(isAuthConfigured: boolean) {
        this.isAuthConfigured = isAuthConfigured;
    }
}

export const up9AuthStore = new UP9AuthStore();
