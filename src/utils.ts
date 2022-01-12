import * as crypto from 'crypto';
import { AxiosResponse } from 'axios';
import * as vscode from 'vscode';
import { up9ConfigSectionName } from './consts';

export const raiseForBadResponse = (response: AxiosResponse): void => {
    if (response.status > 299 || response.status < 200) {
        throw {message: "error response type", response};
    }
};

export const readStoredValue = (context: vscode.ExtensionContext, valueKey: string, defaultValue: any=null): any => {
    return context.globalState.get(valueKey, defaultValue);
};

export const setStoredValue = async (context: vscode.ExtensionContext, valueKey: string, newValue: any): Promise<void> => {
    return context.globalState.update(valueKey, newValue);
};

export const indentString = (str: string, count: number) => str.replace(/^/gm, ' '.repeat(count));

export const randomString = (length: number) => crypto.randomBytes(length).toString('hex');

export const delay = (ms: number): Promise<void> => {
    return new Promise( resolve => setTimeout(resolve, ms));
}