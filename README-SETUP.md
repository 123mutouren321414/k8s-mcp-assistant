# Configuración de Usuario Readonly para MCP

## 📋 Requisitos

- Minikube instalado y corriendo
- kubectl configurado
- Permisos de administrador en el cluster



Este script:
- ✅ Crea un ServiceAccount llamado `mcp-readonly-user`
- ✅ Crea un ClusterRole con permisos de **solo lectura** para pods
- ✅ Genera un kubeconfig específico en `kubeconfig-readonly.yaml`

### 2. Verificar Permisos

```bash
# Usar el kubeconfig readonly
export KUBECONFIG=$(pwd)/kubeconfig-readonly.yaml

# Probar lectura (debe funcionar)
kubectl get pods --all-namespaces
kubectl describe pod <pod-name> -n <namespace>

# Probar escritura (debe fallar)
kubectl delete pod <pod-name> -n <namespace>
# Error: pods "..." is forbidden: User "system:serviceaccount:default:mcp-readonly-user" cannot delete resource "pods"
```

### 3. Configurar el MCP

Actualiza tu configuración de Claude Desktop o como ejecutes el MCP:

```json
{
  "mcpServers": {
    "k8s-readonly": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "KUBECONFIG": "/ruta/completa/a/kubeconfig-readonly.yaml"
      }
    }
  }
}
```

## 🔐 Permisos Otorgados

El usuario `mcp-readonly-user` tiene permisos para:

- ✅ `get`, `list`, `watch` pods
- ✅ `get`, `list` namespaces
- ✅ Ver logs de pods
- ✅ Ver estado de pods
- ❌ **NO puede** crear, modificar o eliminar recursos

## 📝 Archivos Creados

- `k8s-rbac.yaml` - Definición de ServiceAccount, ClusterRole y ClusterRoleBinding
- `kubeconfig-readonly.yaml` - Kubeconfig para el usuario readonly (generado por el script)
- `setup-readonly-user.sh` - Script de instalación

## 🔄 Renovar Token (si expira)

```bash
# El token dura 10 años (87600h), pero si necesitas renovarlo:
kubectl create token mcp-readonly-user -n default --duration=87600h
# Actualiza manualmente el token en kubeconfig-readonly.yaml
```

## 🧹 Limpieza

```bash
# Eliminar todos los recursos creados
kubectl delete -f k8s-rbac.yaml
rm kubeconfig-readonly.yaml
```
