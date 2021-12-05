import * as http from 'http';
import * as childProcess from 'child_process';
import * as k8s from '@kubernetes/client-node';
import * as httpProxy from 'http-proxy';

const k8sProxyPort = 43441;
const httpProxyPort = 43442;

export class K8STunnel {
    private k8sApi: k8s.CoreV1Api;
    private interval: any;
    private isStarted: boolean = false;
    private k8sProxyProcess: childProcess.ChildProcess;
    private proxy: httpProxy;
    private httpServer: http.Server;

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
        this.startK8sCliProxy();
    }

    private startHttpProxy() {
        this.proxy = httpProxy.createProxyServer({});

        this.httpServer = http.createServer((req, res) => {
            const url = new URL(req.url);
            const protocol = url.protocol;
            const path = url.pathname;
            const host = url.hostname;
            const port = url.port;

            const k8sProxyRedirectHost = this.serviceInternalDnsNameToProxyPathDict[`${host}:${port}`];

            if (k8sProxyRedirectHost) {
                req.url = `${protocol}://${host}:${port}/${path}`;
                console.log('req.url', req.url);
                this.proxy.web(req, res, { target: `${protocol}://${k8sProxyRedirectHost}`});
            } else {
                this.proxy.web(req, res, { target: `${protocol}://${host}:${port}`});
            }
        });
    }

    public stop() {
        clearInterval(this.interval);
        this.isStarted = false;
        
        this.proxy.close();
        try {
            this.k8sProxyProcess.kill();
        } catch (e) {
            console.warn("error killing k8s proxy process, probably already killed", e);
        }
    }

    private startK8sCliProxy() {
        this.k8sProxyProcess = childProcess.spawn('kubectl', ['proxy', `--port=${k8sProxyPort}`]);
        this.k8sProxyProcess.stderr.on('data', (data) => {
            console.error(`k8s proxy stderr: ${data}`);
            this.stop();
        });
    }

    private async syncServices() {
        const newServiceDnsDict = {};

        const services = await this.k8sApi.listServiceForAllNamespaces();
        services.response.items.forEach(service => {
            for (const port of service.spec.ports) {
                const proxyPath = `/api/v1/namespaces/${service.metadata.namespace}/services/${service.metadata.name}:${port.port}/proxy`

                newServiceDnsDict[`${service.metadata.namespace}.${service.metadata.name}.svc.cluster.local:${port.port}`] = proxyPath;
                newServiceDnsDict[`${service.metadata.namespace}.${service.metadata.name}:${port.port}`] = proxyPath;
            }

            this.serviceInternalDnsNameToProxyPathDict = newServiceDnsDict;
        });
    }
}