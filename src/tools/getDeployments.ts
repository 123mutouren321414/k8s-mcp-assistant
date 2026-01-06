import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getDeployments(namespace: string, labelSelector?: string) {
    try {
        let cmd = `kubectl get deployments -n ${namespace} -o json`;
        if (labelSelector) {
            cmd += ` -l ${labelSelector}`;
        }
        
        const { stdout } = await execAsync(cmd);
        const data = JSON.parse(stdout);
        
        return {
            success: true,
            deployments: data.items.map((deploy: any) => ({
                name: deploy.metadata.name,
                namespace: deploy.metadata.namespace,
                replicas: {
                    desired: deploy.spec.replicas,
                    ready: deploy.status.readyReplicas || 0,
                    available: deploy.status.availableReplicas || 0,
                    unavailable: deploy.status.unavailableReplicas || 0
                },
                images: deploy.spec.template.spec.containers.map((c: any) => c.image),
                conditions: deploy.status.conditions,
                age: deploy.metadata.creationTimestamp
            }))
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}
