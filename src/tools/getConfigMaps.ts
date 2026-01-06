import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getConfigMaps(namespace: string, name?: string) {
    try {
        let cmd = `kubectl get configmaps -n ${namespace} -o json`;
        if (name) {
            cmd = `kubectl get configmap ${name} -n ${namespace} -o json`;
        }
        
        const { stdout } = await execAsync(cmd);
        const data = JSON.parse(stdout);
        
        // Handle single configmap vs list of configmaps
        const configmaps = name ? [data] : data.items;
        
        return {
            success: true,
            configmaps: configmaps.map((cm: any) => ({
                name: cm.metadata.name,
                namespace: cm.metadata.namespace,
                data: cm.data,
                dataKeys: Object.keys(cm.data || {}),
                age: cm.metadata.creationTimestamp
            }))
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}
