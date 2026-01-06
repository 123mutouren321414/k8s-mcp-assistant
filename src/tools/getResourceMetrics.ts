import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getResourceMetrics(namespace: string, podName?: string) {
    try {
        let cmd = `kubectl top pods -n ${namespace}`;
        if (podName) {
            cmd += ` ${podName}`;
        }
        
        const { stdout } = await execAsync(cmd);
        
        // Parse the kubectl top output
        const lines = stdout.trim().split('\n');
        const headers = lines[0];
        const dataLines = lines.slice(1);
        
        const metrics = dataLines.map(line => {
            const parts = line.trim().split(/\s+/);
            return {
                name: parts[0],
                cpu: parts[1],
                memory: parts[2]
            };
        });
        
        return {
            success: true,
            namespace,
            metrics
        };
    } catch (error: any) {
        // metrics-server might not be installed
        if (error.message.includes('Metrics API not available')) {
            return {
                success: false,
                error: 'Metrics server not installed in cluster. Install with: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml'
            };
        }
        return {
            success: false,
            error: error.message
        };
    }
}
