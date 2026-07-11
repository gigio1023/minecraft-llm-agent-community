import { readFileSync } from "node:fs";

import { parseWorldScenarioId, worldScenarioIds } from "../../server/worldScenarios.js";
import {
  CAPABILITY_ALLOWED_EVIDENCE_KINDS,
  validateCapabilityPredicate
} from "../capability/index.js";
import type {
  GoalContinuityCaseV1,
  GoalContinuityLifecycleEventV1,
  GoalContinuityManifestV1
} from "./types.js";
import {
  GOAL_CONTINUITY_INTERRUPTION_KINDS,
  GOAL_CONTINUITY_INTERRUPTION_SCHEDULES,
  GOAL_CONTINUITY_LIFECYCLE_EVENTS,
  GOAL_CONTINUITY_MANIFEST_SCHEMA,
  GOAL_CONTINUITY_OPEN_WORK_KINDS
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
