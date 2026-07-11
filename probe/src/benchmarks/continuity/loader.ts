import { readFileSync } from "node:fs";

import { parseWorldScenarioId, worldScenarioIds } from "../../server/worldScenarios.js";
import {
  CAPABILITY_ALLOWED_EVIDENCE_KINDS,
  isRootSafeRelativeRef,
  resolveRootSafeArtifactRefWithoutSymlinks,
  validateCapabilityPredicate
} from "../capability/index.js";
import type {
  GoalContinuityArtifactBagV1,
  GoalContinuityCaseV1,
  GoalContinuityLifecycleEventV1,
  GoalContinuityManifestV1,
  GoalContinuityRestartObservationV1
} from "./types.js";
import {
  GOAL_CONTINUITY_ARTIFACT_BAG_SCHEMA,
  GOAL_CONTINUITY_INTERRUPTION_KINDS,
  GOAL_CONTINUITY_INTERRUPTION_SCHEDULES,
  GOAL_CONTINUITY_LIFECYCLE_EVENTS,
  GOAL_CONTINUITY_MANIFEST_SCHEMA,
  GOAL_CONTINUITY_OPEN_WORK_KINDS,
  GOAL_CONTINUITY_RESTART_OBSERVATION_SCHEMA
} from "./types.js";

type ValidationFailure = { ok: false; errors: string[] };

type ManifestValidationResult =
  | { ok: true; manifest: GoalContinuityManifestV1 }
  | ValidationFailure;

const fixtureClasses = ["natural_world", "command_fixture", "mixed"] as const;
const seedPolicyKinds = ["fixed", "declared_set", "fresh"] as const;

const manifestKeys = ["schema", "suite_id", "version", "description", "cases"] as const;
const caseKeys = [
  "case_id",
  "title",
  "top_level_goal",
  "world_scenario_id",
  "fixture_class",
  "open_work_expectation",
  "interruption",
  "restart_checkpoint",
  "observable_lifecycle_events",
  "physical_target",
  "physical_milestones",
  "allowed_physical_evidence_kinds",
  "budgets",
  "seed_policy"
] as const;
const openWorkKeys = ["kind", "pressure_notes"] as const;
const interruptionKeys = ["kind", "schedule", "at_cycle", "description"] as const;
const restartCheckpointKeys = ["required", "description"] as const;
const budgetKeys = [
  "max_cycles",
  "max_runtime_actions",
  "max_wall_time_ms",
  "max_provider_requests",
  "max_total_tokens",
  "max_estimated_cost"
] as const;
const seedPolicyKeys = ["kind", "seeds", "repeats"] as const;
const milestoneKeys = ["milestone_id", "title", "predicate", "order", "weight"] as const;

/** Keys that would prescribe PlanBead titles or intermediate goals — always rejected. */
const forbiddenPrescriptionKeys = [
  "expected_plan_bead_title",
  "expected_plan_bead_titles",
  "correct_intermediate_goals",
  "required_plan_bead_ids",
  "prescribed_bead_titles",
  "plan_bead_script",
  "required_bead_title",
  "correct_plan_bead",
  "recommended_actions",
  "action_order",
  "recipe_steps"
] as const;

const forbiddenEvidenceKinds = [
  "provider_rationale",
  "task",
  "task_text",
  "memory",
  "memory_text",
  "planbead",
  "planbead_prose",
  "video",
  "screenshot",
  "chat",
  "chat_wording"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function includesString<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value > 0;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function rejectUnknownKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  errors: string[]
) {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      errors.push(`${path}.${key} is not an allowed key`);
    }
  }
}

function rejectForbiddenPrescriptionKeys(
  record: Record<string, unknown>,
  path: string,
  errors: string[]
) {
  for (const key of Object.keys(record)) {
    if (includesString(forbiddenPrescriptionKeys, key)) {
      errors.push(
        `${path}.${key} is forbidden: continuity manifests declare pressure, not prescribed PlanBead titles or intermediate goals`
      );
    }
  }
}

function assertString(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (!nonEmptyString(record[key])) {
    errors.push(`${path}.${key} must be a non-empty string`);
  }
}

function assertBoolean(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (typeof record[key] !== "boolean") {
    errors.push(`${path}.${key} must be a boolean`);
  }
}

function assertRecord(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
): Record<string, unknown> | null {
  if (!isRecord(record[key])) {
    errors.push(`${path}.${key} must be an object`);
    return null;
  }
  return record[key];
}

function assertPositiveIntegerField(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
) {
  if (!isPositiveInteger(record[key])) {
    errors.push(`${path}.${key} must be a positive integer`);
  }
}

function assertWorldScenarioId(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
) {
  const value = record[key];
  if (!nonEmptyString(value)) {
    errors.push(`${path}.${key} must be a non-empty string`);
    return;
  }
  try {
    const parsed = parseWorldScenarioId(value);
    if (!parsed) {
      errors.push(`${path}.${key} must be a supported world scenario id`);
    }
  } catch {
    errors.push(
      `${path}.${key} '${value}' is not supported. Supported scenarios: ${worldScenarioIds.join(", ")}`
    );
  }
}

function validateBudgets(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, budgetKeys, path, errors);
  assertPositiveIntegerField(value, "max_cycles", path, errors);
  assertPositiveIntegerField(value, "max_runtime_actions", path, errors);
  assertPositiveIntegerField(value, "max_wall_time_ms", path, errors);
  if (value.max_provider_requests !== undefined) {
    assertPositiveIntegerField(value, "max_provider_requests", path, errors);
  }
  if (value.max_total_tokens !== undefined) {
    assertPositiveIntegerField(value, "max_total_tokens", path, errors);
  }
  if (value.max_estimated_cost !== undefined && !isPositiveFiniteNumber(value.max_estimated_cost)) {
    errors.push(`${path}.max_estimated_cost must be a positive finite number when present`);
  }
}

