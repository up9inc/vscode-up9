export enum ApiMessageType {
    WorkspacesList = "workspaceList",
    EndpointsList = "endpointList",
    EndpointTests = "endpointTests"
}

export interface WebViewApiMessage {
    apiMessageId: string;
    messageType: ApiMessageType;
    params: any;
}