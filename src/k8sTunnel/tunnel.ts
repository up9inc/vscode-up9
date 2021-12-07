import * as http from 'http';
import * as childProcess from 'child_process';
import * as k8s from '@kubernetes/client-node';
import * as httpProxy from 'http-proxy';

const k8sProxyPort = 43441;
const httpProxyPort = 43442;

export class K8STunnel {

    private static _instance: K8STunnel;

    public static getInstance(): K8STunnel {
        if (!this._instance) {
            this._instance = new K8STunnel();
        }

        return this._instance;
    }


    private k8sApi: k8s.CoreV1Api;
    private interval: any;
    private isStarted: boolean = false;
    private k8sProxyProcess: childProcess.ChildProcess;
    private proxy: httpProxy;
    private httpServer: http.Server;

    private serviceInternalDnsNameToProxyPathDict: { [serviceInternalDnsName: string]: string } = {};


    private constructor() {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();

        this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    }

    public async start() {
        if (this.isStarted) {
            console.warn('Attempted to start the k8s tunnel but it is already started');
            return;
        }

        this.isStarted = true;

        await this.syncServices();
        this.interval = setInterval(this.syncServices, 30000);
        this.startK8sCliProxy();
        this.startHttpProxy();
    }

    public getProxyAddress(): string {
        return `http://localhost:${httpProxyPort}`;
    }

    private startHttpProxy() {
        this.proxy = httpProxy.createProxyServer({});

        this.httpServer = http.createServer((req, res) => {
            const url = new URL(req.url);
            const protocol = url.protocol;
            const path = url.pathname;
            const host = url.hostname;
            let port = url.port;

            if (!port) {
                port = protocol === 'https:' ? '443' : '80';
            }

            const k8sProxyRedirectHost = this.serviceInternalDnsNameToProxyPathDict[`${host}:${port}`];
            if (host.startsWith("http.bin")) {
                this.proxy.web(req, res, { target: `http://httpbin.org`, changeOrigin: true, followRedirects: true });
            }
            else if (k8sProxyRedirectHost) {
                const redirectTo = `${protocol}//localhost:${k8sProxyPort}${k8sProxyRedirectHost}${path}`;
                req.url = `${redirectTo}`;
                this.proxy.web(req, res, { target: `${protocol}//localhost:${k8sProxyPort}`, changeOrigin: true, followRedirects: true, prependPath: true });
                console.log('hi');
            } else {
                const redirectTo = `${protocol}//${host}:${port}`;
                this.proxy.web(req, res, { target: redirectTo});
            }
        });
        this.httpServer.listen(httpProxyPort);
    }

    public stop() {
        clearInterval(this.interval);
        this.isStarted = false;
        
        this.proxy.close();
        this.httpServer.close();
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
        for (const service of services.body.items) {
            for (const port of service.spec.ports) {
                const proxyPath = `/api/v1/namespaces/${service.metadata.namespace}/services/${service.metadata.name}:${port.port}/proxy`;

                newServiceDnsDict[`${service.metadata.name}.${service.metadata.namespace}.svc.cluster.local:${port.port}`] = proxyPath;
                newServiceDnsDict[`${service.metadata.name}.${service.metadata.namespace}:${port.port}`] = proxyPath;
            }

            this.serviceInternalDnsNameToProxyPathDict = newServiceDnsDict;
        }
    }
}