function validateSeedPolicy(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, seedPolicyKeys, path, errors);
  if (!includesString(seedPolicyKinds, value.kind)) {
    errors.push(`${path}.kind must be one of: ${seedPolicyKinds.join(", ")}`);
  }
  assertPositiveIntegerField(value, "repeats", path, errors);
  if (value.kind === "fixed" || value.kind === "declared_set") {
    if (
      !Array.isArray(value.seeds) ||
      value.seeds.length === 0 ||
      !value.seeds.every((entry) => typeof entry === "string" && entry.length > 0)
    ) {
      errors.push(`${path}.seeds must be a non-empty string array for kind '${String(value.kind)}'`);
    }
  } else if (value.kind === "fresh" && value.seeds !== undefined) {
    errors.push(`${path}.seeds must not be present when kind is 'fresh'`);
  }
}

function validateOpenWorkExpectation(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, openWorkKeys, path, errors);
  rejectForbiddenPrescriptionKeys(value, path, errors);
  if (!includesString(GOAL_CONTINUITY_OPEN_WORK_KINDS, value.kind)) {
    errors.push(`${path}.kind must be one of: ${GOAL_CONTINUITY_OPEN_WORK_KINDS.join(", ")}`);
  }
  assertString(value, "pressure_notes", path, errors);
}

function validateInterruption(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, interruptionKeys, path, errors);
  if (!includesString(GOAL_CONTINUITY_INTERRUPTION_KINDS, value.kind)) {
    errors.push(`${path}.kind must be one of: ${GOAL_CONTINUITY_INTERRUPTION_KINDS.join(", ")}`);
  }
  if (!includesString(GOAL_CONTINUITY_INTERRUPTION_SCHEDULES, value.schedule)) {
    errors.push(
      `${path}.schedule must be one of: ${GOAL_CONTINUITY_INTERRUPTION_SCHEDULES.join(", ")}`
    );
  }
  assertString(value, "description", path, errors);
  if (value.schedule === "at_cycle") {
    if (!isPositiveInteger(value.at_cycle)) {
      errors.push(`${path}.at_cycle must be a positive integer when schedule is 'at_cycle'`);
    }
  } else if (value.at_cycle !== undefined) {
    errors.push(`${path}.at_cycle must only be present when schedule is 'at_cycle'`);
  }
}

function validateRestartCheckpoint(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, restartCheckpointKeys, path, errors);
  assertBoolean(value, "required", path, errors);
  assertString(value, "description", path, errors);
}

function validateMilestone(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, milestoneKeys, path, errors);
  assertString(value, "milestone_id", path, errors);
  assertString(value, "title", path, errors);
  validateCapabilityPredicate(value.predicate, `${path}.predicate`, errors);
  if (value.order !== null && !Number.isInteger(value.order)) {
    errors.push(`${path}.order must be an integer or null`);
  }
  if (!isFiniteNumber(value.weight)) {
    errors.push(`${path}.weight must be a finite number`);
  }
}

function validateAllowedPhysicalEvidenceKinds(
  value: unknown,
  path: string,
  errors: string[]
): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }
  for (const [index, entry] of value.entries()) {
    if (!nonEmptyString(entry)) {
      errors.push(`${path}[${index}] must be a non-empty string`);
      continue;
    }
    if (includesString(forbiddenEvidenceKinds, entry)) {
      errors.push(
        `${path}[${index}] '${entry}' cannot decide physical targets (prose/video/screenshot are not allowed)`
      );
      continue;
    }
    if (!includesString(CAPABILITY_ALLOWED_EVIDENCE_KINDS, entry)) {
      errors.push(
        `${path}[${index}] '${entry}' is not a closed capability evidence kind (${CAPABILITY_ALLOWED_EVIDENCE_KINDS.join(", ")})`
      );
    }
  }
}

function validateObservableLifecycleEvents(
  value: unknown,
  path: string,
  errors: string[]
): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }
  const seen = new Set<string>();
  for (const [index, entry] of value.entries()) {
    if (!includesString(GOAL_CONTINUITY_LIFECYCLE_EVENTS, entry)) {
      errors.push(
        `${path}[${index}] must be one of: ${GOAL_CONTINUITY_LIFECYCLE_EVENTS.join(", ")}`
      );
      continue;
    }
    if (seen.has(entry)) {
      errors.push(`${path} duplicate lifecycle event '${entry}'`);
    }
    seen.add(entry);
  }
}

function validateCase(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  rejectForbiddenPrescriptionKeys(value, path, errors);
  rejectUnknownKeys(value, caseKeys, path, errors);

  assertString(value, "case_id", path, errors);
  assertString(value, "title", path, errors);
  assertString(value, "top_level_goal", path, errors);
  assertWorldScenarioId(value, "world_scenario_id", path, errors);

  if (!includesString(fixtureClasses, value.fixture_class)) {
    errors.push(`${path}.fixture_class must be one of: ${fixtureClasses.join(", ")}`);
  }

  const openWork = assertRecord(value, "open_work_expectation", path, errors);
  if (openWork) {
    validateOpenWorkExpectation(openWork, `${path}.open_work_expectation`, errors);
  }

  if (value.interruption !== undefined) {
    validateInterruption(value.interruption, `${path}.interruption`, errors);
  }
  if (value.restart_checkpoint !== undefined) {
    validateRestartCheckpoint(value.restart_checkpoint, `${path}.restart_checkpoint`, errors);
  }

  validateObservableLifecycleEvents(
    value.observable_lifecycle_events,
    `${path}.observable_lifecycle_events`,
    errors
  );

  if (value.physical_target !== undefined) {
    validateCapabilityPredicate(value.physical_target, `${path}.physical_target`, errors);
  }

  if (value.physical_milestones !== undefined) {
    if (!Array.isArray(value.physical_milestones)) {
      errors.push(`${path}.physical_milestones must be an array when present`);
    } else {
      const milestoneIds = new Set<string>();
      for (const [index, milestone] of value.physical_milestones.entries()) {
        validateMilestone(milestone, `${path}.physical_milestones[${index}]`, errors);
        if (isRecord(milestone) && nonEmptyString(milestone.milestone_id)) {
          if (milestoneIds.has(milestone.milestone_id)) {
            errors.push(
              `${path}.physical_milestones duplicate milestone_id '${milestone.milestone_id}'`
            );
          }
          milestoneIds.add(milestone.milestone_id);
        }
      }
    }
  }

  validateAllowedPhysicalEvidenceKinds(
    value.allowed_physical_evidence_kinds,
    `${path}.allowed_physical_evidence_kinds`,
    errors
  );

  const budgets = assertRecord(value, "budgets", path, errors);
  if (budgets) {
    validateBudgets(budgets, `${path}.budgets`, errors);
  }

  const seedPolicy = assertRecord(value, "seed_policy", path, errors);
  if (seedPolicy) {
    validateSeedPolicy(seedPolicy, `${path}.seed_policy`, errors);
  }
}

