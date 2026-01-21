import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface PodInfo {
  namespace: string;
  app: string;
  podsList: string;
  podDescriptions: { [podName: string]: string };
  error?: string;
}

/**
 * Obtiene información de pods en Kubernetes
 * Ejecuta `kubectl get pods` y `kubectl describe pod` para cada pod encontrado
 * 
 * @param namespace - El namespace donde buscar los pods
 * @param app - El nombre de la aplicación o pod específico
 * @returns PodInfo con la lista de pods y sus descripciones
 */
export async function getPodInfo(
  namespace: string,
  app: string
): Promise<PodInfo> {
  const result: PodInfo = {
    namespace,
    app,
    podsList: '',
    podDescriptions: {},
  };

  try {
    // 1. Obtener lista de pods
    // Si 'app' es "*", listar todos los pods
    // Si 'app' parece ser un nombre completo de pod, usar ese nombre
    // Si no, buscar por label app=<app>
    let getPodsCommand: string[];
    
    if (app === '*' || app === 'all') {
      // Listar todos los pods del namespace
      getPodsCommand = ['get', 'pods', '-n', namespace, '-o', 'wide'];
    } else if (app.includes('-')) {
      // Probablemente es un nombre de pod completo
      getPodsCommand = ['get', 'pods', app, '-n', namespace, '-o', 'wide'];
    } else {
      // Buscar por label
      getPodsCommand = ['get', 'pods', '-n', namespace, '-l', `app=${app}`, '-o', 'wide'];
    }

    const { stdout: podsListOutput, stderr: getPodsError } = await execFileAsync('kubectl', getPodsCommand);
    
    if (getPodsError && getPodsError.trim()) {
      console.warn('Warning getting pods:', getPodsError);
    }

    result.podsList = podsListOutput.trim();

    // 2. Parsear nombres de pods de la salida (omitir la línea de encabezado)
    const podLines = podsListOutput.trim().split('\n').slice(1);
    const podNames = podLines
      .map(line => line.trim().split(/\s+/)[0])
      .filter(name => name && name.length > 0);

    // 3. Describir cada pod
    for (const podName of podNames) {
      try {
        const describeCommand = ['describe', 'pod', podName, '-n', namespace];
        const { stdout: describeOutput } = await execFileAsync('kubectl', describeCommand);
        result.podDescriptions[podName] = describeOutput.trim();
      } catch (describeError: any) {
        result.podDescriptions[podName] = `Error describing pod: ${describeError.message}`;
      }
    }

  } catch (error: any) {
    result.error = `Error executing kubectl commands: ${error.message}`;
    console.error('Error in getPodInfo:', error);
  }

  return result;
}
