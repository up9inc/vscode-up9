import * as crypto from 'crypto';
import { AxiosResponse } from 'axios';
import * as vscode from 'vscode';
import { defaultWorkspaceConfigKey, up9ConfigSectionName } from './consts';

export const raiseForBadResponse = (response: AxiosResponse): void => {
    if (response.status > 299 || response.status < 200) {
        throw {message: "error response type", response};
    }
}

export const readConfigValue = async(configSubKey: string): Promise<any> => {
    const up9ConfigSection = vscode.workspace.getConfiguration(up9ConfigSectionName);
    const value = await up9ConfigSection.get(configSubKey, null);

    return value;
}

export const getDefaultWorkspace = async (): Promise<string> => {
    const up9ConfigSection = vscode.workspace.getConfiguration(up9ConfigSectionName);
    return await up9ConfigSection.get(defaultWorkspaceConfigKey, null);
}

export const indentString = (str: string, count: number) => str.replace(/^/gm, ' '.repeat(count));

export const randomString = (length: number) => crypto.randomBytes(length).toString('hex');
