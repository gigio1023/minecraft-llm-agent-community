import { runMutualProbe } from "./runMutualProbe.js";

// Mutual probes can fail in the run and again during Docker/Bot cleanup. Keep
// nested errors visible instead of collapsing them to one message.
function formatError(error: unknown): string {
  if (error instanceof AggregateError) {
    const nested = error.errors.map((entry) => formatError(entry)).join("\n");
    return `${error.message}\n${nested}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function main() {
  try {
    const { transcriptPath, cleanupError } = await runMutualProbe();

    if (cleanupError) {
      console.warn(formatError(cleanupError));
    }

    console.log(transcriptPath);
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
  }
}

void main();
