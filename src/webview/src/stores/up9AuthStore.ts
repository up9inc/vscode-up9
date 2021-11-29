import {action, makeObservable, observable} from "mobx";

class UP9AuthStore {
    authError: string;
    isAuthConfigured: boolean; //indicates whether user intervention is necessary for authentication
    username: string;
    defaultWorkspace: string; //TODO: move this to separate store

    constructor() {
        makeObservable(this, {
            authError: observable,
            isAuthConfigured: observable,
            username: observable,
            defaultWorkspace: observable,

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
        console.log('setting default workspace', defaultWorkspace);
        this.defaultWorkspace = defaultWorkspace;
    }
}

export const up9AuthStore = new UP9AuthStore();
