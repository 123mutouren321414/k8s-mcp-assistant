import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function getIngresses(namespace: string, hostname?: string) {
    try {
        const args = ['get', 'ingresses', '-n', namespace, '-o', 'json'];
        
        const { stdout } = await execFileAsync('kubectl', args);
        const data = JSON.parse(stdout);
        
        let ingresses = data.items;
        
        // Filter by hostname if provided
        if (hostname) {
            ingresses = ingresses.filter((ing: any) => 
                ing.spec.rules?.some((rule: any) => rule.host === hostname)
            );
        }
        
        return {
            success: true,
            ingresses: ingresses.map((ing: any) => ({
                name: ing.metadata.name,
                namespace: ing.metadata.namespace,
                className: ing.spec.ingressClassName,
                rules: ing.spec.rules?.map((rule: any) => ({
                    host: rule.host,
                    paths: rule.http?.paths?.map((path: any) => ({
                        path: path.path,
                        pathType: path.pathType,
                        backend: {
                            service: path.backend.service?.name,
                            port: path.backend.service?.port
                        }
                    }))
                })),
                tls: ing.spec.tls,
                loadBalancerIPs: ing.status.loadBalancer?.ingress,
                age: ing.metadata.creationTimestamp
            }))
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}
