import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { SocialCycleRunReport } from "./types.js";
import { cycleGoalProviderInputIncludesSoulAndLifeGoal } from "./types.js";
import { readJsonIfExists } from "./goalJsonStore.js";
import { loadProbeConfig } from "../../config.js";

type ReportWithMetadata = SocialCycleRunReport & Record<string, unknown>;

type ActorRefResolution =
  | { ok: true; filePath: string }
  | { ok: false; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.length > 0);
}

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function directoryExists(dirPath: string) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function resolveMetadataPath(reportDir: string, value: string) {
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(reportDir, value);
}

function readWorkspaceMetadata(report: ReportWithMetadata, reportPath: string) {
  const reportDir = path.dirname(reportPath);
  const actorWorkspace = isRecord(report.actor_workspace) ? report.actor_workspace : undefined;
  const metadata = isRecord(report.metadata) ? report.metadata : undefined;

  const actorDir = firstString([
    report.actor_dir,
    report.actorDir,
    actorWorkspace?.actor_dir,
    actorWorkspace?.actorDir,
    metadata?.actor_dir,
    metadata?.actorDir
  ]);
  if (actorDir) {
    return {
      actorDir: resolveMetadataPath(reportDir, actorDir),
      source: "report metadata actor_dir"
    };
  }

  const workspaceRoot = firstString([
    report.actor_workspace_root,
    report.actor_workspace_root_dir,
    report.actorWorkspaceRootDir,
    typeof report.actor_workspace === "string" ? report.actor_workspace : undefined,
    actorWorkspace?.root_dir,
    actorWorkspace?.rootDir,
    actorWorkspace?.workspace_root,
    actorWorkspace?.workspaceRoot,
    metadata?.actor_workspace_root,
    metadata?.actor_workspace_root_dir,
    metadata?.actorWorkspaceRootDir,
    metadata?.workspace_root,
    metadata?.workspaceRoot
  ]);
  if (workspaceRoot) {
    return {
      actorDir: path.join(resolveMetadataPath(reportDir, workspaceRoot), report.actor_id),
      source: "report metadata actor workspace root"
    };
  }

  return null;
}

function resolveActorRefPath(actorDir: string, ref: string): ActorRefResolution {
  if (ref.trim().length === 0) {
    return { ok: false, reason: "empty ref" };
  }
  if (path.isAbsolute(ref)) {
    return { ok: false, reason: "absolute refs are not actor-workspace relative" };
  }

  const normalized = path.normalize(ref);
  if (normalized === "." || normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return { ok: false, reason: "ref escapes actor workspace" };
  }

  const filePath = path.resolve(actorDir, normalized);
  const relative = path.relative(actorDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return { ok: false, reason: "ref escapes actor workspace" };
  }

  return { ok: true, filePath };
}

function collectReportRefs(report: SocialCycleRunReport) {
  const refs: string[] = [];
  for (const cycle of report.cycles) {
    refs.push(cycle.cycle_goal_ref, cycle.action_intent_ref, cycle.judgment_ref);
    refs.push(...cycle.provider_input_refs);
    refs.push(...cycle.provider_output_refs);
    refs.push(...cycle.evidence_refs);
  }
  return refs.filter((ref) => typeof ref === "string" && ref.length > 0);
}

async function countExistingReportRefs(actorDir: string, report: SocialCycleRunReport) {
  let count = 0;
  for (const ref of collectReportRefs(report)) {
    const resolved = resolveActorRefPath(actorDir, ref);
    if (resolved.ok && await pathExists(resolved.filePath)) {
      count++;
    }
  }
  return count;
}

function addCandidate(candidates: Map<string, string>, actorDir: string, source: string) {
  candidates.set(path.resolve(actorDir), source);
}

