export interface Workspace {
    modelId: string;
}

export interface Test {
    code: string;
    data: any[];
    id: string;
    tag: string;
    testName: string;
    variantDisplayName: string;
}

export interface TestResponse {
    headerCode: string;
    tests: Test[];
}

export interface Endpoint {
    method: string;
    path: string;
    service: string;
    uuid: string;
}
