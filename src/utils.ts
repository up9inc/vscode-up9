import { AxiosResponse } from 'axios';
import { UP9Auth } from './up9Auth';
import * as vscode from 'vscode';
import { clientIdConfigKey, clientSecretConfigKey, envConfigKey, up9ConfigSectionName } from './consts';

export const raiseForBadResponse = (response: AxiosResponse): void => {
    if (response.status > 299 || response.status < 200) {
        throw {message: "error response type", response};
    }
}

export const getStoredUP9Auth = (context: vscode.ExtensionContext): UP9Auth => {
    const storedAuthCredentials = context.globalState.get("auth") as any
    if (storedAuthCredentials) {
        return new UP9Auth(storedAuthCredentials.up9Env, storedAuthCredentials.clientId, storedAuthCredentials.clientSecret, () => {}, (err) => {console.error(err)});
    }
    return null;
}

export const saveUP9CredsToConfig = async (up9Env: string, clientId: string, clientSecret: string) => {
    const up9ConfigSection = vscode.workspace.getConfiguration(up9ConfigSectionName);
    await up9ConfigSection.update(envConfigKey, up9Env, vscode.ConfigurationTarget.Global);
    await up9ConfigSection.update(clientIdConfigKey, clientId, vscode.ConfigurationTarget.Global);
    await up9ConfigSection.update(clientSecretConfigKey, clientSecret, vscode.ConfigurationTarget.Global);
}

export const readUP9CredsFromConfig = async (): Promise<any> => {
    const up9ConfigSection = vscode.workspace.getConfiguration(up9ConfigSectionName);
    const up9Env = await up9ConfigSection.get(envConfigKey, null);
    const clientId = await up9ConfigSection.get(clientIdConfigKey, null);
    const  clientSecret = await up9ConfigSection.get(clientSecretConfigKey, null);

    return {
        up9Env,
        clientId,
        clientSecret
    };
};
