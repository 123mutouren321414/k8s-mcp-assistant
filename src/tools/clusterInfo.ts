import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function listNamespaces() {
    try {
        const { stdout } = await execAsync('kubectl get namespaces -o json');
        const data = JSON.parse(stdout);
        
        return {
            success: true,
            namespaces: data.items.map((ns: any) => ({
                name: ns.metadata.name,
                status: ns.status.phase,
                labels: ns.metadata.labels,
                age: ns.metadata.creationTimestamp
            }))
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}

export async function getClusterInfo() {
    try {
        const { stdout } = await execAsync('kubectl cluster-info');
        
        return {
            success: true,
            info: stdout
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}

export async function getNodes() {
    try {
        const { stdout } = await execAsync('kubectl get nodes -o json');
        const data = JSON.parse(stdout);
        
        return {
            success: true,
            nodes: data.items.map((node: any) => ({
                name: node.metadata.name,
                status: node.status.conditions.find((c: any) => c.type === 'Ready')?.status === 'True' ? 'Ready' : 'NotReady',
                roles: Object.keys(node.metadata.labels || {})
                    .filter(label => label.startsWith('node-role.kubernetes.io/'))
                    .map(label => label.split('/')[1]),
                version: node.status.nodeInfo.kubeletVersion,
                os: node.status.nodeInfo.osImage,
                containerRuntime: node.status.nodeInfo.containerRuntimeVersion,
                capacity: {
                    cpu: node.status.capacity.cpu,
                    memory: node.status.capacity.memory,
                    pods: node.status.capacity.pods
                },
                allocatable: {
                    cpu: node.status.allocatable.cpu,
                    memory: node.status.allocatable.memory,
                    pods: node.status.allocatable.pods
                },
                age: node.metadata.creationTimestamp
            }))
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}
