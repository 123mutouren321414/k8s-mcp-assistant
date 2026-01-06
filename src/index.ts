import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {z} from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getPodInfo } from "./tools/getPodInfo.js";
import { getPodLogs } from "./tools/getlogs.js";
import { getDeployments } from "./tools/getDeployments.js";
import { getServices } from "./tools/getServices.js";
import { getEvents } from "./tools/getEvents.js";
import { describeResource } from "./tools/describeResource.js";
import { getConfigMaps } from "./tools/getConfigMaps.js";
import { getIngresses } from "./tools/getIngresses.js";
import { getResourceMetrics } from "./tools/getResourceMetrics.js";
import { listNamespaces, getClusterInfo, getNodes } from "./tools/clusterInfo.js";
import { getFailedPods, getPendingPods, getRestartingPods, getServiceEndpoints } from "./tools/troubleshooting.js";
import { promises as fs } from "fs";


const WORKSPACE_ROOT = process.cwd()


const server = new McpServer(
    {
        version: "1.0.0",
        name: "k8s-read-assistant",
        websiteUrl: "https://github.com/nmosquerar/k8s-mcp"
    },
    {
        capabilities:{
            logging: {},
            tools: {},
            resources: {},
             tasks: {
                 requests: {
                     tools: { 
                        call: {} 
                    }
                     
                }
                    
                    
            }
        },
    }
);

server.registerTool(
    "k8s.app_status",
    {
        description: "Given an application name, retrieves the status of the pods",
        inputSchema:z.object(
            {
                namespace: z.string().describe("pod namespace"),
                app: z.string().describe("application label or pod name"),
            }
        ),
    },

    async (args) => {
        const results = await getPodInfo(
            args.namespace,
            args.app
        );
    return {
        content: [
          {
            type: "text", 
            text: JSON.stringify(results, null, 2),  
          },
        ],
      };

    }

)

server.registerTool(
    "k8s.pod_logs",
    {
        description: "Retrieves logs from a specific pod in Kubernetes. Useful for debugging and troubleshooting.",
        inputSchema: z.object({
            namespace: z.string().describe("pod namespace"),
            podName: z.string().describe("exact pod name"),
            tail: z.number().optional().describe("number of lines from the end (default: 100)"),
            previous: z.boolean().optional().describe("view logs from previous container (crashed)"),
            container: z.string().optional().describe("specific container name (if it has multiple)"),
            since: z.string().optional().describe("logs since X time (e.g., '5m', '1h', '2d')"),
            timestamps: z.boolean().optional().describe("include timestamps in logs"),
        }),
    },
    async (args) => {
        const results = await getPodLogs(
            args.namespace,
            args.podName,
            {
                tail: args.tail,
                previous: args.previous,
                container: args.container,
                since: args.since,
                timestamps: args.timestamps,
            }
        );
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    }
)