async function inferActorDirsFromReportPath(reportPath: string, actorId: string) {
  const candidates = new Map<string, string>();
  let current = path.dirname(reportPath);

  while (true) {
    if (path.basename(current) === actorId && await directoryExists(current)) {
      addCandidate(candidates, current, "report path ancestor actor workspace");
    }

    const childActorDir = path.join(current, actorId);
    if (await directoryExists(childActorDir)) {
      addCandidate(candidates, childActorDir, "report path sibling actor workspace");
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return [...candidates.entries()].map(([actorDir, source]) => ({ actorDir, source }));
}

async function chooseActorDirCandidate(
  report: SocialCycleRunReport,
  candidates: Array<{ actorDir: string; source: string }>
) {
  if (candidates.length === 1) {
    return candidates[0]!;
  }

  const scored = await Promise.all(
    candidates.map(async (candidate) => ({
      ...candidate,
      existingRefs: await countExistingReportRefs(candidate.actorDir, report)
    }))
  );
  const bestScore = Math.max(...scored.map((candidate) => candidate.existingRefs));
  const best = scored.filter((candidate) => candidate.existingRefs === bestScore);
  if (best.length === 1 && bestScore > 0) {
    return best[0]!;
  }

  return null;
}

async function resolveActorDir(report: ReportWithMetadata, reportPath: string) {
  const metadata = readWorkspaceMetadata(report, reportPath);
  if (metadata) {
    return { actorDir: metadata.actorDir, errors: [] as string[] };
  }

  const pathCandidates = await inferActorDirsFromReportPath(reportPath, report.actor_id);
  if (pathCandidates.length > 0) {
    const candidate = await chooseActorDirCandidate(report, pathCandidates);
    if (candidate) {
      return { actorDir: candidate.actorDir, errors: [] as string[] };
    }
    return {
      actorDir: null,
      errors: [
        `Unable to safely infer actor workspace for actor ${report.actor_id}; report path matched multiple candidates`
      ]
    };
  }

  const defaultActorDir = path.join(loadProbeConfig().actorWorkspace.rootDir, report.actor_id);
  if (await countExistingReportRefs(defaultActorDir, report) > 0) {
    return { actorDir: defaultActorDir, errors: [] as string[] };
  }

  return {
    actorDir: null,
    errors: [
      `Unable to resolve actor workspace for actor ${report.actor_id}. Add actor_workspace_root metadata to the report or place the report next to its actor workspace.`
    ]
  };
}

async function auditRequiredActorRef(input: {
  actorDir: string;
  errors: string[];
  cycleNumber: number;
  label: string;
  ref: unknown;
}) {
  if (typeof input.ref !== "string" || input.ref.length === 0) {
    input.errors.push(`Cycle ${input.cycleNumber} missing ${input.label} ref`);
    return;
  }

  const resolved = resolveActorRefPath(input.actorDir, input.ref);
  if (!resolved.ok) {
    input.errors.push(`Cycle ${input.cycleNumber} invalid ${input.label} ref ${input.ref}: ${resolved.reason}`);
    return;
  }

  if (!await pathExists(resolved.filePath)) {
    input.errors.push(`Missing ${input.label} for cycle ${input.cycleNumber}: ${input.ref}`);
  }
}

async function auditRequiredActorRefList(input: {
  actorDir: string;
  errors: string[];
  cycleNumber: number;
  label: string;
  refs: unknown;
}) {
  if (!Array.isArray(input.refs) || input.refs.length === 0) {
    input.errors.push(`Cycle ${input.cycleNumber} missing ${input.label} refs`);
    return;
  }

  for (const ref of input.refs) {
    await auditRequiredActorRef({
      actorDir: input.actorDir,
      errors: input.errors,
      cycleNumber: input.cycleNumber,
      label: input.label,
      ref
    });
  }
}

function readContractOnlyMode(report: ReportWithMetadata) {
  const metadata = isRecord(report.metadata) ? report.metadata : undefined;
  const audit = isRecord(report.audit) ? report.audit : undefined;
  const mode = firstString([
    report.run_mode,
    report.mode,
    metadata?.mode,
    metadata?.run_mode,
    metadata?.runtime_mode,
    audit?.mode
  ]);
  const normalizedMode = mode?.replace(/_/g, "-").toLowerCase();
  return (
    normalizedMode === "contract-only" ||
    report.contract_only === true ||
    report.contractOnly === true ||
    metadata?.contract_only === true ||
    metadata?.contractOnly === true ||
    audit?.contract_only === true ||
    audit?.contractOnly === true
  );
}

async function readProviderInput(actorDir: string, ref: string) {
  const resolved = resolveActorRefPath(actorDir, ref);
  if (!resolved.ok || !await pathExists(resolved.filePath)) {
    return null;
  }
  return readJsonIfExists<{ input?: Record<string, unknown> }>(resolved.filePath);
}

async function auditProviderInputs(actorDir: string, inputRefs: string[]) {
  const errors: string[] = [];
  for (const ref of inputRefs) {
    const snapshot = await readProviderInput(actorDir, ref);
    if (!snapshot?.input) {
      continue;
    }
    const stage = snapshot.input.stage;
    if (
      (stage === "goal_mind" || stage === "action_planner" || stage === "cycle_judgment") &&
      !cycleGoalProviderInputIncludesSoulAndLifeGoal(snapshot.input)
    ) {
      errors.push(`Provider input ${ref} missing ActorSoul or ActorLifeGoal`);
    }
  }
  return errors;
}

function extractLifeGoalObjective(input: Record<string, unknown>) {
  const lifeGoal = input.ActorLifeGoal ?? input.actor_life_goal;
  if (!isRecord(lifeGoal)) {
    return null;
  }
  return typeof lifeGoal.objective === "string" ? lifeGoal.objective : null;
}

function extractWorldEventSummaries(input: Record<string, unknown>) {
  if (!Array.isArray(input.world_events)) {
    return [];
  }
  return input.world_events
    .map((event) => isRecord(event) && typeof event.summary === "string" ? event.summary : null)
    .filter((summary): summary is string => typeof summary === "string" && summary.length > 0);
}

function auditSettlementEvidence(report: SocialCycleRunReport, errors: string[]) {
  const contractOnly = readContractOnlyMode(report);
  if (report.runtime_status === "passed" && !contractOnly) {
    if (!report.settlement_state || !report.settlement_checklist) {
      errors.push("Passed social-cycle report is missing settlement_state or settlement_checklist");
    }
  }

  for (const result of report.postcondition_results ?? []) {
    if (
      result.status === "passed" &&
      result.checklist_item_ids.length > 0 &&
      result.evidence_refs.length === 0
    ) {
      errors.push(`Postcondition ${result.action_skill_id} passed without evidence refs`);
    }
  }

  const physicalChecklistIds = new Set([
    "crafting_table_known_or_placed",
    "starter_shelter_verified",
    "shared_storage_contribution"
  ]);
  for (const item of report.settlement_checklist?.items ?? []) {
    if (
      item.status === "satisfied" &&
      physicalChecklistIds.has(item.id) &&
      item.evidence_refs.length === 0
    ) {
      errors.push(`Settlement checklist item ${item.id} is satisfied without evidence refs`);
    }
  }
}

export async function auditSocialCycleReport(reportPath: string): Promise<string[]> {
  const absoluteReportPath = path.resolve(reportPath);
  const report = JSON.parse(await fs.readFile(absoluteReportPath, "utf8")) as ReportWithMetadata;
  const errors: string[] = [];

  if (report.schema !== "social-cycle-run-report/v1") {
    errors.push("Invalid report schema");
    return errors;
  }

  const resolvedActorDir = await resolveActorDir(report, absoluteReportPath);
  errors.push(...resolvedActorDir.errors);
  const actorDir = resolvedActorDir.actorDir;

  if (report.cycles.length < 2) {
    errors.push("Expected at least 2 cycles in report");
  }

  for (const [index, cycle] of report.cycles.entries()) {
    const cycleNumber = index + 1;
    if (!cycle.cycle_goal_ref || !cycle.action_intent_ref || !cycle.judgment_ref) {
      errors.push(`Cycle ${cycleNumber} missing goal, intent, or judgment artifact ref`);
    }
    if (report.runtime_status === "passed" && cycle.evidence_refs.length === 0) {
      errors.push(`Cycle ${cycleNumber} claims pass without evidence refs`);
    }
    if (actorDir) {
      await auditRequiredActorRef({
        actorDir,
        errors,
        cycleNumber,
        label: "cycle goal artifact",
        ref: cycle.cycle_goal_ref
      });
      await auditRequiredActorRef({
        actorDir,
        errors,
        cycleNumber,
        label: "action intent artifact",
        ref: cycle.action_intent_ref
      });
      await auditRequiredActorRef({
        actorDir,
        errors,
        cycleNumber,
        label: "judgment artifact",
        ref: cycle.judgment_ref
      });
      await auditRequiredActorRefList({
        actorDir,
        errors,
        cycleNumber,
        label: "provider input artifact",
        refs: cycle.provider_input_refs
      });
      await auditRequiredActorRefList({
        actorDir,
        errors,
        cycleNumber,
        label: "provider output artifact",
        refs: cycle.provider_output_refs
      });
      await auditRequiredActorRefList({
        actorDir,
        errors,
        cycleNumber,
        label: "evidence artifact",
        refs: cycle.evidence_refs
      });

      const inputErrors = await auditProviderInputs(actorDir, cycle.provider_input_refs);
      errors.push(...inputErrors);
    }
  }

  if (actorDir && report.cycles.length >= 2) {
    const cycle2Inputs = report.cycles[1]?.provider_input_refs ?? [];
    let citesPrior = false;
    for (const ref of cycle2Inputs) {
      const snapshot = await readProviderInput(actorDir, ref);
      const previousJudgments = snapshot?.input?.previous_cycle_judgments;
      if (Array.isArray(previousJudgments) && previousJudgments.length > 0) {
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

  if (
    report.runtime_status === "passed" &&
    report.cycles.length > 0 &&
    report.cycles.every((cycle) => cycle.verifier_status === "not_applicable") &&
    !report.agency_status.gameplay_progress_verified &&
    !readContractOnlyMode(report)
  ) {
    errors.push("runtime_status is passed without verifier-backed gameplay progress");
  }

  auditSettlementEvidence(report, errors);

  if (actorDir) {
    const lifeGoal = await readJsonIfExists<{ objective?: string }>(
      path.join(actorDir, "goals/life/active.json")
    );
    for (const ref of report.cycles.flatMap((c) => c.provider_input_refs)) {
      const snapshot = await readProviderInput(actorDir, ref);
      if (!snapshot?.input) {
        continue;
      }
      const worldEventSummaries = extractWorldEventSummaries(snapshot.input);
      const lifeGoalObjectives = [
        lifeGoal?.objective,
        extractLifeGoalObjective(snapshot.input)
      ].filter((objective): objective is string => typeof objective === "string" && objective.length > 0);
      if (
        lifeGoalObjectives.some((objective) => worldEventSummaries.includes(objective))
      ) {
        errors.push("WorldEvent copied as LifeGoal");
      }
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