export function validateGoalContinuityManifest(value: unknown): ManifestValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["GoalContinuityManifest must be an object"] };
  }

  rejectForbiddenPrescriptionKeys(value, "GoalContinuityManifest", errors);
  rejectUnknownKeys(value, manifestKeys, "GoalContinuityManifest", errors);

  if (value.schema !== GOAL_CONTINUITY_MANIFEST_SCHEMA) {
    errors.push(`schema must be '${GOAL_CONTINUITY_MANIFEST_SCHEMA}'`);
  }

  assertString(value, "suite_id", "GoalContinuityManifest", errors);
  assertString(value, "version", "GoalContinuityManifest", errors);
  assertString(value, "description", "GoalContinuityManifest", errors);

  if (!Array.isArray(value.cases) || value.cases.length === 0) {
    errors.push("GoalContinuityManifest.cases must be a non-empty array");
  } else {
    const caseIds = new Set<string>();
    for (const [index, continuityCase] of value.cases.entries()) {
      validateCase(continuityCase, `GoalContinuityManifest.cases[${index}]`, errors);
      if (isRecord(continuityCase) && nonEmptyString(continuityCase.case_id)) {
        if (caseIds.has(continuityCase.case_id)) {
          errors.push(
            `GoalContinuityManifest.cases duplicate case_id '${continuityCase.case_id}'`
          );
        }
        caseIds.add(continuityCase.case_id);
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, manifest: value as GoalContinuityManifestV1 };
}

export function assertGoalContinuityManifest(value: unknown): GoalContinuityManifestV1 {
  const result = validateGoalContinuityManifest(value);
  if (!result.ok) {
    throw new Error(`Invalid GoalContinuityManifest: ${result.errors.join("; ")}`);
  }
  return result.manifest;
}

export function loadGoalContinuityManifestFromFile(path: string): GoalContinuityManifestV1 {
  const raw = readFileSync(path, "utf8");
  const parsed: unknown = JSON.parse(raw);
  return assertGoalContinuityManifest(parsed);
}

export function selectGoalContinuityCase(
  manifest: GoalContinuityManifestV1,
  caseId: string
): GoalContinuityCaseV1 {
  const found = manifest.cases.find((entry) => entry.case_id === caseId);
  if (!found) {
    throw new Error(`Goal continuity case '${caseId}' not found in suite '${manifest.suite_id}'`);
  }
  return found;
}

export type { GoalContinuityLifecycleEventV1 };

type ArtifactBagValidationResult =
  | { ok: true; bag: GoalContinuityArtifactBagV1 }
  | ValidationFailure;

type RestartObservationValidationResult =
  | { ok: true; observation: GoalContinuityRestartObservationV1 }
  | ValidationFailure;

const artifactBagKeys = [
  "schema",
  "actor_id",
  "run_id",
  "required_refs",
  "plan_bead_operation_results",
  "active_episodes",
  "ready_fronts",
  "plan_bead_snapshots",
  "memory_notes",
  "restart_observation",
  "physical_evidence"
] as const;

const referencedArtifactKeys = ["ref", "present", "artifact"] as const;

const operationResultKeys = [
  "schema",
  "operation_result_id",
  "actor_id",
  "cycle_id",
  "turn_id",
  "op",
  "status",
  "reason",
  "bead_id",
  "evidence_refs",
  "created_at",
  "before_checkpoint_version",
  "after_checkpoint_version",
  "expected_checkpoint_version",
  "operation"
] as const;

const operationKeys = [
  "op",
  "bead_id",
  "expected_checkpoint_version",
  "evidence_refs",
  "patch"
] as const;

const operationPatchKeys = ["status", "close_kind", "close_reason", "title", "kind"] as const;

const operationOps = [
  "create",
  "update_notes",
  "set_status",
  "add_dependency",
  "invalid"
] as const;

const operationStatuses = ["accepted", "rejected"] as const;

const activeEpisodeKeys = [
  "schema",
  "episode_id",
  "actor_id",
  "purpose",
  "current_focus",
  "selected_plan_bead_refs",
  "related_plan_bead_refs",
  "status",
  "opened_from_refs"
] as const;

const activeEpisodeStatuses = [
  "active",
  "closing",
  "deferred",
  "blocked",
  "completed"
] as const;

const readyFrontKeys = [
  "schema",
  "cycle_id",
  "ready_bead_ids",
  "in_progress_bead_ids",
  "blocked_bead_ids",
  "physical_progress_claim"
] as const;

const planBeadSnapshotKeys = [
  "schema",
  "bead_id",
  "actor_id",
  "status",
  "title",
  "acceptance_criteria",
  "checkpoint",
  "refs",
  "assertion_policy"
] as const;

const planBeadStatuses = ["open", "in_progress", "blocked", "deferred", "closed"] as const;

const acceptanceCriteriaKeys = [
  "evidence_required",
  "non_physical_resolution_allowed"
] as const;

const checkpointKeys = [
  "version",
  "close_kind",
  "close_reason",
  "evidence_refs"
] as const;

const snapshotRefsKeys = ["evidence_refs", "memory_refs"] as const;

const assertionPolicyKeys = [
  "bead_is_context_not_authority",
  "physical_success_requires_current_evidence"
] as const;

const memoryNoteKeys = [
  "schema",
  "note_id",
  "prose",
  "claims_physical_progress"
] as const;

const restartObservationKeys = [
  "schema",
  "status",
  "before_ref",
  "after_ref",
  "before_open_bead_ids",
  "after_open_bead_ids",
  "source_artifact_refs"
] as const;

const restartObservationStatuses = ["observed", "not_observed"] as const;

const physicalEvidenceKeys = [
  "schema",
  "actor_id",
  "inventory",
  "held_item",
  "actor_position",
  "known_blocks",
  "named_positions",
  "containers",
  "available"
] as const;

const availableKeys = [
  "inventory",
  "held_item",
  "position",
  "blocks",
  "containers"
] as const;

const evidencedValueKeys = ["value", "evidence_refs", "origin"] as const;
const evidenceOrigins = ["setup", "run"] as const;

const collectionNames = [
  "plan_bead_operation_results",
  "active_episodes",
  "ready_fronts",
  "plan_bead_snapshots",
  "memory_notes"
] as const;

type CollectionName = (typeof collectionNames)[number];

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0;
}

