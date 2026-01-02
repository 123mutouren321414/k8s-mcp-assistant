# K8s MCP Read Assistant

> Model Context Protocol (MCP) server for read-only Kubernetes cluster access. Perfect for debugging and monitoring without the risk of accidental modifications.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-green.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 Features

- 🔍 **Pod Status & Describe** - Get detailed information about pods
- 📜 **Pod Logs** - View container logs with flexible options (tail, timestamps, previous container)
- 🔐 **Read-Only Access** - ServiceAccount with limited RBAC permissions
- 🤖 **AI-Friendly** - Designed for use with LLMs (Claude, GPT, Bedrock, etc.)
- 🚀 **Easy Setup** - Automated script for RBAC and kubeconfig generation

## 📦 Installation

### Prerequisites

- Node.js >= 18.14.1
- kubectl configured for your cluster
- Kubernetes cluster (minikube, kind, or production)
- Admin access to create ServiceAccounts and RBAC

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/k8s-mcp-read-assistant.git
   cd k8s-mcp-read-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create read-only ServiceAccount**
   ```bash
   chmod +x setup-readonly-user.sh
   ./setup-readonly-user.sh
   ```
   
   This will:
   - Create a ServiceAccount `mcp-readonly-user`
   - Apply RBAC permissions (ClusterRole + ClusterRoleBinding)
   - Generate `kubeconfig-readonly.yaml` with a 10-year token

4. **Build the project**
   ```bash
   npm run build
   ```

## 🚀 Usage

### With VS Code (GitHub Copilot)

Add to your workspace `.vscode/mcp.json` or global settings:

```json
{
  "mcp.servers": {
    "k8s-readonly": {
      "command": "node",
      "args": ["/absolute/path/to/k8s-mcp-read-assistant/dist/index.js"],
      "env": {
        "KUBECONFIG": "/absolute/path/to/k8s-mcp-read-assistant/kubeconfig-readonly.yaml"
      }
    }
  }
}
```

### With Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "k8s-readonly": {
      "command": "node",
      "args": ["/absolute/path/to/k8s-mcp-read-assistant/dist/index.js"],
      "env": {
        "KUBECONFIG": "/absolute/path/to/k8s-mcp-read-assistant/kubeconfig-readonly.yaml"
      }
    }
  }
}
```

### Manual Test

```bash
export KUBECONFIG=$(pwd)/kubeconfig-readonly.yaml
npm start
```

## 🛠️ Available Tools

### `k8s.app_status`

Get pod status and full description.

**Parameters:**
- `namespace` (string) - Kubernetes namespace
- `app` (string) - Application label, pod name, or `"all"` to list all pods

**Example:**
```typescript
// List all pods in default namespace
{ namespace: "default", app: "all" }

// Get specific pod
{ namespace: "default", app: "nginx-pod-1" }

// Find by label
{ namespace: "production", app: "my-app" }
```

### `k8s.pod_logs`

Retrieve pod logs with advanced filtering.

**Parameters:**
- `namespace` (string) - Kubernetes namespace
- `podName` (string) - Exact pod name
- `tail` (number, optional) - Number of lines from the end (default: 100)
- `previous` (boolean, optional) - View logs from crashed container
- `container` (string, optional) - Specific container name (for multi-container pods)
- `since` (string, optional) - Logs since duration (e.g., "5m", "1h", "2d")
- `timestamps` (boolean, optional) - Include timestamps

**Example:**
```typescript
// Last 20 lines with timestamps
{ 
  namespace: "default", 
  podName: "nginx-pod-1",
  tail: 20,
  timestamps: true
}

// Logs from crashed container
{
  namespace: "default",
  podName: "app-crashed",
  previous: true
}
```

## 🔐 Security & Permissions

The ServiceAccount `mcp-readonly-user` has the following permissions:

✅ **Allowed:**
- `get`, `list`, `watch` pods
- `get`, `list` namespaces
- View pod logs and status

❌ **Denied:**
- Create, update, or delete any resources
- Access to secrets values
- Exec into containers
- Port forwarding

See [k8s-rbac.yaml](k8s-rbac.yaml) for full RBAC configuration.

## 📁 Project Structure

```
k8s-mcp-read-assistant/
├── src/
│   ├── index.ts              # MCP server entry point
│   └── tools/
│       ├── getPodInfo.ts     # Pod status & describe
│       └── getlogs.ts        # Pod logs retrieval
├── k8s-rbac.yaml             # ServiceAccount & RBAC definitions
├── setup-readonly-user.sh    # Automated setup script
├── tsconfig.json             # TypeScript configuration
├── package.json              # Node.js dependencies
└── README.md                 # This file
```

## 🔄 Development

```bash
# Watch mode (auto-recompile on changes)
npm run dev

# Build
npm run build

# Run
npm start
```

## 🤝 Use Cases

- **Debugging with AI assistants** - Ask Claude/GPT about pod issues
- **Team onboarding** - Safe cluster exploration for new developers
- **Monitoring dashboards** - Feed data to LLM-powered monitoring tools
- **Incident response** - Quick log analysis without CLI context switching
- **Documentation generation** - Auto-document cluster state

## 🌐 Multi-Agent Support

This MCP works with any client that supports the Model Context Protocol:

- ✅ Claude Desktop
- ✅ VS Code (GitHub Copilot)
- ✅ Custom agents (Bedrock, LangChain, etc.)
- ✅ Multiple agents can share the same ServiceAccount

See [README-SETUP.md](README-SETUP.md) for monorepo and multi-agent setups.

## 🐛 Troubleshooting

**Error: `Unable to connect to the server: x509: certificate signed by unknown authority`**
- Solution: Run `./setup-readonly-user.sh` again to regenerate kubeconfig with proper CA certificate

**Tool not appearing in VS Code**
- Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"
- Or completely restart VS Code

**Permission denied errors**
- Ensure you ran `./setup-readonly-user.sh` with cluster admin privileges
- Verify RBAC: `kubectl describe clusterrolebinding mcp-pod-reader-binding`

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔗 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP documentation
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - TypeScript/Python SDKs

---

**Made with ❤️ for safer Kubernetes debugging**
