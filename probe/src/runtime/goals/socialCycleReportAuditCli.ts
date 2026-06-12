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

type WorldScanEvidenceSummary = {
  inspectedRefCount: number;
  scanRefs: string[];
  counts: Record<string, number>;
  nonExhaustiveRefCount: number;
  truncatedRefCount: number;
  missingMetadataRefCount: number;
};

export type PlanBeadAuditCheckStatus =
  | "DONE"
  | "PARTIAL"
  | "NOT_DONE"
  | "UNVERIFIABLE";

export type PlanBeadAuditCheck = {
  subject: "ready_front" | "operation_result" | "cycle_selection";
  status: PlanBeadAuditCheckStatus;
  reason: string;
  cycle_id?: string;
  bead_id?: string;
  ref?: string;
  evidence_refs: string[];
};

export type PlanBeadAuditArtifact = {
  schema: "plan-bead-audit/v1";
  actor_id: string;
  report_ref: string;
  checked_at: string;
  status: "passed" | "failed";
  errors: string[];
  summary: {
    ready_front_count: number;
    operation_result_count: number;
    accepted_operation_count: number;
    rejected_operation_count: number;
    selected_cycle_count: number;
  };
  checks: PlanBeadAuditCheck[];
};

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
  if (report.server?.world_scenario?.manifest_ref) {
    refs.push(report.server.world_scenario.manifest_ref);
  }
  if (report.server?.world_scenario?.validation_ref) {
    refs.push(report.server.world_scenario.validation_ref);
  }
  for (const cycle of report.cycles) {
    refs.push(cycle.cycle_goal_ref, cycle.action_ref, cycle.judgment_ref);
    if (cycle.plan_bead_packet_ref) {
      refs.push(cycle.plan_bead_packet_ref);
    }
    refs.push(...(cycle.plan_bead_operation_result_refs ?? []));
    refs.push(...cycle.provider_input_refs);
    refs.push(...cycle.provider_output_refs);
    refs.push(...cycle.evidence_refs);
    for (const attempt of cycle.action_attempts ?? []) {
      refs.push(...(attempt.plan_bead_operation_result_refs ?? []));
    }
  }
  refs.push(...(report.plan_bead_ready_fronts ?? []).map((front) => front.ref));
  refs.push(...(report.plan_bead_operation_results ?? []).map((result) => result.ref));
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

