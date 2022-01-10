import {action, makeObservable, observable} from "mobx";

class UP9AuthStore {
    authError: string;
    isAuthConfigured: boolean; //indicates whether user intervention is necessary for authentication
    username: string;
    defaultWorkspace: string; //TODO: move this to separate store
    up9Env: string;

    constructor() {
        makeObservable(this, {
            authError: observable,
            isAuthConfigured: observable,
            username: observable,
            defaultWorkspace: observable,
            up9Env: observable,


            setAuthError: action,
            setIsAuthConfigured: action,
            setUsername: action,
            setDefaultWorkspace: action
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

    setDefaultWorkspace(defaultWorkspace: string) {
        this.defaultWorkspace = defaultWorkspace;
    }

    setUP9Env(up9Env: string) {
        this.up9Env = up9Env;
    }
}

export const up9AuthStore = new UP9AuthStore();
