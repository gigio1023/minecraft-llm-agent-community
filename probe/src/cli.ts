import { runProbe } from "./runProbe.js";

// AggregateError is common because runtime failures and cleanup failures are
// reported together; flatten it so CLI logs remain useful for artifact review.
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
    const { transcriptPath, cleanupError } = await runProbe();

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
