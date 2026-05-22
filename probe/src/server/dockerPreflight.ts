import { spawn } from "node:child_process";

export type DockerPreflight =
  | { status: "ready" }
  | { status: "environment_blocked"; reason: string };

export const dockerPreflightCommand = "docker info --format '{{.ServerVersion}}'";

function runPreflightCommand(command: string, args: readonly string[], timeoutMs: number) {
  return new Promise<{ code: number | null; stdout: string; stderr: string; signal: NodeJS.Signals | null }>(
    (resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ["ignore", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          child.kill("SIGTERM");
        }
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        reject(error);
      });
      child.on("close", (code, signal) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        resolve({ code, stdout: stdout.trim(), stderr: stderr.trim(), signal });
      });
    }
  );
}

/**
 * Normalizes Docker availability into an environment verdict, not an action
 * skill verdict. Callers use this before mutating actor workspaces or starting
 * Mineflayer so setup failures do not masquerade as gameplay failures.
 */
export function normalizeDockerPreflightResult(input: {
  code: number | null;
  stdout: string;
  stderr: string;
  signal: NodeJS.Signals | null;
}): DockerPreflight {
  if (input.code === 0) {
    return { status: "ready" };
  }

  const reason = [
    input.signal ? `signal=${input.signal}` : `exit_code=${input.code ?? "unknown"}`,
    input.stderr,
    input.stdout
  ].filter(Boolean).join("\n");

  return {
    status: "environment_blocked",
    reason: reason || "docker is unavailable"
  };
}

function formatError(error: unknown): string {
  if (error instanceof AggregateError) {
    return error.errors.map((entry) => formatError(entry)).join("\n");
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function checkDockerPreflight(): Promise<DockerPreflight> {
  try {
    const result = await runPreflightCommand("docker", ["info", "--format", "{{.ServerVersion}}"], 5_000);
    return normalizeDockerPreflightResult(result);
  } catch (error) {
    return {
      status: "environment_blocked",
      reason: formatError(error)
    };
  }
}
