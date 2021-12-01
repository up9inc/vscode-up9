import * as childProcess from 'child_process';
import * as util from 'util';
import * as k8s from '@kubernetes/client-node';

export class K8STunnel {
    private k8sApi: k8s.CoreV1Api;
    private interval: any;
    private isStarted: boolean = false;

    private serviceInternalDnsNameToProxyPathDict: { [serviceInternalDnsName: string]: string } = {};


    public constructor() {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();

        this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    }

    public start() {
        if (this.isStarted) {
            console.warn('Attempted to start the k8s tunnel but it is already started');
            return;
        }

        this.isStarted = true;

        this.syncServices();
        this.interval = setInterval(this.syncServices, 30000);
    }

    public stop() {
        clearInterval(this.interval);
        this.isStarted = false;
    }

    private async startK8sCliProxy() {

    }

    private async syncServices() {
        const newServiceDnsDict = {};

        const services = await this.k8sApi.listServiceForAllNamespaces();
        services.response.items.forEach(service => {
            for (const port of service.spec.ports) {
                const proxyPath = `/api/v1/namespaces/${service.metadata.namespace}/services/${service.metadata.name}:${port.port}/proxy`

                newServiceDnsDict[`${service.metadata.namespace}.${service.metadata.name}.svc.cluster.local`] = proxyPath;
                newServiceDnsDict[`${service.metadata.namespace}.${service.metadata.name}`] = proxyPath;
            }

            this.serviceInternalDnsNameToProxyPathDict = newServiceDnsDict;
        });
    }
}