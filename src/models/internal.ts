export enum MessageCommandType {
    Alert = "alert",
    InfoAlert = "infoAlert",
    StartAuth = "startAuth",
    ApiRequest = "apiRequest",
    ApiResponse = "apiResponse",
    AuthError = "authError",
    AuthSuccess = "authSuccess",
    SavedData = "savedData"
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