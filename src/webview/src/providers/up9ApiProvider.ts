import axios, { AxiosResponse } from 'axios';
import {Workspace} from "../models/UP9ApiModels";

export class UP9ApiProvider {
    private readonly up9Env: string

    constructor(up9Env: string) {
        this.up9Env = up9Env.replace('auth.', 'trcc.'); //TODO: refactor this (will probably be easier following move to user login based auth)
    }

    public getWorkspaces = async (token: string): Promise<string[]> => {
        const response = await axios.get<Workspace[]>(`${this.up9Env}/models/`, {headers: {'Authentication': `Bearer ${token}`}})
        this.raiseForBadResponse(response);
        return response.data.map(workspace => workspace.modelId);
    }

    private raiseForBadResponse = (response: AxiosResponse): void => {
        if (response.status > 299 || response.status < 200) {
            throw {message: "error response type", response};
        }
    }
    
}