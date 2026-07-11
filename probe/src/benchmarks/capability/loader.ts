import { readFileSync } from "node:fs";

import { parseWorldScenarioId, worldScenarioIds } from "../../server/worldScenarios.js";
import {
  isKnownMinecraftBlock,
  isKnownMinecraftItemOrBlock
} from "./minecraftIds.js";
import type {
  CapabilityMilestoneV1,
  CapabilityPredicateV1,
  IndividualCapabilityCaseV1,
  IndividualCapabilityManifestV1
} from "./types.js";

type ValidationFailure = { ok: false; errors: string[] };

type ManifestValidationResult =
  | { ok: true; manifest: IndividualCapabilityManifestV1 }
  | ValidationFailure;

const fixtureClasses = ["natural_world", "command_fixture", "mixed"] as const;
const seedPolicyKinds = ["fixed", "declared_set", "fresh"] as const;
const partialCreditKinds = ["milestones", "none"] as const;

const forbiddenCaseRootKeys = [
  "recommended_actions",
  "action_order",
  "recipe_steps",
  "hidden_candidates",
  "provider_rationale"
] as const;

const predicateOps = [
  "item_count_gte",
  "held_item_is",
  "block_observed_at",
  "position_within",
  "container_item_count_gte",
  "evidence_kind_seen",
  "all",
  "any"
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

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function assertString(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (!nonEmptyString(record[key])) {
    errors.push(`${path}.${key} must be a non-empty string`);
  }
}

function assertStringArray(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
) {
  const value = record[key];
  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === "string" && entry.length > 0)
  ) {
    errors.push(`${path}.${key} must be a string array`);
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

function assertPositiveNumber(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
) {
  if (!isPositiveFiniteNumber(record[key])) {
    errors.push(`${path}.${key} must be a positive finite number`);
  }
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

function assertKnownItemField(
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
  if (!isKnownMinecraftItemOrBlock(value)) {
    errors.push(`${path}.${key} '${value}' is not a known Minecraft item or block id`);
  }
}

function assertKnownBlockField(
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
  if (!isKnownMinecraftBlock(value)) {
    errors.push(`${path}.${key} '${value}' is not a known Minecraft block id`);
  }
}

function assertConstraintRecord(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
) {
  const value = record[key];
  if (!isRecord(value)) {
    errors.push(`${path}.${key} must be an object`);
    return;
  }
  for (const [constraintKey, constraintValue] of Object.entries(value)) {
    const constraintPath = `${path}.${key}.${constraintKey}`;
    if (
      typeof constraintValue !== "string" &&
      typeof constraintValue !== "number" &&
      typeof constraintValue !== "boolean"
    ) {
      errors.push(`${constraintPath} must be a string, number, or boolean`);
    }
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

function rejectForbiddenCaseRootKeys(
  record: Record<string, unknown>,
  path: string,
  errors: string[]
) {
  for (const key of forbiddenCaseRootKeys) {
    if (record[key] !== undefined) {
      errors.push(`${path}.${key} must not appear in capability manifest cases`);
    }
  }
}

function validatePredicate(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  const op = value.op;
  if (!includesString(predicateOps, op)) {
    errors.push(`${path}.op must be a known capability predicate op`);
    return;
  }

  switch (op) {
    case "item_count_gte":
      assertKnownItemField(value, "item", path, errors);
      if (!isPositiveFiniteNumber(value.count)) {
        errors.push(`${path}.count must be a positive finite number`);
      }
      if (value.owner !== "actor") {
        errors.push(`${path}.owner must be 'actor'`);
      }
      break;
    case "held_item_is":
      assertKnownItemField(value, "item", path, errors);
      break;
    case "block_observed_at":
      assertKnownBlockField(value, "block", path, errors);
      assertString(value, "position_ref", path, errors);
      break;
    case "position_within":
      assertString(value, "center_ref", path, errors);
      if (!isPositiveFiniteNumber(value.radius)) {
        errors.push(`${path}.radius must be a positive finite number`);
      }
      break;
    case "container_item_count_gte":
      assertString(value, "container_ref", path, errors);
      assertKnownItemField(value, "item", path, errors);
      if (!isPositiveFiniteNumber(value.count)) {
        errors.push(`${path}.count must be a positive finite number`);
      }
      break;
    case "evidence_kind_seen":
      assertString(value, "evidence_kind", path, errors);
      assertConstraintRecord(value, "constraints", path, errors);
      break;
    case "all":
    case "any": {
      const children = value.children;
      if (!Array.isArray(children) || children.length === 0) {
        errors.push(`${path}.children must be a non-empty predicate array`);
        break;
      }
      for (const [index, child] of children.entries()) {
        validatePredicate(child, `${path}.children[${index}]`, errors);
      }
      break;
    }
  }
}

function validateMilestone(
  value: unknown,
  path: string,
  errors: string[]
): CapabilityMilestoneV1 | null {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return null;
  }

  assertString(value, "milestone_id", path, errors);
  assertString(value, "title", path, errors);
  validatePredicate(value.predicate, `${path}.predicate`, errors);

  const order = value.order;
  if (order !== null && !Number.isInteger(order)) {
    errors.push(`${path}.order must be an integer or null`);
  }

  if (!isFiniteNumber(value.weight)) {
    errors.push(`${path}.weight must be a finite number`);
  }

  return null;
}

function validateBudgets(
  value: unknown,
  path: string,
  errors: string[]
): IndividualCapabilityCaseV1["budgets"] | null {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return null;
  }

  assertPositiveNumber(value, "max_cycles", path, errors);
  assertPositiveNumber(value, "max_runtime_actions", path, errors);
  assertPositiveNumber(value, "max_wall_time_ms", path, errors);

  if (value.max_provider_requests !== undefined && !isPositiveFiniteNumber(value.max_provider_requests)) {
    errors.push(`${path}.max_provider_requests must be a positive finite number when present`);
  }
  if (value.max_total_tokens !== undefined && !isPositiveFiniteNumber(value.max_total_tokens)) {
    errors.push(`${path}.max_total_tokens must be a positive finite number when present`);
  }
  if (value.max_estimated_cost !== undefined && !isPositiveFiniteNumber(value.max_estimated_cost)) {
    errors.push(`${path}.max_estimated_cost must be a positive finite number when present`);
  }

  return null;
}

function validateSeedPolicy(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  if (!includesString(seedPolicyKinds, value.kind)) {
    errors.push(`${path}.kind must be one of: ${seedPolicyKinds.join(", ")}`);
  }

  assertPositiveIntegerField(value, "repeats", path, errors);

  if (value.kind === "fixed" || value.kind === "declared_set") {
    assertStringArray(value, "seeds", path, errors);
  } else if (value.seeds !== undefined) {
    assertStringArray(value, "seeds", path, errors);
  }
}

function validateCompletionPolicy(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  assertBoolean(value, "require_target", path, errors);
  if (!includesString(partialCreditKinds, value.partial_credit)) {
    errors.push(`${path}.partial_credit must be one of: ${partialCreditKinds.join(", ")}`);
  }
}

function validateCase(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  rejectForbiddenCaseRootKeys(value, path, errors);

  assertString(value, "case_id", path, errors);
  assertString(value, "title", path, errors);
  assertString(value, "top_level_goal", path, errors);
  assertWorldScenarioId(value, "world_scenario_id", path, errors);

  if (!includesString(fixtureClasses, value.fixture_class)) {
    errors.push(`${path}.fixture_class must be one of: ${fixtureClasses.join(", ")}`);
  }

  assertStringArray(value, "required_capabilities", path, errors);

  const budgets = assertRecord(value, "budgets", path, errors);
  if (budgets) {
    validateBudgets(budgets, `${path}.budgets`, errors);
  } else {
    errors.push(`${path}.budgets is required`);
  }

  if (value.target === undefined) {
    errors.push(`${path}.target is required`);
  } else {
    validatePredicate(value.target, `${path}.target`, errors);
  }

  if (value.milestones === undefined) {
    errors.push(`${path}.milestones is required`);
  } else if (!Array.isArray(value.milestones)) {
    errors.push(`${path}.milestones must be an array`);
  } else {
    for (const [index, milestone] of value.milestones.entries()) {
      validateMilestone(milestone, `${path}.milestones[${index}]`, errors);
    }
  }

  assertStringArray(value, "allowed_evidence_kinds", path, errors);

  const seedPolicy = assertRecord(value, "seed_policy", path, errors);
  if (seedPolicy) {
    validateSeedPolicy(seedPolicy, `${path}.seed_policy`, errors);
  } else {
    errors.push(`${path}.seed_policy is required`);
  }

  const completionPolicy = assertRecord(value, "completion_policy", path, errors);
  if (completionPolicy) {
    validateCompletionPolicy(completionPolicy, `${path}.completion_policy`, errors);
  } else {
    errors.push(`${path}.completion_policy is required`);
  }
}

export function validateIndividualCapabilityManifest(value: unknown): ManifestValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["IndividualCapabilityManifest must be an object"] };
  }

  if (value.schema !== "individual-capability-manifest/v1") {
    errors.push("schema must be 'individual-capability-manifest/v1'");
  }

  assertString(value, "suite_id", "IndividualCapabilityManifest", errors);
  assertString(value, "version", "IndividualCapabilityManifest", errors);
  assertString(value, "description", "IndividualCapabilityManifest", errors);

  if (!Array.isArray(value.cases) || value.cases.length === 0) {
    errors.push("IndividualCapabilityManifest.cases must be a non-empty array");
  } else {
    for (const [index, capabilityCase] of value.cases.entries()) {
      validateCase(capabilityCase, `IndividualCapabilityManifest.cases[${index}]`, errors);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, manifest: value as IndividualCapabilityManifestV1 };
}

export function assertIndividualCapabilityManifest(value: unknown): IndividualCapabilityManifestV1 {
  const result = validateIndividualCapabilityManifest(value);
  if (!result.ok) {
    throw new Error(`Invalid IndividualCapabilityManifest: ${result.errors.join("; ")}`);
  }
  return result.manifest;
}

export function loadIndividualCapabilityManifestFromFile(
  path: string
): IndividualCapabilityManifestV1 {
  const raw = readFileSync(path, "utf8");
  const parsed: unknown = JSON.parse(raw);
  return assertIndividualCapabilityManifest(parsed);
}
