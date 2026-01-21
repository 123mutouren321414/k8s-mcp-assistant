import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function getServices(namespace: string, name?: string) {
    try {
        const args = ['get', 'services', '-n', namespace, '-o', 'json'];
        if (name) {
            args[1] = 'service';
            args.splice(2, 0, name);
        }
        
        const { stdout } = await execFileAsync('kubectl', args); 
        const data = JSON.parse(stdout);
        
        // Handle single service vs list of services
        const services = name ? [data] : data.items;
        
        return {
            success: true,
            services: services.map((svc: any) => ({
                name: svc.metadata.name,
                namespace: svc.metadata.namespace,
                type: svc.spec.type,
                clusterIP: svc.spec.clusterIP,
                externalIP: svc.spec.externalIPs || svc.status.loadBalancer?.ingress || [],
                ports: svc.spec.ports?.map((p: any) => ({
                    name: p.name,
                    protocol: p.protocol,
                    port: p.port,
                    targetPort: p.targetPort,
                    nodePort: p.nodePort
                })),
                selector: svc.spec.selector,
                age: svc.metadata.creationTimestamp
            }))
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}