function isUriLikeRef(ref: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(ref);
}

function assertRootSafeRelativeRef(ref: unknown, pathLabel: string, errors: string[]): void {
  if (!nonEmptyString(ref)) {
    errors.push(`${pathLabel} must be a non-empty string`);
    return;
  }
  if (isUriLikeRef(ref)) {
    errors.push(`${pathLabel} rejects URI refs ('${ref}')`);
    return;
  }
  if (!isRootSafeRelativeRef(ref)) {
    errors.push(`${pathLabel} must be a root-safe relative ref (absolute/escaping refs rejected)`);
  }
}

function assertStringArray(value: unknown, pathLabel: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${pathLabel} must be an array`);
    return;
  }
  for (const [index, entry] of value.entries()) {
    if (!nonEmptyString(entry)) {
      errors.push(`${pathLabel}[${index}] must be a non-empty string`);
    }
  }
}

function assertRootSafeRefArray(value: unknown, pathLabel: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${pathLabel} must be an array`);
    return;
  }
  for (const [index, entry] of value.entries()) {
    assertRootSafeRelativeRef(entry, `${pathLabel}[${index}]`, errors);
  }
}

function assertNonNegativeIntegerField(
  record: Record<string, unknown>,
  key: string,
  pathLabel: string,
  errors: string[]
): void {
  if (!isNonNegativeInteger(record[key])) {
    errors.push(`${pathLabel}.${key} must be a non-negative integer`);
  }
}

function validatePositionValue(value: unknown, pathLabel: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be an object`);
    return;
  }
  rejectUnknownKeys(value, ["x", "y", "z"], pathLabel, errors);
  for (const coordinate of ["x", "y", "z"] as const) {
    if (!isFiniteNumber(value[coordinate])) {
      errors.push(`${pathLabel}.${coordinate} must be a finite number`);
    }
  }
}

function validateInventoryCounts(value: unknown, pathLabel: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be an object`);
    return;
  }
  for (const [item, count] of Object.entries(value)) {
    if (item.trim().length === 0) {
      errors.push(`${pathLabel} item ids must be non-empty`);
    }
    if (!isNonNegativeInteger(count)) {
      errors.push(`${pathLabel}.${item || "<empty>"} must be a non-negative integer`);
    }
  }
}

function validateHeldItemValue(value: unknown, pathLabel: string, errors: string[]): void {
  if (value === null) {
    return;
  }
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be null or an object`);
    return;
  }
  rejectUnknownKeys(value, ["name", "count"], pathLabel, errors);
  if (!nonEmptyString(value.name)) {
    errors.push(`${pathLabel}.name must be a non-empty string`);
  }
  if (value.count !== undefined && !isPositiveInteger(value.count)) {
    errors.push(`${pathLabel}.count must be a positive integer when present`);
  }
}

function validateEvidencedValue(
  value: unknown,
  pathLabel: string,
  errors: string[],
  validateValue: (value: unknown, pathLabel: string, errors: string[]) => void
): void {
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be an object`);
    return;
  }
  rejectUnknownKeys(value, evidencedValueKeys, pathLabel, errors);
  if (!("value" in value)) {
    errors.push(`${pathLabel}.value is required`);
  } else {
    validateValue(value.value, `${pathLabel}.value`, errors);
  }
  assertRootSafeRefArray(value.evidence_refs, `${pathLabel}.evidence_refs`, errors);
  if (
    !Array.isArray(value.evidence_refs) ||
    value.evidence_refs.length === 0
  ) {
    errors.push(`${pathLabel}.evidence_refs must be a non-empty array`);
  }
  if (!includesString(evidenceOrigins, value.origin)) {
    errors.push(`${pathLabel}.origin must be one of: ${evidenceOrigins.join(", ")}`);
  }
}

