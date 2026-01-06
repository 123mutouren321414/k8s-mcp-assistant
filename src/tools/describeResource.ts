import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

type ResourceType = "pod" | "deployment" | "service" | "configmap" | "secret" | "ingress" | "pvc" | "node";

export async function describeResource(namespace: string, resourceType: ResourceType, resourceName: string) {
    try {
        let cmd = `kubectl describe ${resourceType} ${resourceName}`;
        
        // Some resources don't require namespace (like nodes)
        if (resourceType !== 'node') {
            cmd += ` -n ${namespace}`;
        }
        
        const { stdout } = await execAsync(cmd);
        
        return {
            success: true,
            resourceType,
            resourceName,
            namespace: resourceType !== 'node' ? namespace : undefined,
            description: stdout
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}
