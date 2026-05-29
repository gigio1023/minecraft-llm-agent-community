import type { ObjectivePlannerPathId } from "../../provider/planner/types.js";
import { runLongObjective } from "./runner.js";

function parseForcePlannerPath(raw: string | undefined): ObjectivePlannerPathId | undefined {
  if (raw === "text-genai") {
    return raw;
  }
  return undefined;
}

function parseArgs(argv: string[]) {
  const options: Record<string, string | number | undefined> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--objective") {
      options.objective = argv[index + 1];
      index += 1;
    } else if (arg === "--actor") {
      options.actor = argv[index + 1];
      index += 1;
    } else if (arg === "--provider") {
      options.provider = argv[index + 1];
      index += 1;
    } else if (arg === "--max-phases") {
      options.maxPhases = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--max-actions-per-phase") {
      options.maxActionsPerPhase = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--report") {
      options.report = argv[index + 1];
      index += 1;
    } else if (arg === "--timeout-ms") {
      options.timeoutMs = Number(argv[index + 1]);
      index += 1;
    } else if (arg === "--force-path") {
      options.forcePath = argv[index + 1];
      index += 1;
    }
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.objective) {
    throw new Error("--objective is required");
  }

  const report = await runLongObjective({
    objectiveId: String(options.objective),
    actorId: options.actor ? String(options.actor) : undefined,
    provider: options.provider ? String(options.provider) : undefined,
    maxPhases: typeof options.maxPhases === "number" ? options.maxPhases : undefined,
    maxActionsPerPhase:
      typeof options.maxActionsPerPhase === "number" ? options.maxActionsPerPhase : undefined,
    reportPath: options.report ? String(options.report) : undefined,
    timeoutMs: typeof options.timeoutMs === "number" ? options.timeoutMs : undefined,
    forcePlannerPath: parseForcePlannerPath(
      options.forcePath ? String(options.forcePath) : undefined
    )
  });

  process.exitCode = report.status === "passed" ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
