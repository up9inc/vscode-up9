import * as k8s from '@kubernetes/client-node';

export class K8SProvider {

    private _kubeConfig: k8s.KubeConfig;
    private _coreClient: k8s.CoreV1Api;

    public constructor() {
        this._kubeConfig = new k8s.KubeConfig();
        this._kubeConfig.loadFromDefault();

        this._coreClient = this._kubeConfig.makeApiClient(k8s.CoreV1Api);
    }


}