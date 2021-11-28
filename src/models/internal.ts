export enum MessageCommandType {
    Alert = "alert",
    InfoAlert = "infoAlert",
    StartAuth = "startAuth",
    ApiRequest = "apiRequest",
    ApiResponse = "apiResponse",
    AuthError = "authError",
    AuthSuccess = "authSuccess",
    AuthSignOut = "authSignOut",
}

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