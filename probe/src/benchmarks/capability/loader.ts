import { readFileSync } from "node:fs";

import { parseWorldScenarioId, worldScenarioIds } from "../../server/worldScenarios.js";
import {
  isKnownMinecraftBlock,
  isKnownMinecraftItemOrBlock
} from "./minecraftIds.js";
import type {
  CapabilityAllowedEvidenceKindV1,
  CapabilityMilestoneV1,
  CapabilityPredicateV1,
  IndividualCapabilityCaseV1,
  IndividualCapabilityManifestV1
} from "./types.js";
import { CAPABILITY_ALLOWED_EVIDENCE_KINDS } from "./types.js";

type ValidationFailure = { ok: false; errors: string[] };

type ManifestValidationResult =
  | { ok: true; manifest: IndividualCapabilityManifestV1 }
  | ValidationFailure;

const fixtureClasses = ["natural_world", "command_fixture", "mixed"] as const;
const seedPolicyKinds = ["fixed", "declared_set", "fresh"] as const;
const partialCreditKinds = ["milestones", "none"] as const;

const manifestKeys = ["schema", "suite_id", "version", "description", "cases"] as const;
const caseKeys = [
  "case_id",
  "title",
  "top_level_goal",
  "world_scenario_id",
  "fixture_class",
  "required_capabilities",
  "budgets",
  "target",
  "milestones",
  "allowed_evidence_kinds",
  "seed_policy",
  "completion_policy"
] as const;
const budgetKeys = [
  "max_cycles",
  "max_runtime_actions",
  "max_wall_time_ms",
  "max_provider_requests",
  "max_total_tokens",
  "max_estimated_cost"
] as const;
const seedPolicyKeys = ["kind", "seeds", "repeats"] as const;
const completionPolicyKeys = ["require_target", "partial_credit"] as const;
const milestoneKeys = ["milestone_id", "title", "predicate", "order", "weight"] as const;

const predicateKeysByOp: Record<string, readonly string[]> = {
  item_count_gte: ["op", "item", "count", "owner"],
  held_item_is: ["op", "item"],
  block_observed_at: ["op", "block", "position_ref"],
  position_within: ["op", "center_ref", "radius"],
  container_item_count_gte: ["op", "container_ref", "item", "count"],
  all: ["op", "children"],
  any: ["op", "children"]
};

const predicateOps = Object.keys(predicateKeysByOp);

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

/** Exported for continuity and other offline evaluators that reuse CapabilityPredicateV1. */
export function validateCapabilityPredicate(
  value: unknown,
  path: string,
  errors: string[]
): void {
  validatePredicate(value, path, errors);
}

function validatePredicate(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  const op = value.op;
  if (typeof op !== "string" || !predicateOps.includes(op)) {
    errors.push(`${path}.op must be a known capability predicate op`);
    rejectUnknownKeys(value, ["op"], path, errors);
    return;
  }

  const allowedKeys = predicateKeysByOp[op] ?? ["op"];
  rejectUnknownKeys(value, allowedKeys, path, errors);

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

function validateMilestone(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  rejectUnknownKeys(value, milestoneKeys, path, errors);
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
  } else if (value.kind === "fresh") {
    if (value.seeds !== undefined) {
      errors.push(`${path}.seeds must not be present when kind is 'fresh'`);
    }
  }
}

function validateCompletionPolicy(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  rejectUnknownKeys(value, completionPolicyKeys, path, errors);
  assertBoolean(value, "require_target", path, errors);
  if (!includesString(partialCreditKinds, value.partial_credit)) {
    errors.push(`${path}.partial_credit must be one of: ${partialCreditKinds.join(", ")}`);
  }
}

function validateAllowedEvidenceKinds(
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
    } else if (seen.has(entry)) {
      errors.push(`${path}[${index}] duplicates evidence kind '${entry}'`);
    } else {
      seen.add(entry);
    }
  }
}

function validatePredicateEvidenceCoverage(
  value: unknown,
  allowedKinds: ReadonlySet<string>,
  path: string,
  errors: string[]
): void {
  if (!isRecord(value) || typeof value.op !== "string") {
    return;
  }
  if (value.op === "all" || value.op === "any") {
    if (Array.isArray(value.children)) {
      for (const [index, child] of value.children.entries()) {
        validatePredicateEvidenceCoverage(child, allowedKinds, `${path}.children[${index}]`, errors);
      }
    }
    return;
  }
  const requireExact = (kind: string) => {
    if (!allowedKinds.has(kind)) {
      errors.push(`${path} requires allowed_evidence_kinds to include '${kind}'`);
    }
  };
  const requireOneOf = (kinds: string[]) => {
    if (!kinds.some((kind) => allowedKinds.has(kind))) {
      errors.push(`${path} requires one of allowed_evidence_kinds: ${kinds.join(", ")}`);
    }
  };
  if (value.op === "item_count_gte") {
    requireExact("inventory");
  } else if (value.op === "held_item_is") {
    requireExact("held_item");
  } else if (value.op === "container_item_count_gte") {
    requireExact("container");
  } else if (value.op === "block_observed_at") {
    requireOneOf(["block_observation", "settlement", "tool_attempt"]);
  } else if (value.op === "position_within") {
    requireExact("actor_position");
    requireOneOf(["block_observation", "settlement", "tool_attempt"]);
  }
}

