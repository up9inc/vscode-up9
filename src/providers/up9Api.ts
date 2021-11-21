import axios from 'axios';
import { Workspace, TestResponse, Endpoint } from '../model';
import {raiseForBadResponse} from'../utils';

export class UP9ApiProvider {
    private readonly up9Env: string

    constructor(up9Env: string) {
        this.up9Env = up9Env.replace('auth.', 'trcc.'); //TODO: refactor this
    }

    public getWorkspaces = async (token: string): Promise<string[]> => {
        const response = await axios.get<Workspace[]>(`${this.up9Env}/models/`, {headers: {'Authorization': `Bearer ${token}`}})
        raiseForBadResponse(response);
        return response.data.map(workspace => workspace.modelId);
    }

    public getWorkspaceEndpoints = async (workspaceId: string, token: string): Promise<Endpoint[]> => {
        const response = await axios.get<Endpoint[]>(`${this.up9Env}/models/${workspaceId}/lastResults/all/endpoints`, {headers: {'Authorization': `Bearer ${token}`}})
        raiseForBadResponse(response);
        return response.data;
    }

    public getTestsForSpan = async(workspaceId: string, spanGuid: string, token: string): Promise<TestResponse> => {
        const url = `${this.up9Env}/models/${workspaceId}/lastResults/all/tests?base64Code=false&addTestData=true`;
        console.log('url ', url);
        const body = {spanGuids: [spanGuid]};
        console.log('body', body);
        const response = await axios.post<TestResponse>(url, body, {headers: {'Authorization': `Bearer ${token}`, 'Content-Type': "application/json"}});
        raiseForBadResponse(response);
        return response.data;
    }

    public testRunSingle = async(workspaceId: string, testCode: string, token: string) => {
        const serializedCode = `data:text/plain;base64,${Buffer.from(testCode).toString('base64')}`;
        const response = await axios.post<any>(`${this.up9Env}/agents/runSingleTest`, {model: workspaceId, code: serializedCode}, {headers: {'Authorization': `Bearer ${token}`}});
        raiseForBadResponse(response);
        return response.data;
    }
}