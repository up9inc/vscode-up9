import { AxiosResponse } from 'axios';
import { UP9Auth } from './up9Auth';
import * as vscode from 'vscode';
import { clientIdConfigKey, clientSecretConfigKey, defaultWorkspaceConfigKey, envConfigKey, up9ConfigSectionName } from './consts';

export const raiseForBadResponse = (response: AxiosResponse): void => {
    if (response.status > 299 || response.status < 200) {
        throw {message: "error response type", response};
    }
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

export const getDefaultWorkspace = async (): Promise<string> => {
    const up9ConfigSection = vscode.workspace.getConfiguration(up9ConfigSectionName);
    return await up9ConfigSection.get(defaultWorkspaceConfigKey, null);
}

export const indentString = (str: string, count: number) => str.replace(/^/gm, ' '.repeat(count));