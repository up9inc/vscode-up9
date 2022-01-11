import axios from 'axios';
import { Workspace, TestResponse, Endpoint } from '../models/up9';
import {raiseForBadResponse} from'../utils';

const LATEST_REVISION_CACHE_TTL_MS = 120 * 1000; //2 minutes

export class UP9ApiProvider {
    private readonly _trccUrl: string;
    private _latestRevisionCache: {[key: string]: {id: string, cachedAt: number}}

    constructor(up9Env: string, protocol: string) {
        this._trccUrl = `${protocol}://trcc.${up9Env}`;
        this._latestRevisionCache = {};
    }

    public getWorkspaces = async (token: string): Promise<string[]> => {
        const response = await axios.get<Workspace[]>(`${this._trccUrl}/models/`, {headers: {'Authorization': `Bearer ${token}`}})
        raiseForBadResponse(response);
        return response.data.map(workspace => workspace.modelId);
    }

    public getWorkspaceEndpoints = async (workspaceId: string, token: string): Promise<Endpoint[]> => {
        const latestRevision = await this.getLatestRevisionForWorkspace(workspaceId, token);

        const response = await axios.get<Endpoint[]>(`${this._trccUrl}/models/${workspaceId}/${latestRevision}/all/endpoints`, {headers: {'Authorization': `Bearer ${token}`}})
        raiseForBadResponse(response);
        return response.data;
    }

    public getTestsForSpan = async(workspaceId: string, spanGuid: string, token: string): Promise<TestResponse> => {
        const latestRevision = await this.getLatestRevisionForWorkspace(workspaceId, token);

        const url = `${this._trccUrl}/models/${workspaceId}/${latestRevision}/all/tests?base64Code=false&addTestData=true`;
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
        const latestRevision = await this.getLatestRevisionForWorkspace(workspaceId, token);
        const response = await axios.get<any>(`${this._trccUrl}/models/${workspaceId}/${latestRevision}/all/swagger`, {headers: {'Authorization': `Bearer ${token}`}});
        raiseForBadResponse(response);
        return response.data;
    }

    public getSpans = async(workspaceId: string, spanId: string, token: string): Promise<any> => {
        const latestRevision = await this.getLatestRevisionForWorkspace(workspaceId, token);
        const response = await axios.get<any>(`${this._trccUrl}/models/${workspaceId}/${latestRevision}/all/dataDependency`, {headers: {'Authorization': `Bearer ${token}`}});
        raiseForBadResponse(response);
        return response.data;
    }

    public checkEnv = async(protocol: string, env: string): Promise<boolean> => {
        const response = await axios.get<any>(`${protocol}://trcc.${env}/apidocs`);
        raiseForBadResponse(response);
        return true;
    }

    private getLatestRevisionForWorkspace = async(workspaceId: string, token: string): Promise<string> => {
        const cachedRevision = this._latestRevisionCache[workspaceId];
        if (cachedRevision) {
            const cacheAge = (+new Date()) - cachedRevision.cachedAt;
            // ignore cache and remove key if expired
            if (cacheAge > LATEST_REVISION_CACHE_TTL_MS) {
                this._latestRevisionCache[workspaceId] = null;
            } else {
                return cachedRevision.id;
            }
        }

        const response = await axios.get<any>(`${this._trccUrl}/models/${workspaceId}/revisions`, {headers: {'Authorization': `Bearer ${token}`}});
        raiseForBadResponse(response);
        const latestRevision = response.data[0];

        //cache the result
        this._latestRevisionCache[workspaceId] = {
            id: latestRevision.id,
            cachedAt: (+new Date())
        };

        return latestRevision.id;
    }
}