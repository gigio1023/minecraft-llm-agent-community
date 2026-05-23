import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { SocialCycleRunReport } from "./types.js";
import { goalMindInputIncludesSoulAndLifeGoal } from "./types.js";
import { readJsonIfExists } from "./goalJsonStore.js";

async function auditProviderInputs(actorDir: string, inputRefs: string[]) {
  const errors: string[] = [];
  for (const ref of inputRefs) {
    const snapshot = await readJsonIfExists<{ input?: { stage?: string } & Record<string, unknown> }>(
      `${actorDir}/${ref}`
    );
    if (!snapshot?.input) {
      continue;
    }
    const stage = snapshot.input.stage;
    if (
      (stage === "goal_mind" || stage === "action_planner" || stage === "cycle_judgment") &&
      !goalMindInputIncludesSoulAndLifeGoal(snapshot.input)
    ) {
      errors.push(`Provider input ${ref} missing ActorSoul or ActorLifeGoal`);
    }
  }
  return errors;
}

export async function auditSocialCycleReport(reportPath: string): Promise<string[]> {
  const report = JSON.parse(await fs.readFile(reportPath, "utf8")) as SocialCycleRunReport;
  const errors: string[] = [];

  if (report.schema !== "social-cycle-run-report/v1") {
    errors.push("Invalid report schema");
    return errors;
  }

  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
  const actorDir = path.join(repoRoot, "data/actors", report.actor_id);

  if (report.cycles.length < 2) {
    errors.push("Expected at least 2 cycles in report");
  }

  for (const [index, cycle] of report.cycles.entries()) {
    if (!cycle.cycle_goal_ref || !cycle.action_intent_ref || !cycle.judgment_ref) {
      errors.push(`Cycle ${index + 1} missing goal, intent, or judgment artifact ref`);
    }
    if (report.runtime_status === "passed" && cycle.evidence_refs.length === 0) {
      errors.push(`Cycle ${index + 1} claims pass without evidence refs`);
    }
    const inputErrors = await auditProviderInputs(actorDir, cycle.provider_input_refs);
    errors.push(...inputErrors);
  }

  if (report.cycles.length >= 2) {
    const cycle2Inputs = report.cycles[1]?.provider_input_refs ?? [];
    let citesPrior = false;
    for (const ref of cycle2Inputs) {
      const snapshot = await readJsonIfExists<{ input?: { previous_cycle_judgments?: unknown[] } }>(
        `${actorDir}/${ref}`
      );
      if ((snapshot?.input?.previous_cycle_judgments?.length ?? 0) > 0) {
        citesPrior = true;
      }
    }
    if (!citesPrior && !report.agency_status.used_previous_judgment) {
      errors.push("Cycle 2 does not cite cycle 1 judgment in context");
    }
  }

  if (report.provider_error && report.runtime_status === "passed") {
    errors.push("Provider error reported but runtime_status is passed");
  }

  if (
    report.provider.provider_id === "openai-api" &&
    report.agency_status.builtin_goal_authority
  ) {
    errors.push("OpenAI social run used builtin goal authority");
  }

  const lifeGoal = await readJsonIfExists<{ objective?: string }>(
    `${actorDir}/goals/life/active.json`
  );
  for (const ref of report.cycles.flatMap((c) => c.provider_input_refs)) {
    const snapshot = await readJsonIfExists<{
      input?: { world_events?: Array<{ summary?: string }>; ActorLifeGoal?: { objective?: string } };
    }>(`${actorDir}/${ref}`);
    const worldEvents = snapshot?.input?.world_events ?? [];
    if (lifeGoal?.objective && worldEvents.some((event) => event.summary === lifeGoal.objective)) {
      errors.push("WorldEvent copied as LifeGoal");
    }
  }

  return errors;
}

async function main() {
  const reportPath = process.argv[2];
  if (!reportPath) {
    console.error("Usage: bun run src/runtime/goals/socialCycleReportAuditCli.ts <report.json>");
    process.exitCode = 1;
    return;
  }

  const errors = await auditSocialCycleReport(reportPath);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  console.log("social-cycle report audit passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
