import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {z} from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getPodInfo } from "./tools/getPodInfo.js";
import { getPodLogs } from "./tools/getlogs.js";
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
        description: "dada un nombre de aplicacion, busca el estado de los pods",
        inputSchema:z.object(
            {
                namespace: z.string().describe("namespace del pod"),
                app: z.string().describe("application label o pod name"),
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
        description: "Obtiene los logs de un pod específico en Kubernetes. Útil para debugging y troubleshooting.",
        inputSchema: z.object({
            namespace: z.string().describe("namespace del pod"),
            podName: z.string().describe("nombre exacto del pod"),
            tail: z.number().optional().describe("número de líneas desde el final (default: 100)"),
            previous: z.boolean().optional().describe("ver logs del contenedor anterior (crashed)"),
            container: z.string().optional().describe("nombre del contenedor específico (si tiene múltiples)"),
            since: z.string().optional().describe("logs desde hace X tiempo (e.g., '5m', '1h', '2d')"),
            timestamps: z.boolean().optional().describe("incluir timestamps en los logs"),
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

server.registerResource(
  "README.md",  // Nombre del recurso
  "file://README.md",  // URI única que identifica este recurso
  {
    description: "Archivo README del proyecto",
    mimeType: "text/markdown",  // Tipo MIME del contenido
  },
  // Callback que se ejecuta cuando la IA pide leer este recurso
  async (uri) => {
    const readmePath = `${WORKSPACE_ROOT}/README.md`;
    const content = await fs.readFile(readmePath, "utf8");
    
    // Retornar el contenido en formato MCP
    return {
      contents: [  // Nota: es "contents" (plural) en resources
        {
          uri: uri.toString(),  // La URI del recurso
          mimeType: "text/markdown",
          text: content,  // El contenido real del archivo
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