async function auditRequiredActorWorkspaceRef(input: {
  actorDir: string;
  errors: string[];
  label: string;
  ref: unknown;
}) {
  if (typeof input.ref !== "string" || input.ref.length === 0) {
    input.errors.push(`Missing ${input.label} ref`);
    return;
  }

  const resolved = resolveActorRefPath(input.actorDir, input.ref);
  if (!resolved.ok) {
    input.errors.push(`Invalid ${input.label} ref ${input.ref}: ${resolved.reason}`);
    return;
  }

  if (!await pathExists(resolved.filePath)) {
    input.errors.push(`Missing ${input.label}: ${input.ref}`);
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

function isWorldScenarioSetupBlocked(report: ReportWithMetadata) {
  return report.runtime_status === "environment_blocked" &&
    report.server?.world_scenario?.setup_status === "failed";
}

async function readProviderInput(actorDir: string, ref: string) {
  const resolved = resolveActorRefPath(actorDir, ref);
  if (!resolved.ok || !await pathExists(resolved.filePath)) {
    return null;
  }
  return readJsonIfExists<{ input?: Record<string, unknown> }>(resolved.filePath);
}

async function readActorRefJson<T>(actorDir: string, ref: string) {
  const resolved = resolveActorRefPath(actorDir, ref);
  if (!resolved.ok || !await pathExists(resolved.filePath)) {
    return null;
  }
  return readJsonIfExists<T>(resolved.filePath);
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
    const planBeadPacket = snapshot.input.plan_bead_packet;
    if (isRecord(planBeadPacket)) {
      if (planBeadPacket.physical_progress_claim !== false) {
        errors.push(`Provider input ${ref} PlanBead packet claims physical progress`);
      }
      const rules = planBeadPacket.rules;
      if (!isRecord(rules) || rules.beads_are_context_not_authority !== true) {
        errors.push(`Provider input ${ref} PlanBead packet missing context-not-authority rule`);
      }
    }
    const actionSurface = snapshot.input.action_surface;
    if (isRecord(actionSurface) && "plan_bead_packet" in actionSurface) {
      errors.push(`Provider input ${ref} leaks PlanBead packet into action_surface`);
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasPositionShape(value: unknown) {
  return isRecord(value) &&
    isFiniteNumber(value.x) &&
    isFiniteNumber(value.y) &&
    isFiniteNumber(value.z);
}

function moveToPhysicalArgsStatus(args: unknown) {
  if (!isRecord(args)) {
    return "invalid_args" as const;
  }
  if (Object.keys(args).length === 0) {
    return "empty_args" as const;
  }
  if (
    hasPositionShape(args.position) ||
    hasPositionShape(args.targetPosition) ||
    hasPositionShape(args.target_position) ||
    hasPositionShape(args)
  ) {
    return "valid" as const;
  }

  const direction = typeof args.direction === "string" ? args.direction.toLowerCase() : null;
  const distance = args.distance;
  if (
    direction &&
    ["north", "south", "east", "west"].includes(direction) &&
    isFiniteNumber(distance) &&
    distance > 0 &&
    distance <= 12
  ) {
    return "valid" as const;
  }

  return "invalid_args" as const;
}

function isMoveToRuntimeAction(action: unknown): action is Record<string, unknown> & { args: unknown } {
  return isRecord(action) &&
    action.kind === "use_primitive" &&
    action.primitive_id === "move_to";
}

function runtimeActionParametersForAudit(action: Record<string, unknown>) {
  return isRecord(action.parameters) ? action.parameters : action.args;
}

function collectRuntimeActionRefs(
  cycle: SocialCycleRunReport["cycles"][number]
) {
  const refs = new Set<string>();
  if (cycle.action_ref) {
    refs.add(cycle.action_ref);
  }
  for (const attempt of cycle.action_attempts ?? []) {
    if (attempt.action_ref) {
      refs.add(attempt.action_ref);
    }
  }
  return [...refs];
}

async function auditMoveToRuntimeActionContracts(input: {
  actorDir: string;
  cycle: SocialCycleRunReport["cycles"][number];
  cycleNumber: number;
  errors: string[];
}) {
  for (const ref of collectRuntimeActionRefs(input.cycle)) {
    const action = await readActorRefJson<Record<string, unknown>>(input.actorDir, ref);
    if (!isMoveToRuntimeAction(action)) {
      continue;
    }

    const status = moveToPhysicalArgsStatus(runtimeActionParametersForAudit(action));
    if (status === "empty_args") {
      input.errors.push(
        `Cycle ${input.cycleNumber} move_to action ${ref} has empty args; structured movement target args are required`
      );
    } else if (status === "invalid_args") {
      input.errors.push(
        `Cycle ${input.cycleNumber} move_to action ${ref} has invalid physical args; expected position/targetPosition/x,y,z or direction+distance within the movement policy`
      );
    }
  }
}

function collectWorldScanCounts(
  value: unknown,
  counts: Record<string, number>,
  depth = 0
): { found: boolean; nonExhaustive: boolean; truncated: boolean; missingMetadata: boolean } {
  const empty = {
    found: false,
    nonExhaustive: false,
    truncated: false,
    missingMetadata: false
  };
  if (depth > 8 || value === null || value === undefined) {
    return empty;
  }
  let result = { ...empty };
  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = collectWorldScanCounts(entry, counts, depth + 1);
      result = {
        found: result.found || nested.found,
        nonExhaustive: result.nonExhaustive || nested.nonExhaustive,
        truncated: result.truncated || nested.truncated,
        missingMetadata: result.missingMetadata || nested.missingMetadata
      };
    }
    return result;
  }
  if (!isRecord(value)) {
    return empty;
  }

  // Only explicit world-state schemas count as scan evidence. Compact hints such
  // as nearbyBlocks are useful debug context, but they are too weak to support
  // absence claims in an audit.
  if (value.schema === "world-state-summary/v1" || value.schema === "world-state-scan/v1") {
    const schemaLabel = value.schema === "world-state-summary/v1"
      ? "world_state_summary"
      : "world_state_scan";
    counts[schemaLabel] = (counts[schemaLabel] ?? 0) + 1;
    const blockObservations = isRecord(value.block_observations)
      ? value.block_observations
      : undefined;
    if (blockObservations) {
      counts.block_observations = (counts.block_observations ?? 0) + 1;
      counts.block_name_counts =
        (counts.block_name_counts ?? 0) +
        (Array.isArray(blockObservations.by_name) ? blockObservations.by_name.length : 0);
      counts.nearest_examples =
        (counts.nearest_examples ?? 0) +
        (Array.isArray(blockObservations.nearest) ? blockObservations.nearest.length : 0);
      if (isFiniteNumber(blockObservations.total_verified)) {
        counts.verified_blocks = (counts.verified_blocks ?? 0) + blockObservations.total_verified;
      }
      if (blockObservations.truncated === true) {
        counts.truncated_block_observations = (counts.truncated_block_observations ?? 0) + 1;
      }
    }

    const loadedCoverage = isRecord(value.loaded_coverage) ? value.loaded_coverage : undefined;
    if (loadedCoverage) {
      counts.loaded_coverage = (counts.loaded_coverage ?? 0) + 1;
      if (
        loadedCoverage.absence_claims_exhaustive !== true ||
        loadedCoverage.exhaustive === false ||
        loadedCoverage.scope === "sampled_columns_only"
      ) {
        counts.non_exhaustive_coverage = (counts.non_exhaustive_coverage ?? 0) + 1;
      }
    }

    const hasMetadata = isRecord(value.center) &&
      isFiniteNumber(value.radius) &&
      isRecord(value.vertical_range) &&
      Boolean(loadedCoverage);
    if (hasMetadata) {
      counts.scan_metadata = (counts.scan_metadata ?? 0) + 1;
    } else {
      counts.missing_scan_metadata = (counts.missing_scan_metadata ?? 0) + 1;
    }

    result = {
      found: true,
      nonExhaustive: (counts.non_exhaustive_coverage ?? 0) > 0,
      truncated: blockObservations?.truncated === true,
      missingMetadata: !hasMetadata
    };
  }

  for (const entry of Object.values(value)) {
    const nested = collectWorldScanCounts(entry, counts, depth + 1);
    result = {
      found: result.found || nested.found,
      nonExhaustive: result.nonExhaustive || nested.nonExhaustive,
      truncated: result.truncated || nested.truncated,
      missingMetadata: result.missingMetadata || nested.missingMetadata
    };
  }
  return result;
}

async function summarizeWorldScanEvidence(
  actorDir: string,
  refs: readonly string[]
): Promise<WorldScanEvidenceSummary> {
  const scanRefs: string[] = [];
  const counts: Record<string, number> = {};
  let inspectedRefCount = 0;
  let nonExhaustiveRefCount = 0;
  let truncatedRefCount = 0;
  let missingMetadataRefCount = 0;

  for (const ref of [...new Set(refs)]) {
    const artifact = await readActorRefJson<unknown>(actorDir, ref);
    if (!artifact) {
      continue;
    }
    inspectedRefCount += 1;
    const artifactCounts: Record<string, number> = {};
    const quality = collectWorldScanCounts(artifact, artifactCounts);
    if (!quality.found) {
      continue;
    }
    scanRefs.push(ref);
    if (quality.nonExhaustive) {
      nonExhaustiveRefCount += 1;
    }
    if (quality.truncated) {
      truncatedRefCount += 1;
    }
    if (quality.missingMetadata) {
      missingMetadataRefCount += 1;
    }
    for (const [key, count] of Object.entries(artifactCounts)) {
      counts[key] = (counts[key] ?? 0) + count;
    }
  }

  return {
    inspectedRefCount,
    scanRefs,
    counts,
    nonExhaustiveRefCount,
    truncatedRefCount,
    missingMetadataRefCount
  };
}

function textHasPhysicalAbsenceClaim(text: string) {
  return /(?:\bno\b|\bnone\b|\bmissing\b|\bnot found\b|\bcannot find\b|\bcan't find\b|\bcould not find\b|\bcouldn't find\b|\bfailed to find\b).{0,100}\b(?:nearby|reachable|observed|available|target|block|item|entity|position|container|station)\b/i.test(text) ||
    /\b(?:target|block|item|entity|position|container|station)\b.{0,100}(?:\bnone\b|\bmissing\b|\bnot found\b|\bunavailable\b|\babsent\b)/i.test(text);
}

function textHasPhysicalProgressClaim(text: string) {
  return /\b(?:collected|gathered|picked up|obtained|mined|dug|crafted|placed|built|deposited|withdrew|moved|arrived|reached)\b.{0,100}\b(?:block|item|entity|container|inventory|position|target|waypoint|world)\b/i.test(text) ||
    /\b(?:block|item|entity|container|inventory|position|target|waypoint|world)\b.{0,100}\b(?:collected|gathered|picked up|obtained|mined|dug|crafted|placed|built|deposited|withdrew|moved|arrived|reached)\b/i.test(text);
}

function collectJudgmentClaimKinds(judgment: unknown) {
  if (!isRecord(judgment)) {
    return [];
  }
  const texts = [
    judgment.what_happened,
    judgment.why_it_mattered_for_life_goal,
    ...(Array.isArray(judgment.next_goal_context) ? judgment.next_goal_context : []),
    ...(Array.isArray(judgment.memory_writes)
      ? judgment.memory_writes.map((write) => isRecord(write) ? write.summary : undefined)
      : [])
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  const kinds = new Set<string>();
  for (const text of texts) {
    if (textHasPhysicalAbsenceClaim(text)) {
      kinds.add("physical absence");
    }
    if (textHasPhysicalProgressClaim(text)) {
      kinds.add("physical progress");
    }
  }
  return [...kinds];
}

async function auditScanBackedPhysicalClaims(input: {
  actorDir: string;
  cycle: SocialCycleRunReport["cycles"][number];
  cycleNumber: number;
  errors: string[];
}) {
  const judgment = await readActorRefJson<Record<string, unknown>>(
    input.actorDir,
    input.cycle.judgment_ref
  );
  const claimKinds = collectJudgmentClaimKinds(judgment);
  if (claimKinds.length === 0) {
    return;
  }

  const scanSummary = await summarizeWorldScanEvidence(input.actorDir, input.cycle.evidence_refs);
  if (scanSummary.scanRefs.length === 0) {
    input.errors.push(
      `Cycle ${input.cycleNumber} judgment makes ${claimKinds.join(" and ")} claim without world-state scan evidence`
    );
  }
  if (
    claimKinds.includes("physical absence") &&
    (scanSummary.nonExhaustiveRefCount > 0 || scanSummary.truncatedRefCount > 0)
  ) {
    input.errors.push(
      `Cycle ${input.cycleNumber} judgment makes physical absence claim with non-exhaustive or truncated world-state scan evidence`
    );
  }
  if (scanSummary.missingMetadataRefCount > 0) {
    input.errors.push(
      `Cycle ${input.cycleNumber} world-state scan evidence is missing scan metadata needed for audit`
    );
  }
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

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    : [];
}

function isStrongSatisfiedPlanBeadEvidenceRef(ref: string) {
  return (
    ref.startsWith("evidence/") ||
    ref.startsWith("relationships/") ||
    ref.startsWith("reviews/applied-relationship-proposals/") ||
    ref.startsWith("settlement/")
  );
}

function isSatisfiedPlanBeadCloseOperation(operation: unknown) {
  if (!isRecord(operation) || operation.op !== "set_status") {
    return false;
  }
  const patch = operation.patch;
  return (
    isRecord(patch) &&
    patch.status === "closed" &&
    patch.close_kind === "satisfied"
  );
}

async function auditPlanBeadReport(input: {
  actorDir: string;
  report: SocialCycleRunReport;
  errors: string[];
}) {
  for (const [index, front] of (input.report.plan_bead_ready_fronts ?? []).entries()) {
    const frontNumber = index + 1;
    if (front.schema !== "plan-bead-ready-front/v1") {
      input.errors.push(`PlanBead ready front ${frontNumber} has invalid schema`);
    }
    if (front.physical_progress_claim !== false) {
      input.errors.push(`PlanBead ready front ${frontNumber} claims physical progress`);
    }
    await auditRequiredActorRef({
      actorDir: input.actorDir,
      errors: input.errors,
      cycleNumber: frontNumber,
      label: "PlanBead ready-front artifact",
      ref: front.ref
    });
    const artifact = await readActorRefJson<Record<string, unknown>>(input.actorDir, front.ref);
    if (artifact && artifact.physical_progress_claim !== false) {
      input.errors.push(`PlanBead ready-front artifact ${front.ref} claims physical progress`);
    }
  }

  if (
    input.report.plan_bead_graph_summary?.last_ready_front_ref &&
    !(input.report.plan_bead_ready_fronts ?? []).some((front) =>
      front.ref === input.report.plan_bead_graph_summary?.last_ready_front_ref
    )
  ) {
    input.errors.push("PlanBead graph summary last_ready_front_ref is not present in ready-front report entries");
  }

  for (const [index, result] of (input.report.plan_bead_operation_results ?? []).entries()) {
    const resultNumber = index + 1;
    if (result.status !== "accepted" && result.status !== "rejected") {
      input.errors.push(`PlanBead operation result ${resultNumber} has invalid status`);
    }
    await auditRequiredActorRef({
      actorDir: input.actorDir,
      errors: input.errors,
      cycleNumber: resultNumber,
      label: "PlanBead operation result artifact",
      ref: result.ref
    });
    const artifact = await readActorRefJson<Record<string, unknown>>(input.actorDir, result.ref);
    if (!artifact) {
      continue;
    }
    if (artifact.schema !== "plan-bead-operation-result/v1") {
      input.errors.push(`PlanBead operation result artifact ${result.ref} has invalid schema`);
    }
    if (artifact.status === "accepted") {
      const evidenceRefs = asStringArray(artifact.evidence_refs);
      if (evidenceRefs.length === 0) {
        input.errors.push(`Accepted PlanBead operation result ${result.ref} has no evidence refs`);
      }
      for (const ref of evidenceRefs) {
        await auditRequiredActorRef({
          actorDir: input.actorDir,
          errors: input.errors,
          cycleNumber: resultNumber,
          label: "PlanBead accepted operation evidence",
          ref
        });
      }
      if (
        isSatisfiedPlanBeadCloseOperation(artifact.operation) &&
        !evidenceRefs.some(isStrongSatisfiedPlanBeadEvidenceRef)
      ) {
        input.errors.push(
          `Accepted satisfied PlanBead close ${result.ref} lacks runtime, guarded relationship, or settlement evidence refs`
        );
      }
    }
  }

  for (const [index, cycle] of input.report.cycles.entries()) {
    const cycleNumber = index + 1;
    if ((cycle.selected_plan_bead_refs?.length ?? 0) > 0 && !cycle.plan_bead_packet_ref) {
      input.errors.push(`Cycle ${cycleNumber} selected PlanBeads without a plan_bead_packet_ref`);
    }
    if ((cycle.plan_bead_operation_result_refs?.length ?? 0) > 0) {
      for (const ref of cycle.plan_bead_operation_result_refs ?? []) {
        await auditRequiredActorRef({
          actorDir: input.actorDir,
          errors: input.errors,
          cycleNumber,
          label: "cycle PlanBead operation result",
          ref
        });
      }
    }
  }
}

async function buildReadyFrontAuditChecks(input: {
  actorDir: string | null;
  report: SocialCycleRunReport;
}) {
  const checks: PlanBeadAuditCheck[] = [];
  for (const front of input.report.plan_bead_ready_fronts ?? []) {
    const baseCheck = {
      subject: "ready_front" as const,
      cycle_id: front.cycle_id,
      ref: front.ref,
      evidence_refs: [] as string[]
    };
    if (front.physical_progress_claim !== false) {
      checks.push({
        ...baseCheck,
        status: "NOT_DONE",
        reason: "ready-front report entry claims physical progress"
      });
      continue;
    }
    if (!input.actorDir) {
      checks.push({
        ...baseCheck,
        status: "UNVERIFIABLE",
        reason: "actor workspace could not be resolved"
      });
      continue;
    }
    const artifact = await readActorRefJson<Record<string, unknown>>(
      input.actorDir,
      front.ref
    );
    if (!artifact) {
      checks.push({
        ...baseCheck,
        status: "UNVERIFIABLE",
        reason: "ready-front artifact ref is missing"
      });
      continue;
    }
    checks.push({
      ...baseCheck,
      status: artifact.physical_progress_claim === false ? "DONE" : "NOT_DONE",
      reason: artifact.physical_progress_claim === false
        ? "ready-front artifact is present and context-only"
        : "ready-front artifact claims physical progress"
    });
  }
  return checks;
}

async function buildOperationResultAuditChecks(input: {
  actorDir: string | null;
  report: SocialCycleRunReport;
}) {
  const checks: PlanBeadAuditCheck[] = [];
  for (const result of input.report.plan_bead_operation_results ?? []) {
    const baseCheck = {
      subject: "operation_result" as const,
      cycle_id: result.cycle_id,
      bead_id: result.bead_id,
      ref: result.ref,
      evidence_refs: [] as string[]
    };
    if (!input.actorDir) {
      checks.push({
        ...baseCheck,
        status: "UNVERIFIABLE",
        reason: "actor workspace could not be resolved"
      });
      continue;
    }
    const artifact = await readActorRefJson<Record<string, unknown>>(
      input.actorDir,
      result.ref
    );
    if (!artifact) {
      checks.push({
        ...baseCheck,
        status: "UNVERIFIABLE",
        reason: "operation-result artifact ref is missing"
      });
      continue;
    }
    const evidenceRefs = asStringArray(artifact.evidence_refs);
    if (artifact.status === "rejected") {
      checks.push({
        ...baseCheck,
        status: "DONE",
        reason: "invalid or blocked PlanBead operation was recorded as rejected",
        evidence_refs: evidenceRefs
      });
      continue;
    }
    if (artifact.status !== "accepted") {
      checks.push({
        ...baseCheck,
        status: "NOT_DONE",
        reason: "operation-result artifact has an invalid status",
        evidence_refs: evidenceRefs
      });
      continue;
    }
    if (
      isSatisfiedPlanBeadCloseOperation(artifact.operation) &&
      !evidenceRefs.some(isStrongSatisfiedPlanBeadEvidenceRef)
    ) {
      checks.push({
        ...baseCheck,
        status: "NOT_DONE",
        reason: "accepted satisfied PlanBead close lacks strong runtime, guarded relationship, or settlement evidence",
        evidence_refs: evidenceRefs
      });
      continue;
    }
    checks.push({
      ...baseCheck,
      status: evidenceRefs.length > 0 ? "DONE" : "NOT_DONE",
      reason: evidenceRefs.length > 0
        ? "accepted PlanBead operation cites evidence refs"
        : "accepted PlanBead operation lacks evidence refs",
      evidence_refs: evidenceRefs
    });
  }
  return checks;
}

function buildCycleSelectionAuditChecks(report: SocialCycleRunReport) {
  const checks: PlanBeadAuditCheck[] = [];
  for (const cycle of report.cycles) {
    if ((cycle.selected_plan_bead_refs?.length ?? 0) === 0) {
      continue;
    }
    checks.push({
      subject: "cycle_selection",
      cycle_id: cycle.cycle_id,
      ref: cycle.plan_bead_packet_ref,
      status: cycle.plan_bead_packet_ref ? "DONE" : "NOT_DONE",
      reason: cycle.plan_bead_packet_ref
        ? "cycle selected PlanBeads with a ready-front packet ref"
        : "cycle selected PlanBeads without a ready-front packet ref",
      evidence_refs: [...(cycle.evidence_refs ?? [])]
    });
  }
  return checks;
}

export async function buildPlanBeadAuditArtifact(
  reportPath: string,
  checkedAt = new Date().toISOString()
): Promise<PlanBeadAuditArtifact> {
  const absoluteReportPath = path.resolve(reportPath);
  const report = JSON.parse(await fs.readFile(absoluteReportPath, "utf8")) as ReportWithMetadata;
  const errors = await auditSocialCycleReport(absoluteReportPath);
  const resolvedActorDir = report.schema === "social-cycle-run-report/v1"
    ? await resolveActorDir(report, absoluteReportPath)
    : { actorDir: null };
  const actorDir = resolvedActorDir.actorDir;
  const operationResults = report.plan_bead_operation_results ?? [];
  const checks = [
    ...await buildReadyFrontAuditChecks({ actorDir, report }),
    ...await buildOperationResultAuditChecks({ actorDir, report }),
    ...buildCycleSelectionAuditChecks(report)
  ];

  return {
    schema: "plan-bead-audit/v1",
    actor_id: typeof report.actor_id === "string" ? report.actor_id : "unknown",
    report_ref: reportPath,
    checked_at: checkedAt,
    status: errors.length === 0 ? "passed" : "failed",
    errors,
    summary: {
      ready_front_count: report.plan_bead_ready_fronts?.length ?? 0,
      operation_result_count: operationResults.length,
      accepted_operation_count: operationResults.filter((result) => result.status === "accepted").length,
      rejected_operation_count: operationResults.filter((result) => result.status === "rejected").length,
      selected_cycle_count: report.cycles.filter((cycle) =>
        (cycle.selected_plan_bead_refs?.length ?? 0) > 0
      ).length
    },
    checks
  };
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

  if (report.cycles.length < 2 && !isWorldScenarioSetupBlocked(report)) {
    errors.push("Expected at least 2 cycles in report");
  }

  if (actorDir && report.server?.world_scenario?.manifest_ref) {
    await auditRequiredActorWorkspaceRef({
      actorDir,
      errors,
      label: "world scenario manifest artifact",
      ref: report.server.world_scenario.manifest_ref
    });
  }
  if (actorDir && report.server?.world_scenario?.validation_ref) {
    await auditRequiredActorWorkspaceRef({
      actorDir,
      errors,
      label: "world scenario validation artifact",
      ref: report.server.world_scenario.validation_ref
    });
  }
  if (
    isWorldScenarioSetupBlocked(report) &&
    report.server?.world_scenario?.scenario_id === "natural-safe-spawn-v1" &&
    report.server.world_scenario.validation_status === "failed" &&
    !report.server.world_scenario.validation_ref
  ) {
    errors.push("World scenario setup failed without natural spawn validation artifact ref");
  }

  for (const [index, cycle] of report.cycles.entries()) {
    const cycleNumber = index + 1;
    if (!cycle.cycle_goal_ref || !cycle.action_ref || !cycle.judgment_ref) {
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
        ref: cycle.action_ref
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
      await auditMoveToRuntimeActionContracts({
        actorDir,
        cycle,
        cycleNumber,
        errors
      });
      await auditScanBackedPhysicalClaims({
        actorDir,
        cycle,
        cycleNumber,
        errors
      });
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
    report.provider.provider_id !== "deterministic-social" &&
    report.agency_status.builtin_goal_authority
  ) {
    errors.push("Live provider social run used builtin goal authority");
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
    await auditPlanBeadReport({ actorDir, report, errors });
  }

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
  const args = process.argv.slice(2);
  const reportPath = args[0];
  if (!reportPath) {
    console.error("Usage: bun run src/runtime/goals/socialCycleReportAuditCli.ts <report.json> [--audit-report <path>]");
    process.exitCode = 1;
    return;
  }

  const auditReportIndex = args.indexOf("--audit-report");
  const auditReportPath = auditReportIndex >= 0 ? args[auditReportIndex + 1] : undefined;
  if (auditReportIndex >= 0 && !auditReportPath) {
    console.error("--audit-report requires a path");
    process.exitCode = 1;
    return;
  }
  const auditArtifact = auditReportPath
    ? await buildPlanBeadAuditArtifact(reportPath)
    : null;
  const errors = auditArtifact?.errors ?? await auditSocialCycleReport(reportPath);

  if (auditReportPath) {
    await fs.mkdir(path.dirname(path.resolve(auditReportPath)), { recursive: true });
    await fs.writeFile(
      path.resolve(auditReportPath),
      `${JSON.stringify(auditArtifact, null, 2)}\n`,
      "utf8"
    );
  }

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
