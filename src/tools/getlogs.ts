import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface PodLogsOptions {
  tail?: number;
  previous?: boolean;
  container?: string;
  since?: string;
  timestamps?: boolean;
}

export interface PodLogsResult {
  namespace: string;
  podName: string;
  container?: string;
  logs: string;
  lineCount: number;
  truncated: boolean;
  error?: string;
}

const DEFAULT_TAIL = 100;
const MAX_BUFFER = 1024 * 1024 * 5; // 5MB

export async function getPodLogs(
  namespace: string,
  podName: string,
  options: PodLogsOptions = {}
): Promise<PodLogsResult> {
  const { tail = DEFAULT_TAIL, previous, container, since, timestamps } = options;

  const result: PodLogsResult = {
    namespace,
    podName,
    container,
    logs: "",
    lineCount: 0,
    truncated: false,
  };

  // Helper para construir args condicionales sin ifs por todos lados
  const pushIf = (cond: any, ...args: string[]) => cond && argsList.push(...args);

  const argsList: string[] = ["logs", podName, "-n", namespace, `--tail=${tail}`];
  pushIf(previous, "--previous");
  pushIf(container, "-c", container!);
  pushIf(since, `--since=${since}`);
  pushIf(timestamps, "--timestamps");

  try {
    const { stdout, stderr } = await execFileAsync("kubectl", argsList, {
      maxBuffer: MAX_BUFFER,
    });

    if (stderr?.trim()) {
      // kubectl a veces escribe warnings en stderr aunque funcione
      console.warn("kubectl logs warning:", stderr.trim());
    }

    result.logs = stdout.trim();
    result.lineCount = result.logs ? result.logs.split("\n").length : 0;

    // "truncated" es básicamente: pedí N y me devolvió N líneas (o más)
    result.truncated = result.lineCount >= tail;
  } catch (err: any) {
    result.error = `Error executing kubectl logs: ${err?.message ?? String(err)}`;
  }

  return result;
}
