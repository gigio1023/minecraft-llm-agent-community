import { promises as fs } from "node:fs";
import path from "node:path";

import { runProbe } from "../runProbe.js";
import { runDirectGeneratedObjective } from "./directGeneratedRunner.js";
import { evaluateObjectiveTranscript } from "./evaluator.js";
import { getObjectiveDefinition, listObjectiveDefinitions } from "./registry.js";

type CliOptions = {
  objectiveId: string;
  actorId?: string;
  transcriptPath?: string;
  reportPath?: string;
  provider?: "deterministic" | "openai-codex";
  mode?: "runtime" | "direct-generated";
  maxActions?: number;
  observeMs?: number;
  evidenceScope?: "current_run" | "historical_transcript";
};

function parsePositiveInteger(value: string, flag: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }

  return parsed;
}

function parseArgs(argv: readonly string[]): CliOptions {
  const options: CliOptions = {
    objectiveId: "collect_current_run_oak_log_1",
    evidenceScope: "current_run"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      index += 1;
      return value;
    };

    switch (arg) {
      case "--objective":
        options.objectiveId = next();
        break;
      case "--actor":
        options.actorId = next();
        break;
      case "--transcript":
        options.transcriptPath = next();
        break;
      case "--report":
        options.reportPath = next();
        break;
      case "--provider": {
        const provider = next();
        if (provider !== "deterministic" && provider !== "openai-codex") {
          throw new Error("--provider must be deterministic or openai-codex");
        }
        options.provider = provider;
        break;
      }
      case "--mode": {
        const mode = next();
        if (mode !== "runtime" && mode !== "direct-generated") {
          throw new Error("--mode must be runtime or direct-generated");
        }
        options.mode = mode;
        break;
      }
      case "--max-actions":
        options.maxActions = parsePositiveInteger(next(), "--max-actions");
        break;
      case "--observe-ms":
        options.observeMs = parsePositiveInteger(next(), "--observe-ms");
        break;
      case "--historical":
        options.evidenceScope = "historical_transcript";
        break;
      case "--help":
        console.log([
          "Usage: bun run probe:objective -- [--objective ID] [--mode runtime|direct-generated] [--actor ACTOR] [--transcript PATH] [--provider deterministic|openai-codex] [--max-actions N] [--report PATH]",
          "",
          "Objectives:",
          ...listObjectiveDefinitions().map((objective) => `  ${objective.id} - ${objective.summary}`),
          "",
          "Without --transcript, this runs a fresh probe and evaluates its transcript."
        ].join("\n"));
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  getObjectiveDefinition(options.objectiveId);
  return options;
}

function applyRunOptions(options: CliOptions) {
  const objective = getObjectiveDefinition(options.objectiveId);
  const actorId = options.actorId ?? objective.actorId;

  process.env.PROBE_BOTS = actorId;
  process.env.ACTOR_WORKSPACE_INIT = "1";

  if (options.provider) {
    process.env.PROBE_GAMEPLAY_PROVIDER = options.provider;
  }
  if (options.maxActions !== undefined) {
    process.env.PROBE_MAX_ACTIONS = String(options.maxActions);
  }
  if (options.observeMs !== undefined) {
    process.env.PROBE_OBSERVE_MS = String(options.observeMs);
  } else {
    process.env.PROBE_OBSERVE_MS = "0";
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  let transcriptPath = options.transcriptPath;
  const mode =
    options.mode ??
    (!transcriptPath && options.objectiveId === "craft_current_run_stone_axe_1"
      ? "direct-generated"
      : "runtime");

  if (!transcriptPath && mode === "direct-generated") {
    const report = await runDirectGeneratedObjective({
      objectiveId: options.objectiveId,
      actorId: options.actorId,
      provider: options.provider,
      reportPath: options.reportPath
    });

    console.log(`objective_summary status=${report.status} objective=${report.objectiveId} scope=${report.evidenceScope}`);
    console.log(`objective_report ${report.artifactRefs.actorWorkspaceTrialPath}`);
    console.log(`objective_generated_source ${report.generated.sourcePath ?? "(none)"}`);
    console.log(`objective_verifier ${report.evidence.verifierStatus} ${report.evidence.verifierReason}`);

    if (report.status !== "passed") {
      process.exitCode = 1;
    }
    return;
  }

  if (!transcriptPath) {
    applyRunOptions(options);
    const run = await runProbe();
    transcriptPath = run.transcriptPath;
  }

  const report = await evaluateObjectiveTranscript({
    objectiveId: options.objectiveId,
    actorId: options.actorId,
    transcriptPath,
    evidenceScope: options.evidenceScope
  });
  const reportPath =
    options.reportPath ??
    path.resolve(
      process.cwd(),
      "../tmp",
      `objective-${options.objectiveId}-${Date.now()}.json`
    );

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log(`objective_summary status=${report.status} objective=${report.objectiveId} scope=${report.evidenceScope}`);
  console.log(`objective_report ${reportPath}`);
  for (const finding of report.findings) {
    console.log(`objective_${finding.kind} ${finding.status} ${finding.message}`);
  }

  if (report.status !== "passed") {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
