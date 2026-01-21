import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function getFailedPods(namespace: string) {
    try {
        const args = ['get', 'pods', '-n', namespace, '--field-selector=status.phase!=Running,status.phase!=Succeeded', '-o', 'json'];
        const { stdout } = await execFileAsync('kubectl', args);
        const data = JSON.parse(stdout);
        
        return {
            success: true,
            failedPods: data.items.map((pod: any) => ({
                name: pod.metadata.name,
                namespace: pod.metadata.namespace,
                phase: pod.status.phase,
                reason: pod.status.reason,
                message: pod.status.message,
                containerStatuses: pod.status.containerStatuses?.map((cs: any) => ({
                    name: cs.name,
                    ready: cs.ready,
                    restartCount: cs.restartCount,
                    state: cs.state,
                    lastState: cs.lastState
                }))
            }))
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}

export async function getPendingPods(namespace: string) {
    try {
        const args = ['get', 'pods', '-n', namespace, '--field-selector=status.phase=Pending', '-o', 'json'];
        const { stdout } = await execFileAsync('kubectl', args);
        const data = JSON.parse(stdout);
        
        return {
            success: true,
            pendingPods: data.items.map((pod: any) => ({
                name: pod.metadata.name,
                namespace: pod.metadata.namespace,
                phase: pod.status.phase,
                conditions: pod.status.conditions,
                containerStatuses: pod.status.containerStatuses
            }))
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}

export async function getRestartingPods(namespace: string, threshold: number = 5) {
    try {
        const args = ['get', 'pods', '-n', namespace, '-o', 'json'];  
        const { stdout } = await execFileAsync('kubectl', args);
        const data = JSON.parse(stdout);
        
        const restartingPods = data.items.filter((pod: any) => {
            const restarts = pod.status.containerStatuses?.reduce(
                (sum: number, container: any) => sum + (container.restartCount || 0), 
                0
            ) || 0;
            return restarts > threshold;
        });
        
        return {
            success: true,
            threshold,
            restartingPods: restartingPods.map((pod: any) => ({
                name: pod.metadata.name,
                namespace: pod.metadata.namespace,
                totalRestarts: pod.status.containerStatuses?.reduce(
                    (sum: number, container: any) => sum + (container.restartCount || 0), 
                    0
                ),
                containerStatuses: pod.status.containerStatuses?.map((cs: any) => ({
                    name: cs.name,
                    restartCount: cs.restartCount,
                    lastState: cs.lastState
                }))
            }))
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}

export async function getServiceEndpoints(namespace: string, serviceName: string) {
    try {
        const svcArgs = ['get', 'svc', serviceName, '-n', namespace, '-o', 'json'];  
        const epArgs = ['get', 'endpoints', serviceName, '-n', namespace, '-o', 'json'];
        
        const [svcResult, epResult] = await Promise.all([  
            execFileAsync('kubectl', svcArgs),  
            execFileAsync('kubectl', epArgs)  
        ]);
        
        const svc = JSON.parse(svcResult.stdout);
        const endpoints = JSON.parse(epResult.stdout);
        
        return {
            success: true,
            service: {
                name: svc.metadata.name,
                type: svc.spec.type,
                clusterIP: svc.spec.clusterIP,
                ports: svc.spec.ports,
                selector: svc.spec.selector
            },
            endpoints: {
                subsets: endpoints.subsets,
                readyAddresses: endpoints.subsets?.[0]?.addresses || [],
                notReadyAddresses: endpoints.subsets?.[0]?.notReadyAddresses || []
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}
