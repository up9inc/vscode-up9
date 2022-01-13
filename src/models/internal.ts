export enum MessageCommandType {
    Alert = "alert",
    InfoAlert = "infoAlert",
    StartAuth = "startAuth",
    ApiRequest = "apiRequest",
    ApiResponse = "apiResponse",
    AuthError = "authError",
    AuthSuccess = "authSuccess",
    AuthSignOut = "authSignOut",
    SetDefaultWorkspace = "setDefaultWorkspace",
    StoredData = "storedData",
    PushText = "pushText",
}

export enum ApiMessageType {
    WorkspacesList = "workspaceList",
    EndpointsList = "endpointList",
    EndpointTests = "endpointTests",
    Swagger = "swagger",
    Spans = "span",
    EnvCheck = "envCheck"
}

export interface WebViewApiMessage {
    apiMessageId: string;
    messageType: ApiMessageType;
    params: any;
}