server.registerTool(
    "k8s.get_deployments",
    {
        description: "Lists deployments in a namespace with their status and replicas",
        inputSchema: z.object({
            namespace: z.string().describe("namespace to query"),
            labelSelector: z.string().optional().describe("filter by labels (e.g., 'app=nginx')"),
        }),
    },
    async (args) => {
        const results = await getDeployments(args.namespace, args.labelSelector);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.get_services",
    {
        description: "Lists services with their endpoints and exposed ports",
        inputSchema: z.object({
            namespace: z.string().describe("namespace to query"),
            name: z.string().optional().describe("specific service name"),
        }),
    },
    async (args) => {
        const results = await getServices(args.namespace, args.name);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.get_events",
    {
        description: "Retrieves recent cluster events for troubleshooting",
        inputSchema: z.object({
            namespace: z.string().describe("namespace to query"),
            resourceName: z.string().optional().describe("filter events by specific resource"),
            type: z.enum(["Normal", "Warning"]).optional().describe("event type"),
        }),
    },
    async (args) => {
        const results = await getEvents(args.namespace, args.resourceName, args.type);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.describe_resource",
    {
        description: "Provides detailed description of any Kubernetes resource",
        inputSchema: z.object({
            namespace: z.string().describe("resource namespace"),
            resourceType: z.enum(["pod", "deployment", "service", "configmap", "secret", "ingress", "pvc", "node"]),
            resourceName: z.string().describe("resource name"),
        }),
    },
    async (args) => {
        const results = await describeResource(args.namespace, args.resourceType, args.resourceName);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.get_configmaps",
    {
        description: "Lists ConfigMaps in a namespace",
        inputSchema: z.object({
            namespace: z.string().describe("namespace to query"),
            name: z.string().optional().describe("specific ConfigMap name"),
        }),
    },
    async (args) => {
        const results = await getConfigMaps(args.namespace, args.name);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.get_ingresses",
    {
        description: "Lists Ingresses with their rules and backends",
        inputSchema: z.object({
            namespace: z.string().describe("namespace to query"),
            hostname: z.string().optional().describe("filter by specific hostname"),
        }),
    },
    async (args) => {
        const results = await getIngresses(args.namespace, args.hostname);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.get_resource_usage",
    {
        description: "Retrieves CPU and memory usage metrics of pods (requires metrics-server)",
        inputSchema: z.object({
            namespace: z.string().describe("namespace to query"),
            podName: z.string().optional().describe("specific pod or all"),
        }),
    },
    async (args) => {
        const results = await getResourceMetrics(args.namespace, args.podName);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.list_namespaces",
    {
        description: "Lists all cluster namespaces",
        inputSchema: z.object({}),
    },
    async () => {
        const results = await listNamespaces();
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.get_cluster_info",
    {
        description: "Retrieves general cluster information",
        inputSchema: z.object({}),
    },
    async () => {
        const results = await getClusterInfo();
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.get_nodes",
    {
        description: "Lists all cluster nodes with their status and resources",
        inputSchema: z.object({}),
    },
    async () => {
        const results = await getNodes();
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.get_failed_pods",
    {
        description: "Lists pods that are not in Running or Succeeded state",
        inputSchema: z.object({
            namespace: z.string().describe("namespace to query"),
        }),
    },
    async (args) => {
        const results = await getFailedPods(args.namespace);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.get_pending_pods",
    {
        description: "Lists pods in Pending state (useful for detecting scheduling issues)",
        inputSchema: z.object({
            namespace: z.string().describe("namespace to query"),
        }),
    },
    async (args) => {
        const results = await getPendingPods(args.namespace);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.get_restarting_pods",
    {
        description: "Lists pods with many restarts (possible crashloops)",
        inputSchema: z.object({
            namespace: z.string().describe("namespace to query"),
            threshold: z.number().optional().describe("minimum number of restarts (default: 5)"),
        }),
    },
    async (args) => {
        const results = await getRestartingPods(args.namespace, args.threshold);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerTool(
    "k8s.get_service_endpoints",
    {
        description: "Retrieves a service and its endpoints to verify connectivity",
        inputSchema: z.object({
            namespace: z.string().describe("service namespace"),
            serviceName: z.string().describe("service name"),
        }),
    },
    async (args) => {
        const results = await getServiceEndpoints(args.namespace, args.serviceName);
        return {
            content: [{
                type: "text",
                text: JSON.stringify(results, null, 2),
            }],
        };
    }
);

server.registerResource(
  "README.md",  // Resource name
  "file://README.md",  // Unique URI that identifies this resource
  {
    description: "Project README file",
    mimeType: "text/markdown",  // Content MIME type
  },
  // Callback executed when AI requests to read this resource
  async (uri) => {
    const readmePath = `${WORKSPACE_ROOT}/README.md`;
    const content = await fs.readFile(readmePath, "utf8");
    
    // Return content in MCP format
    return {
      contents: [  // Note: it's "contents" (plural) in resources
        {
          uri: uri.toString(),  // Resource URI
          mimeType: "text/markdown",
          text: content,  // Actual file content
        },
      ],
    };
  }
);

async function main() {

  const transport = new StdioServerTransport();
  
  await server.connect(transport);

  console.error("MCP k8s readOnly");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);  
});