function validatePhysicalEvidence(
  value: unknown,
  pathLabel: string,
  bagActorId: string,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be an object`);
    return;
  }
  rejectUnknownKeys(value, physicalEvidenceKeys, pathLabel, errors);
  if (value.schema !== "capability-evidence-bag/v1") {
    errors.push(`${pathLabel}.schema must be 'capability-evidence-bag/v1'`);
  }
  assertString(value, "actor_id", pathLabel, errors);
  if (nonEmptyString(value.actor_id) && value.actor_id !== bagActorId) {
    errors.push(`${pathLabel}.actor_id must match bag actor_id '${bagActorId}'`);
  }

  const available = assertRecord(value, "available", pathLabel, errors);
  if (available) {
    rejectUnknownKeys(available, availableKeys, `${pathLabel}.available`, errors);
    for (const key of availableKeys) {
      if (typeof available[key] !== "boolean") {
        errors.push(`${pathLabel}.available.${key} must be a boolean`);
      }
    }
  }

  if (value.inventory !== undefined) {
    validateEvidencedValue(
      value.inventory,
      `${pathLabel}.inventory`,
      errors,
      validateInventoryCounts
    );
  }
  if (value.held_item !== undefined) {
    validateEvidencedValue(
      value.held_item,
      `${pathLabel}.held_item`,
      errors,
      validateHeldItemValue
    );
  }
  if (value.actor_position !== undefined) {
    validateEvidencedValue(
      value.actor_position,
      `${pathLabel}.actor_position`,
      errors,
      validatePositionValue
    );
  }

  if (value.known_blocks !== undefined) {
    if (!Array.isArray(value.known_blocks)) {
      errors.push(`${pathLabel}.known_blocks must be an array when present`);
    } else {
      for (const [index, entry] of value.known_blocks.entries()) {
        if (!isRecord(entry)) {
          errors.push(`${pathLabel}.known_blocks[${index}] must be an object`);
          continue;
        }
        rejectUnknownKeys(
          entry,
          ["block", "position", "evidence_ref", "origin"],
          `${pathLabel}.known_blocks[${index}]`,
          errors
        );
        assertString(entry, "block", `${pathLabel}.known_blocks[${index}]`, errors);
        if (entry.position !== undefined) {
          validatePositionValue(
            entry.position,
            `${pathLabel}.known_blocks[${index}].position`,
            errors
          );
        }
        assertRootSafeRelativeRef(
          entry.evidence_ref,
          `${pathLabel}.known_blocks[${index}].evidence_ref`,
          errors
        );
        if (!includesString(evidenceOrigins, entry.origin)) {
          errors.push(
            `${pathLabel}.known_blocks[${index}].origin must be one of: ${evidenceOrigins.join(", ")}`
          );
        }
      }
    }
  }

  if (value.named_positions !== undefined) {
    if (!isRecord(value.named_positions)) {
      errors.push(`${pathLabel}.named_positions must be an object when present`);
    } else {
      for (const [name, entry] of Object.entries(value.named_positions)) {
        validateEvidencedValue(
          entry,
          `${pathLabel}.named_positions.${name}`,
          errors,
          validatePositionValue
        );
      }
    }
  }

  if (value.containers !== undefined) {
    if (!Array.isArray(value.containers)) {
      errors.push(`${pathLabel}.containers must be an array when present`);
    } else {
      for (const [index, entry] of value.containers.entries()) {
        if (!isRecord(entry)) {
          errors.push(`${pathLabel}.containers[${index}] must be an object`);
          continue;
        }
        rejectUnknownKeys(
          entry,
          ["container_ref", "items", "evidence_ref", "origin"],
          `${pathLabel}.containers[${index}]`,
          errors
        );
        assertString(entry, "container_ref", `${pathLabel}.containers[${index}]`, errors);
        validateInventoryCounts(
          entry.items,
          `${pathLabel}.containers[${index}].items`,
          errors
        );
        assertRootSafeRelativeRef(
          entry.evidence_ref,
          `${pathLabel}.containers[${index}].evidence_ref`,
          errors
        );
        if (!includesString(evidenceOrigins, entry.origin)) {
          errors.push(
            `${pathLabel}.containers[${index}].origin must be one of: ${evidenceOrigins.join(", ")}`
          );
        }
      }
    }
  }
}

function validateOperationPatch(value: unknown, pathLabel: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be an object`);
    return;
  }
  rejectUnknownKeys(value, operationPatchKeys, pathLabel, errors);
  if (value.status !== undefined && !includesString(planBeadStatuses, value.status)) {
    errors.push(`${pathLabel}.status must be one of: ${planBeadStatuses.join(", ")}`);
  }
  if (value.close_kind !== undefined && !nonEmptyString(value.close_kind)) {
    errors.push(`${pathLabel}.close_kind must be a non-empty string when present`);
  }
  if (value.close_reason !== undefined && !nonEmptyString(value.close_reason)) {
    errors.push(`${pathLabel}.close_reason must be a non-empty string when present`);
  }
  if (value.title !== undefined && !nonEmptyString(value.title)) {
    errors.push(`${pathLabel}.title must be a non-empty string when present`);
  }
  if (value.kind !== undefined && !nonEmptyString(value.kind)) {
    errors.push(`${pathLabel}.kind must be a non-empty string when present`);
  }
}

