# k8s-mcp-assistant

A **read-only Kubernetes MCP (Model Context Protocol) server** to help developers quickly inspect the state of their apps in a dev cluster — without giving them full `kubectl` access.

Built for teams where only Cloud/SRE has cluster access, but developers still need answers like:
- “Why is my app in `CrashLoopBackOff`?”
- “What do the pod events say?”
- “Show me the container logs (including `--previous`)”

---

## What it does

This MCP exposes safe, **read-only tools** that fetch Kubernetes status and logs from a cluster using a restricted kubeconfig / ServiceAccount.

### Tools

- **`k8s.app_status`**
  - Shows a high-level view of an app (deploy/pods readiness, restarts, basic diagnostics)
- **`k8s.pod_logs`**
  - Fetches pod logs with practical options like `tail`, `since`, `timestamps`, `container`, and `previous`

> ⚠️ This project is intentionally **read-only**: no `apply`, no `delete`, no `exec`, no port-forward, no secret retrieval.

---

## Quickstart (local)

### 1) Clone & install
```bash
git clone https://github.com/nicolasmosquerar/k8s-mcp-assistant.git
cd k8s-mcp-assistant
npm install
npm run build


**Made with ❤️ for safer Kubernetes debugging**
