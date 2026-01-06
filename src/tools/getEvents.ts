import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getEvents(namespace: string, resourceName?: string, type?: "Normal" | "Warning") {
    try {
        let cmd = `kubectl get events -n ${namespace} -o json --sort-by='.lastTimestamp'`;
        
        const { stdout } = await execAsync(cmd);
        const data = JSON.parse(stdout);
        
        let events = data.items;
        
        // Filter by resource name if provided
        if (resourceName) {
            events = events.filter((event: any) => 
                event.involvedObject.name.includes(resourceName)
            );
        }
        
        // Filter by type if provided
        if (type) {
            events = events.filter((event: any) => event.type === type);
        }
        
        return {
            success: true,
            events: events.map((event: any) => ({
                type: event.type,
                reason: event.reason,
                message: event.message,
                object: {
                    kind: event.involvedObject.kind,
                    name: event.involvedObject.name
                },
                count: event.count || 1,
                firstTime: event.firstTimestamp,
                lastTime: event.lastTimestamp
            })).reverse() // Most recent first
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message
        };
    }
}
