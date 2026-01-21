import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function getConfigMaps(namespace: string, name?: string) {
    try {
        const args = ['get', 'configmaps', '-n', namespace, '-o', 'json'];
        if (name) {
            args[1] = 'configmap';
            args.splice(2, 0, name);
        }
        
        const { stdout } = await execFileAsync('kubectl', args); 
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