function validateOperationPayload(value: unknown, pathLabel: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be an object`);
    return;
  }
  rejectUnknownKeys(value, operationKeys, pathLabel, errors);
  if (!nonEmptyString(value.op)) {
    errors.push(`${pathLabel}.op must be a non-empty string`);
  }
  if (value.bead_id !== undefined && !nonEmptyString(value.bead_id)) {
    errors.push(`${pathLabel}.bead_id must be a non-empty string when present`);
  }
  if (value.expected_checkpoint_version !== undefined) {
    assertNonNegativeIntegerField(value, "expected_checkpoint_version", pathLabel, errors);
  }
  if (value.evidence_refs !== undefined) {
    assertRootSafeRefArray(value.evidence_refs, `${pathLabel}.evidence_refs`, errors);
  }
  if (value.patch !== undefined) {
    validateOperationPatch(value.patch, `${pathLabel}.patch`, errors);
  }
}

function validatePlanBeadOperationResult(
  value: unknown,
  pathLabel: string,
  bagActorId: string,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be an object`);
    return;
  }
  rejectUnknownKeys(value, operationResultKeys, pathLabel, errors);
  if (value.schema !== "plan-bead-operation-result/v1") {
    errors.push(`${pathLabel}.schema must be 'plan-bead-operation-result/v1'`);
  }
  assertString(value, "operation_result_id", pathLabel, errors);
  assertString(value, "actor_id", pathLabel, errors);
  if (nonEmptyString(value.actor_id) && value.actor_id !== bagActorId) {
    errors.push(`${pathLabel}.actor_id must match bag actor_id '${bagActorId}'`);
  }
  assertString(value, "cycle_id", pathLabel, errors);
  assertString(value, "turn_id", pathLabel, errors);
  if (!includesString(operationOps, value.op)) {
    errors.push(`${pathLabel}.op must be one of: ${operationOps.join(", ")}`);
  }
  if (!includesString(operationStatuses, value.status)) {
    errors.push(`${pathLabel}.status must be one of: ${operationStatuses.join(", ")}`);
  }
  // reason is recorded for audit only; never used as a decision input.
  if (typeof value.reason !== "string") {
    errors.push(`${pathLabel}.reason must be a string`);
  }
  if (value.bead_id !== undefined && !nonEmptyString(value.bead_id)) {
    errors.push(`${pathLabel}.bead_id must be a non-empty string when present`);
  }
  assertRootSafeRefArray(value.evidence_refs, `${pathLabel}.evidence_refs`, errors);
  assertString(value, "created_at", pathLabel, errors);
  for (const key of [
    "before_checkpoint_version",
    "after_checkpoint_version",
    "expected_checkpoint_version"
  ] as const) {
    if (value[key] !== undefined) {
      assertNonNegativeIntegerField(value, key, pathLabel, errors);
    }
  }
  if (value.operation !== undefined) {
    validateOperationPayload(value.operation, `${pathLabel}.operation`, errors);
  }
}

function validateActiveEpisode(
  value: unknown,
  pathLabel: string,
  bagActorId: string,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be an object`);
    return;
  }
  rejectUnknownKeys(value, activeEpisodeKeys, pathLabel, errors);
  if (value.schema !== "active-episode/v1") {
    errors.push(`${pathLabel}.schema must be 'active-episode/v1'`);
  }
  assertString(value, "episode_id", pathLabel, errors);
  assertString(value, "actor_id", pathLabel, errors);
  if (nonEmptyString(value.actor_id) && value.actor_id !== bagActorId) {
    errors.push(`${pathLabel}.actor_id must match bag actor_id '${bagActorId}'`);
  }
  assertString(value, "purpose", pathLabel, errors);
  assertString(value, "current_focus", pathLabel, errors);
  assertRootSafeRefArray(
    value.selected_plan_bead_refs,
    `${pathLabel}.selected_plan_bead_refs`,
    errors
  );
  assertRootSafeRefArray(
    value.related_plan_bead_refs,
    `${pathLabel}.related_plan_bead_refs`,
    errors
  );
  if (!includesString(activeEpisodeStatuses, value.status)) {
    errors.push(`${pathLabel}.status must be one of: ${activeEpisodeStatuses.join(", ")}`);
  }
  assertRootSafeRefArray(value.opened_from_refs, `${pathLabel}.opened_from_refs`, errors);
}

function validateReadyFront(value: unknown, pathLabel: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be an object`);
    return;
  }
  rejectUnknownKeys(value, readyFrontKeys, pathLabel, errors);
  if (value.schema !== "plan-bead-ready-front/v1") {
    errors.push(`${pathLabel}.schema must be 'plan-bead-ready-front/v1'`);
  }
  assertString(value, "cycle_id", pathLabel, errors);
  assertStringArray(value.ready_bead_ids, `${pathLabel}.ready_bead_ids`, errors);
  assertStringArray(value.in_progress_bead_ids, `${pathLabel}.in_progress_bead_ids`, errors);
  assertStringArray(value.blocked_bead_ids, `${pathLabel}.blocked_bead_ids`, errors);
  if (value.physical_progress_claim !== false) {
    errors.push(`${pathLabel}.physical_progress_claim must be false`);
  }
}

