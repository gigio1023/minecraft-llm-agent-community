/**
 * Smoke CLI for Gemini provider connectivity and basic response handling.
 *
 * @remarks Provider smoke failures are setup/auth/model-path blockers and should
 * be diagnosed separately from Mineflayer, Actor Turn, or actor behavior.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

import type { GeminiPlannerPathId } from "./config.js";
import { callGeminiLivePlanner } from "./geminiLivePlanner.js";

type SmokeReport = {
  schema: "gemini-planner-smoke-report/v1";
  ok: boolean;
  providerId: string;
  selectedPath?: string;
  model?: string;
  attemptedPaths: string[];
  errorKind?: string;
  providerInputRef?: string;
  providerOutputRef?: string;
  textLength: number;
  classification: string;
};

function parseArgs(argv: string[]) {
  const options: {
    prompt?: string;
    report?: string;
    actor?: string;
    forcePath?: GeminiPlannerPathId;
  } = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--prompt") {
      options.prompt = argv[index + 1];
      index += 1;
    } else if (arg === "--report") {
      options.report = argv[index + 1];
      index += 1;
    } else if (arg === "--actor") {
      options.actor = argv[index + 1];
      index += 1;
    } else if (arg === "--force-path") {
      const value = argv[index + 1];
      if (value === "text-genai") {
        options.forcePath = value;
      }
      index += 1;
    }
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const prompt = options.prompt ?? 'Return JSON: {"ok":true}';
  const actorId = options.actor ?? "npc_b";
  const repoRoot = path.resolve(process.cwd(), "..");
  const actorWorkspaceRootDir = path.join(repoRoot, "data/actors");
  const turnId = `gemini-smoke-${Date.now()}`;

  const result = await callGeminiLivePlanner({
    actorId,
    turnId,
    actorWorkspaceRootDir,
    prompt,
    repoRoot,
    forcePath: options.forcePath
  });

  const classification = result.errorKind
    ? `provider_blocked:${result.errorKind}`
    : result.text.length > 0
      ? "provider_ok"
      : "provider_empty";

  const report: SmokeReport = {
    schema: "gemini-planner-smoke-report/v1",
    ok: !result.errorKind && result.text.length > 0,
    providerId: result.providerId,
    selectedPath: result.selectedPath,
    model: result.model,
    attemptedPaths: result.attemptedPaths,
    errorKind: result.errorKind,
    providerInputRef: result.inputRef,
    providerOutputRef: result.outputRef,
    textLength: result.text.length,
    classification
  };

  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (options.report) {
    const reportPath = path.resolve(options.report);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, serialized, "utf8");
  }

  console.log(`gemini_smoke_classification=${classification}`);
  console.log(`gemini_smoke_ok=${report.ok}`);
  if (options.report) {
    console.log(`gemini_smoke_report=${path.resolve(options.report)}`);
  }

  process.exitCode = report.ok ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