function validateCase(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  rejectUnknownKeys(value, caseKeys, path, errors);

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
    const milestoneIds = new Set<string>();
    for (const [index, milestone] of value.milestones.entries()) {
      validateMilestone(milestone, `${path}.milestones[${index}]`, errors);
      if (isRecord(milestone) && nonEmptyString(milestone.milestone_id)) {
        if (milestoneIds.has(milestone.milestone_id)) {
          errors.push(
            `${path}.milestones duplicate milestone_id '${milestone.milestone_id}'`
          );
        }
        milestoneIds.add(milestone.milestone_id);
      }
    }
  }

  validateAllowedEvidenceKinds(value.allowed_evidence_kinds, `${path}.allowed_evidence_kinds`, errors);
  const allowedKinds = new Set(
    Array.isArray(value.allowed_evidence_kinds)
      ? value.allowed_evidence_kinds.filter((entry): entry is string => typeof entry === "string")
      : []
  );
  validatePredicateEvidenceCoverage(value.target, allowedKinds, `${path}.target`, errors);
  if (Array.isArray(value.milestones)) {
    for (const [index, milestone] of value.milestones.entries()) {
      if (isRecord(milestone)) {
        validatePredicateEvidenceCoverage(
          milestone.predicate,
          allowedKinds,
          `${path}.milestones[${index}].predicate`,
          errors
        );
      }
    }
  }

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

function validateCapabilityDependencyGraph(
  cases: unknown[],
  errors: string[]
): void {
  const caseIds = new Set<string>();
  for (const [index, capabilityCase] of cases.entries()) {
    if (!isRecord(capabilityCase) || !nonEmptyString(capabilityCase.case_id)) {
      continue;
    }
    if (caseIds.has(capabilityCase.case_id)) {
      errors.push(
        `IndividualCapabilityManifest.cases duplicate case_id '${capabilityCase.case_id}'`
      );
    }
    caseIds.add(capabilityCase.case_id);
    void index;
  }

  const adjacency = new Map<string, string[]>();
  for (const [index, capabilityCase] of cases.entries()) {
    if (!isRecord(capabilityCase) || !nonEmptyString(capabilityCase.case_id)) {
      continue;
    }
    const caseId = capabilityCase.case_id;
    const deps = Array.isArray(capabilityCase.required_capabilities)
      ? capabilityCase.required_capabilities.filter(
          (entry): entry is string => typeof entry === "string" && entry.length > 0
        )
      : [];

    const internalDeps: string[] = [];
    for (const [depIndex, dep] of deps.entries()) {
      if (dep === caseId) {
        errors.push(
          `IndividualCapabilityManifest.cases[${index}].required_capabilities[${depIndex}] must not reference itself`
        );
        continue;
      }
      if (dep.startsWith("external:")) {
        continue;
      }
      if (!caseIds.has(dep)) {
        errors.push(
          `IndividualCapabilityManifest.cases[${index}].required_capabilities[${depIndex}] '${dep}' is not a suite case_id; use 'external:<id>' for external refs`
        );
        continue;
      }
      internalDeps.push(dep);
    }
    adjacency.set(caseId, internalDeps);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(node: string, stack: string[]): void {
    if (visited.has(node)) {
      return;
    }
    if (visiting.has(node)) {
      const cycleStart = stack.indexOf(node);
      const cycle = [...stack.slice(cycleStart), node].join(" -> ");
      errors.push(`IndividualCapabilityManifest.cases required_capabilities cycle: ${cycle}`);
      return;
    }
    visiting.add(node);
    for (const next of adjacency.get(node) ?? []) {
      visit(next, [...stack, node]);
    }
    visiting.delete(node);
    visited.add(node);
  }

  for (const caseId of caseIds) {
    visit(caseId, []);
  }
}

export function validateIndividualCapabilityManifest(value: unknown): ManifestValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["IndividualCapabilityManifest must be an object"] };
  }

  rejectUnknownKeys(value, manifestKeys, "IndividualCapabilityManifest", errors);

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
    validateCapabilityDependencyGraph(value.cases, errors);
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

export type { CapabilityAllowedEvidenceKindV1, CapabilityMilestoneV1, CapabilityPredicateV1 };