function validatePlanBeadSnapshot(
  value: unknown,
  pathLabel: string,
  bagActorId: string,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be an object`);
    return;
  }
  rejectUnknownKeys(value, planBeadSnapshotKeys, pathLabel, errors);
  if (value.schema !== "actor-plan-bead/v1") {
    errors.push(`${pathLabel}.schema must be 'actor-plan-bead/v1'`);
  }
  assertString(value, "bead_id", pathLabel, errors);
  assertString(value, "actor_id", pathLabel, errors);
  if (nonEmptyString(value.actor_id) && value.actor_id !== bagActorId) {
    errors.push(`${pathLabel}.actor_id must match bag actor_id '${bagActorId}'`);
  }
  if (!includesString(planBeadStatuses, value.status)) {
    errors.push(`${pathLabel}.status must be one of: ${planBeadStatuses.join(", ")}`);
  }
  assertString(value, "title", pathLabel, errors);

  const acceptance = assertRecord(value, "acceptance_criteria", pathLabel, errors);
  if (acceptance) {
    rejectUnknownKeys(
      acceptance,
      acceptanceCriteriaKeys,
      `${pathLabel}.acceptance_criteria`,
      errors
    );
    assertStringArray(
      acceptance.evidence_required,
      `${pathLabel}.acceptance_criteria.evidence_required`,
      errors
    );
    if (typeof acceptance.non_physical_resolution_allowed !== "boolean") {
      errors.push(
        `${pathLabel}.acceptance_criteria.non_physical_resolution_allowed must be a boolean`
      );
    }
  }

  const checkpoint = assertRecord(value, "checkpoint", pathLabel, errors);
  if (checkpoint) {
    rejectUnknownKeys(checkpoint, checkpointKeys, `${pathLabel}.checkpoint`, errors);
    assertNonNegativeIntegerField(checkpoint, "version", `${pathLabel}.checkpoint`, errors);
    if (checkpoint.close_kind !== undefined && !nonEmptyString(checkpoint.close_kind)) {
      errors.push(`${pathLabel}.checkpoint.close_kind must be a non-empty string when present`);
    }
    if (checkpoint.close_reason !== undefined && !nonEmptyString(checkpoint.close_reason)) {
      errors.push(`${pathLabel}.checkpoint.close_reason must be a non-empty string when present`);
    }
    assertRootSafeRefArray(
      checkpoint.evidence_refs,
      `${pathLabel}.checkpoint.evidence_refs`,
      errors
    );
  }

  const refs = assertRecord(value, "refs", pathLabel, errors);
  if (refs) {
    rejectUnknownKeys(refs, snapshotRefsKeys, `${pathLabel}.refs`, errors);
    assertRootSafeRefArray(refs.evidence_refs, `${pathLabel}.refs.evidence_refs`, errors);
    assertRootSafeRefArray(refs.memory_refs, `${pathLabel}.refs.memory_refs`, errors);
  }

  const assertion = assertRecord(value, "assertion_policy", pathLabel, errors);
  if (assertion) {
    rejectUnknownKeys(assertion, assertionPolicyKeys, `${pathLabel}.assertion_policy`, errors);
    if (assertion.bead_is_context_not_authority !== true) {
      errors.push(`${pathLabel}.assertion_policy.bead_is_context_not_authority must be true`);
    }
    if (assertion.physical_success_requires_current_evidence !== true) {
      errors.push(
        `${pathLabel}.assertion_policy.physical_success_requires_current_evidence must be true`
      );
    }
  }
}

function validateMemoryNote(value: unknown, pathLabel: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be an object`);
    return;
  }
  rejectUnknownKeys(value, memoryNoteKeys, pathLabel, errors);
  if (value.schema !== "continuity-memory-note/v1") {
    errors.push(`${pathLabel}.schema must be 'continuity-memory-note/v1'`);
  }
  assertString(value, "note_id", pathLabel, errors);
  if (typeof value.prose !== "string") {
    errors.push(`${pathLabel}.prose must be a string`);
  }
  if (typeof value.claims_physical_progress !== "boolean") {
    errors.push(`${pathLabel}.claims_physical_progress must be a boolean`);
  }
}

/**
 * Validate a typed restart observation. Decisions use status/refs/id arrays only;
 * no prose fields exist on this artifact.
 */
export function validateGoalContinuityRestartObservation(
  value: unknown
): RestartObservationValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["GoalContinuityRestartObservation must be an object"] };
  }
  rejectUnknownKeys(value, restartObservationKeys, "GoalContinuityRestartObservation", errors);
  if (value.schema !== GOAL_CONTINUITY_RESTART_OBSERVATION_SCHEMA) {
    errors.push(`schema must be '${GOAL_CONTINUITY_RESTART_OBSERVATION_SCHEMA}'`);
  }
  if (!includesString(restartObservationStatuses, value.status)) {
    errors.push(
      `status must be one of: ${restartObservationStatuses.join(", ")}`
    );
  }
  assertRootSafeRelativeRef(value.before_ref, "before_ref", errors);
  assertRootSafeRelativeRef(value.after_ref, "after_ref", errors);
  if (
    nonEmptyString(value.before_ref) &&
    nonEmptyString(value.after_ref) &&
    value.before_ref === value.after_ref
  ) {
    errors.push("before_ref and after_ref must be distinct");
  }
  assertStringArray(value.before_open_bead_ids, "before_open_bead_ids", errors);
  assertStringArray(value.after_open_bead_ids, "after_open_bead_ids", errors);
  assertRootSafeRefArray(value.source_artifact_refs, "source_artifact_refs", errors);
  if (
    value.status === "observed" &&
    Array.isArray(value.source_artifact_refs) &&
    value.source_artifact_refs.length === 0
  ) {
    errors.push("source_artifact_refs must be non-empty when status is 'observed'");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, observation: value as GoalContinuityRestartObservationV1 };
}

export function assertGoalContinuityRestartObservation(
  value: unknown
): GoalContinuityRestartObservationV1 {
  const result = validateGoalContinuityRestartObservation(value);
  if (!result.ok) {
    throw new Error(`Invalid GoalContinuityRestartObservation: ${result.errors.join("; ")}`);
  }
  return result.observation;
}

function validateReferencedArtifact(
  value: unknown,
  pathLabel: string,
  collection: CollectionName,
  bagActorId: string,
  errors: string[]
): string | null {
  if (!isRecord(value)) {
    errors.push(`${pathLabel} must be an object`);
    return null;
  }
  rejectUnknownKeys(value, referencedArtifactKeys, pathLabel, errors);
  assertRootSafeRelativeRef(value.ref, `${pathLabel}.ref`, errors);
  if (typeof value.present !== "boolean") {
    errors.push(`${pathLabel}.present must be a boolean`);
  }

  if (value.present === true) {
    if (value.artifact === undefined) {
      errors.push(`${pathLabel}.artifact is required when present is true`);
      return nonEmptyString(value.ref) ? value.ref : null;
    }
    switch (collection) {
      case "plan_bead_operation_results":
        validatePlanBeadOperationResult(value.artifact, `${pathLabel}.artifact`, bagActorId, errors);
        break;
      case "active_episodes":
        validateActiveEpisode(value.artifact, `${pathLabel}.artifact`, bagActorId, errors);
        break;
      case "ready_fronts":
        validateReadyFront(value.artifact, `${pathLabel}.artifact`, errors);
        break;
      case "plan_bead_snapshots":
        validatePlanBeadSnapshot(value.artifact, `${pathLabel}.artifact`, bagActorId, errors);
        break;
      case "memory_notes":
        validateMemoryNote(value.artifact, `${pathLabel}.artifact`, errors);
        break;
    }
  } else if (value.present === false && value.artifact !== undefined) {
    errors.push(`${pathLabel}.artifact must be absent when present is false`);
  }

  return nonEmptyString(value.ref) ? value.ref : null;
}

