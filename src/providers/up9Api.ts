import axios from 'axios';
import { Workspace, TestResponse, Endpoint } from '../models/up9';
import {raiseForBadResponse} from'../utils';

export class UP9ApiProvider {
    private readonly _trccUrl: string

    constructor(up9Env: string, protocol: string) {
        this._trccUrl = `${protocol}://trcc.${up9Env}`;
    }

    public getWorkspaces = async (token: string): Promise<string[]> => {
        const response = await axios.get<Workspace[]>(`${this._trccUrl}/models/`, {headers: {'Authorization': `Bearer ${token}`}})
        raiseForBadResponse(response);
        return response.data.map(workspace => workspace.modelId);
    }

    public getWorkspaceEndpoints = async (workspaceId: string, token: string): Promise<Endpoint[]> => {
        const response = await axios.get<Endpoint[]>(`${this._trccUrl}/models/${workspaceId}/lastResults/all/endpoints`, {headers: {'Authorization': `Bearer ${token}`}})
        raiseForBadResponse(response);
        return response.data;
    }

    public getTestsForSpan = async(workspaceId: string, spanGuid: string, token: string): Promise<TestResponse> => {
        const url = `${this._trccUrl}/models/${workspaceId}/lastResults/all/tests?base64Code=false&addTestData=true`;
        const body = {spanGuids: [spanGuid], microTestsOnly: true};
        const response = await axios.post<TestResponse>(url, body, {headers: {'Authorization': `Bearer ${token}`, 'Content-Type': "application/json"}});
        raiseForBadResponse(response);
        return response.data;
    }

    public testRunSingle = async(workspaceId: string, testCode: string, token: string) => {
        const serializedCode = `data:text/plain;base64,${Buffer.from(testCode).toString('base64')}`;
        const response = await axios.post<any>(`${this._trccUrl}/agents/runSingleTest`, {model: workspaceId, code: serializedCode, isRawCode: true}, {headers: {'Authorization': `Bearer ${token}`}});
        raiseForBadResponse(response);
        return response.data;
    }

    public getSwagger = async(workspaceId: string, token: string): Promise<any> => {
        const response = await axios.get<any>(`${this._trccUrl}/models/${workspaceId}/lastResults/all/swagger`, {headers: {'Authorization': `Bearer ${token}`}});
        raiseForBadResponse(response);
        return response.data;
    }

    public getSpans = async(workspaceId: string, spanId: string, token: string): Promise<any> => {
        const response = await axios.get<any>(`${this._trccUrl}/models/${workspaceId}/lastResults/all/dataDependency`, {headers: {'Authorization': `Bearer ${token}`}});
        raiseForBadResponse(response);
        return response.data;
    }

    public checkEnv = async(protocol: string, env: string): Promise<boolean> => {
        const response = await axios.get<any>(`${protocol}://trcc.${env}/apidocs`);
        raiseForBadResponse(response);
        return true;
    }
}