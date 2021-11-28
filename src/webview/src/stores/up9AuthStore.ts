import {action, makeObservable, observable} from "mobx";

class UP9AuthStore {
    authError: string;
    isAuthConfigured: boolean; //indicates whether user intervention is necessary for authentication
    username: string;

    constructor() {
        makeObservable(this, {
            authError: observable,
            isAuthConfigured: observable,
            username: observable,

            setAuthError: action,
            setIsAuthConfigured: action,
            setUsername: action
        });
    }

    setAuthError(authError: string) {
        this.authError = authError;
    }

    setIsAuthConfigured(isAuthConfigured: boolean) {
        this.isAuthConfigured = isAuthConfigured;
    }

    setUsername(username: string) {
        this.username = username;
    }
}

export const up9AuthStore = new UP9AuthStore();
