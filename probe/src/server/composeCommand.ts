import { execFile, type ExecFileOptions } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function shouldRetryWithStandaloneCompose(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("unknown shorthand flag: 'f' in -f") ||
    message.includes("is not a docker command") ||
    message.includes("unknown command: docker compose") ||
    message.includes("No such file or directory")
  );
}

/**
 * Runs Docker Compose on hosts that expose either the v2 subcommand or the
 * standalone binary. Fixture RCON must match server readiness so current-run
 * evidence does not depend on one Docker CLI shape.
 */
export async function execDockerCompose(
  args: readonly string[],
  options: ExecFileOptions = {}
) {
  try {
    return await execFileAsync("docker", ["compose", ...args], options);
  } catch (error) {
    if (!shouldRetryWithStandaloneCompose(error)) {
      throw error;
    }

    return execFileAsync("docker-compose", [...args], options);
  }
}