function validateReferencedCollection(
  value: unknown,
  pathLabel: string,
  collection: CollectionName,
  bagActorId: string,
  refOwners: Map<string, CollectionName>,
  errors: string[]
): void {
  if (!Array.isArray(value)) {
    errors.push(`${pathLabel} must be an array`);
    return;
  }
  for (const [index, entry] of value.entries()) {
    const ref = validateReferencedArtifact(
      entry,
      `${pathLabel}[${index}]`,
      collection,
      bagActorId,
      errors
    );
    if (ref === null) {
      continue;
    }
    const owner = refOwners.get(ref);
    if (owner !== undefined) {
      if (owner === collection) {
        errors.push(`${pathLabel} duplicate ref '${ref}'`);
      } else {
        errors.push(
          `ref '${ref}' appears in incompatible collections '${owner}' and '${collection}'`
        );
      }
    } else {
      refOwners.set(ref, collection);
    }
  }
}

/**
 * Strict recursive validator for goal-continuity-artifact-bag/v1.
 * Rejects unknown keys, unsafe refs, and present entries without typed artifacts.
 */
export function validateGoalContinuityArtifactBag(value: unknown): ArtifactBagValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["GoalContinuityArtifactBag must be an object"] };
  }

  rejectUnknownKeys(value, artifactBagKeys, "GoalContinuityArtifactBag", errors);

  if (value.schema !== GOAL_CONTINUITY_ARTIFACT_BAG_SCHEMA) {
    errors.push(`schema must be '${GOAL_CONTINUITY_ARTIFACT_BAG_SCHEMA}'`);
  }

  assertString(value, "actor_id", "GoalContinuityArtifactBag", errors);
  assertString(value, "run_id", "GoalContinuityArtifactBag", errors);

  const bagActorId = nonEmptyString(value.actor_id) ? value.actor_id : "";

  if (!Array.isArray(value.required_refs)) {
    errors.push("GoalContinuityArtifactBag.required_refs must be an array");
  } else {
    const seenRequired = new Set<string>();
    for (const [index, ref] of value.required_refs.entries()) {
      assertRootSafeRelativeRef(ref, `GoalContinuityArtifactBag.required_refs[${index}]`, errors);
      if (nonEmptyString(ref)) {
        if (seenRequired.has(ref)) {
          errors.push(`GoalContinuityArtifactBag.required_refs duplicate '${ref}'`);
        }
        seenRequired.add(ref);
      }
    }
  }

  const refOwners = new Map<string, CollectionName>();
  for (const collection of collectionNames) {
    validateReferencedCollection(
      value[collection],
      `GoalContinuityArtifactBag.${collection}`,
      collection,
      bagActorId,
      refOwners,
      errors
    );
  }

  if (Array.isArray(value.required_refs)) {
    for (const [index, ref] of value.required_refs.entries()) {
      if (!nonEmptyString(ref)) {
        continue;
      }
      if (!refOwners.has(ref)) {
        errors.push(
          `GoalContinuityArtifactBag.required_refs[${index}] '${ref}' does not resolve to any collection entry`
        );
      }
    }
  }

  if (value.restart_observation !== undefined) {
    const restart = validateGoalContinuityRestartObservation(value.restart_observation);
    if (!restart.ok) {
      for (const error of restart.errors) {
        errors.push(`GoalContinuityArtifactBag.restart_observation: ${error}`);
      }
    }
  }

  if (value.physical_evidence !== undefined) {
    validatePhysicalEvidence(
      value.physical_evidence,
      "GoalContinuityArtifactBag.physical_evidence",
      bagActorId,
      errors
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, bag: value as GoalContinuityArtifactBagV1 };
}

export function assertGoalContinuityArtifactBag(value: unknown): GoalContinuityArtifactBagV1 {
  const result = validateGoalContinuityArtifactBag(value);
  if (!result.ok) {
    throw new Error(`Invalid GoalContinuityArtifactBag: ${result.errors.join("; ")}`);
  }
  return result.bag;
}

/**
 * Load and validate a bag JSON file under a declared actor/run root.
 * Absolute, escaping, and URI refs are rejected before any file read.
 */
export function loadGoalContinuityArtifactBagFromFile(
  rootDir: string,
  relativeRef: string
): GoalContinuityArtifactBagV1 {
  if (isUriLikeRef(relativeRef)) {
    throw new Error(`Invalid GoalContinuityArtifactBag ref: URI refs are rejected ('${relativeRef}')`);
  }
  const resolved = resolveRootSafeArtifactRefWithoutSymlinks(rootDir, relativeRef);
  if (!resolved.ok) {
    throw new Error(`Invalid GoalContinuityArtifactBag ref: ${resolved.reason}`);
  }
  const raw = readFileSync(resolved.absolute_path, "utf8");
  const parsed: unknown = JSON.parse(raw);
  return assertGoalContinuityArtifactBag(parsed);
}

/**
 * Resolve a root-safe relative path under `rootDir` for continuity artifact I/O.
 * Does not follow paths outside the declared root.
 */
export function resolveGoalContinuityArtifactPath(
  rootDir: string,
  relativeRef: string
): { absolute_path: string; relative_ref: string } {
  if (isUriLikeRef(relativeRef)) {
    throw new Error(`URI refs are rejected ('${relativeRef}')`);
  }
  const resolved = resolveRootSafeArtifactRefWithoutSymlinks(rootDir, relativeRef);
  if (!resolved.ok) {
    throw new Error(resolved.reason);
  }
  return {
    absolute_path: resolved.absolute_path,
    relative_ref: resolved.relative_ref
  };
}
