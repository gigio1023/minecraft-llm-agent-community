import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { parseWorldScenarioId, worldScenarioIds } from "../../server/worldScenarios.js";
import type {
  InterdependentSocialScenarioV1,
  SocialCapabilityRequirementV1
} from "./types.js";
import { INTERDEPENDENT_SOCIAL_SCENARIO_SCHEMA } from "./types.js";

type ValidationFailure = { ok: false; errors: string[] };

export type SocialScenarioValidationResult =
  | { ok: true; scenario: InterdependentSocialScenarioV1 }
  | ValidationFailure;

export type ValidateSocialScenarioOptions = {
  /**
   * When provided, every `evidence_status: "resolved"` capability_case_id must
   * appear in this set. Gaps never require membership.
   */
  knownCapabilityCaseIds?: ReadonlySet<string> | readonly string[];
};

const fixtureClasses = ["natural_world", "command_fixture", "mixed"] as const;
const roleAssignmentModes = ["assigned", "negotiable", "unassigned"] as const;
const asymmetryKinds = ["resource", "access", "information"] as const;
const asymmetryVisibility = ["all", "holders", "none"] as const;
const activityKinds = ["economic", "cooperative", "quest"] as const;
const activityDependencies = [
  "resource_flow",
  "shared_infrastructure",
  "competing_demand",
  "sequential_unlock"
] as const;
const materialStakeKinds = [
  "possession",
  "access",
  "place",
  "station",
  "tool",
  "food",
  "cache",
  "shared_infrastructure"
] as const;
const provenanceSourceKinds = ["authored", "catalog_derived", "experimental"] as const;
const evidenceStatuses = ["resolved", "declared_gap"] as const;

const scenarioKeys = [
  "schema",
  "scenario_id",
  "version",
  "title",
  "description",
  "world_scenario_id",
  "fixture_class",
  "fixture_progress_credited_to_actors",
  "social_response_prescribed",
  "actor_count",
  "actor_profiles",
  "model_assignment",
  "role_assignment_mode",
  "asymmetries",
  "activity_graph",
  "required_capabilities",
  "interaction_opportunities",
  "material_stakes",
  "response_window",
  "metrics",
  "visual",
  "budgets",
  "provenance"
] as const;

const actorProfileKeys = ["actor_id", "profile_ref", "assigned_setup_role"] as const;
const modelAssignmentKeys = ["comparable_capability", "assignments"] as const;
const modelActorAssignmentKeys = ["actor_id", "provider_id", "model"] as const;
const asymmetryKeys = [
  "asymmetry_id",
  "kind",
  "description",
  "visible_to",
  "holder_actor_ids",
  "subject"
] as const;
const activityGraphKeys = ["nodes", "edges"] as const;
const activityNodeKeys = ["activity_id", "kind", "title", "description"] as const;
const activityEdgeKeys = [
  "from_activity_id",
  "to_activity_id",
  "dependency",
  "description"
] as const;
const capabilityResolvedKeys = [
  "capability_case_id",
  "evidence_status",
  "evidence_ref",
  "suite_id"
] as const;
const capabilityGapKeys = ["capability_case_id", "evidence_status", "gap_reason"] as const;
const interactionOpportunityKeys = [
  "opportunity_id",
  "description",
  "involved_actor_ids"
] as const;
const materialStakeKeys = [
  "stake_id",
  "kind",
  "description",
  "affected_actor_ids"
] as const;
const responseWindowKeys = ["require_subsequent_actor_turn", "timeout_ms"] as const;
const metricsKeys = [
  "record_goal_series",
  "record_action_series",
  "record_resource_series",
  "record_interaction_series",
  "record_spatial_series"
] as const;
const visualKeys = [
  "capture_first_person",
  "capture_third_person",
  "capture_video",
  "pixels_are_review_only"
] as const;
const budgetKeys = [
  "max_cycles",
  "max_runtime_actions_per_actor",
  "max_wall_time_ms",
  "max_provider_requests",
  "max_total_tokens",
  "max_estimated_cost"
] as const;
const provenanceKeys = ["source_kind", "source_ref", "reset_refs", "notes"] as const;

/** Explicit social-prescription / strategy keys rejected with a focused message. */
const forbiddenPrescriptionKeys = [
  "prescribed_trust",
  "expected_trust",
  "prescribed_cooperation",
  "expected_cooperation",
  "prescribed_refusal",
  "expected_refusal",
  "prescribed_specialization",
  "expected_specialization",
  "prescribed_partner",
  "expected_partner",
  "partner_choice",
  "prescribed_promises",
  "expected_promises",
  "relationship_label",
  "expected_relationship",
  "prescribed_relationship",
  "social_outcome",
  "expected_social_outcome",
  "prescribed_social_outcome",
  "recommended_actions",
  "action_order",
  "action_plan",
  "hidden_action_plan",
  "parameter_suggestions",
  "suggested_parameters",
  "division_of_labor",
  "required_response"
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

function rejectUnknownKeys(
  record: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  errors: string[]
) {
  for (const key of Object.keys(record)) {
    if (includesString(forbiddenPrescriptionKeys, key)) {
      errors.push(
        `${path}.${key} is forbidden: scenarios must not prescribe social responses, partners, promises, relationships, or hidden action plans`
      );
      continue;
    }
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

function assertBoolean(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (typeof record[key] !== "boolean") {
    errors.push(`${path}.${key} must be a boolean`);
  }
}

function assertLiteralFalse(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
) {
  if (record[key] !== false) {
    errors.push(`${path}.${key} must be false`);
  }
}

function assertLiteralTrue(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
) {
  if (record[key] !== true) {
    errors.push(`${path}.${key} must be true`);
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

function assertActorIdArray(
  value: unknown,
  path: string,
  knownActorIds: ReadonlySet<string>,
  errors: string[]
): string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string" && entry.length > 0)) {
    errors.push(`${path} must be a non-empty string array of actor_ids`);
    return [];
  }
  if (value.length === 0) {
    errors.push(`${path} must be a non-empty string array of actor_ids`);
    return [];
  }
  const ids = value as string[];
  for (const [index, actorId] of ids.entries()) {
    if (!knownActorIds.has(actorId)) {
      errors.push(`${path}[${index}] '${actorId}' is not a declared actor_id`);
    }
  }
  return ids;
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

function toKnownCaseSet(
  known?: ReadonlySet<string> | readonly string[]
): ReadonlySet<string> | null {
  if (!known) {
    return null;
  }
  return known instanceof Set ? known : new Set(known);
}

function validateActorProfiles(
  value: unknown,
  path: string,
  roleMode: unknown,
  errors: string[]
): Set<string> {
  const actorIds = new Set<string>();
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return actorIds;
  }

  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(entry, actorProfileKeys, entryPath, errors);
    assertString(entry, "actor_id", entryPath, errors);
    assertString(entry, "profile_ref", entryPath, errors);

    if (roleMode === "assigned") {
      assertString(entry, "assigned_setup_role", entryPath, errors);
    } else if (entry.assigned_setup_role !== undefined) {
      errors.push(
        `${entryPath}.assigned_setup_role must be absent when role_assignment_mode is '${String(roleMode)}'`
      );
    }

    if (nonEmptyString(entry.actor_id)) {
      if (actorIds.has(entry.actor_id)) {
        errors.push(`${entryPath}.actor_id duplicate '${entry.actor_id}'`);
      }
      actorIds.add(entry.actor_id);
    }
  }

  return actorIds;
}

function validateModelAssignment(
  value: unknown,
  path: string,
  knownActorIds: ReadonlySet<string>,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, modelAssignmentKeys, path, errors);
  assertBoolean(value, "comparable_capability", path, errors);

  const assignments = value.assignments;
  if (!Array.isArray(assignments) || assignments.length === 0) {
    errors.push(`${path}.assignments must be a non-empty array`);
    return;
  }

  const seen = new Set<string>();
  for (const [index, assignment] of assignments.entries()) {
    const entryPath = `${path}.assignments[${index}]`;
    if (!isRecord(assignment)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(assignment, modelActorAssignmentKeys, entryPath, errors);
    assertString(assignment, "actor_id", entryPath, errors);
    assertString(assignment, "provider_id", entryPath, errors);
    assertString(assignment, "model", entryPath, errors);

    if (nonEmptyString(assignment.actor_id)) {
      if (!knownActorIds.has(assignment.actor_id)) {
        errors.push(`${entryPath}.actor_id '${assignment.actor_id}' is not a declared actor_id`);
      }
      if (seen.has(assignment.actor_id)) {
        errors.push(`${entryPath}.actor_id duplicate model assignment for '${assignment.actor_id}'`);
      }
      seen.add(assignment.actor_id);
    }
  }

  for (const actorId of knownActorIds) {
    if (!seen.has(actorId)) {
      errors.push(`${path}.assignments missing model assignment for actor_id '${actorId}'`);
    }
  }
}

function validateAsymmetries(
  value: unknown,
  path: string,
  knownActorIds: ReadonlySet<string>,
  errors: string[]
): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }
  if (value.length === 0) {
    errors.push(`${path} must contain at least one asymmetry`);
    return;
  }

  const ids = new Set<string>();
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(entry, asymmetryKeys, entryPath, errors);
    assertString(entry, "asymmetry_id", entryPath, errors);
    assertString(entry, "description", entryPath, errors);
    assertString(entry, "subject", entryPath, errors);

    if (!includesString(asymmetryKinds, entry.kind)) {
      errors.push(`${entryPath}.kind must be one of: ${asymmetryKinds.join(", ")}`);
    }
    if (!includesString(asymmetryVisibility, entry.visible_to)) {
      errors.push(`${entryPath}.visible_to must be one of: ${asymmetryVisibility.join(", ")}`);
    }

    assertActorIdArray(entry.holder_actor_ids, `${entryPath}.holder_actor_ids`, knownActorIds, errors);

    if (nonEmptyString(entry.asymmetry_id)) {
      if (ids.has(entry.asymmetry_id)) {
        errors.push(`${entryPath}.asymmetry_id duplicate '${entry.asymmetry_id}'`);
      }
      ids.add(entry.asymmetry_id);
    }
  }
}

function validateActivityGraph(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, activityGraphKeys, path, errors);

  const nodeIds = new Set<string>();
  if (!Array.isArray(value.nodes) || value.nodes.length === 0) {
    errors.push(`${path}.nodes must be a non-empty array`);
  } else {
    for (const [index, node] of value.nodes.entries()) {
      const nodePath = `${path}.nodes[${index}]`;
      if (!isRecord(node)) {
        errors.push(`${nodePath} must be an object`);
        continue;
      }
      rejectUnknownKeys(node, activityNodeKeys, nodePath, errors);
      assertString(node, "activity_id", nodePath, errors);
      assertString(node, "title", nodePath, errors);
      assertString(node, "description", nodePath, errors);
      if (!includesString(activityKinds, node.kind)) {
        errors.push(`${nodePath}.kind must be one of: ${activityKinds.join(", ")}`);
      }
      if (nonEmptyString(node.activity_id)) {
        if (nodeIds.has(node.activity_id)) {
          errors.push(`${nodePath}.activity_id duplicate '${node.activity_id}'`);
        }
        nodeIds.add(node.activity_id);
      }
    }
  }

  if (!Array.isArray(value.edges)) {
    errors.push(`${path}.edges must be an array`);
    return;
  }

  for (const [index, edge] of value.edges.entries()) {
    const edgePath = `${path}.edges[${index}]`;
    if (!isRecord(edge)) {
      errors.push(`${edgePath} must be an object`);
      continue;
    }
    rejectUnknownKeys(edge, activityEdgeKeys, edgePath, errors);
    assertString(edge, "from_activity_id", edgePath, errors);
    assertString(edge, "to_activity_id", edgePath, errors);
    assertString(edge, "description", edgePath, errors);
    if (!includesString(activityDependencies, edge.dependency)) {
      errors.push(`${edgePath}.dependency must be one of: ${activityDependencies.join(", ")}`);
    }
    if (nonEmptyString(edge.from_activity_id) && !nodeIds.has(edge.from_activity_id)) {
      errors.push(
        `${edgePath}.from_activity_id '${edge.from_activity_id}' is not a declared activity_id`
      );
    }
    if (nonEmptyString(edge.to_activity_id) && !nodeIds.has(edge.to_activity_id)) {
      errors.push(
        `${edgePath}.to_activity_id '${edge.to_activity_id}' is not a declared activity_id`
      );
    }
  }
}

function validateCapabilityRequirement(
  value: unknown,
  path: string,
  knownCases: ReadonlySet<string> | null,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }

  const status = value.evidence_status;
  if (!includesString(evidenceStatuses, status)) {
    errors.push(
      `${path}.evidence_status must be 'resolved' or 'declared_gap' (capability refs must resolve or explicitly declare a gap)`
    );
    rejectUnknownKeys(value, ["capability_case_id", "evidence_status"], path, errors);
    return;
  }

  if (status === "resolved") {
    rejectUnknownKeys(value, capabilityResolvedKeys, path, errors);
    assertString(value, "capability_case_id", path, errors);
    assertString(value, "evidence_ref", path, errors);
    if (value.suite_id !== undefined) {
      assertString(value, "suite_id", path, errors);
    }
    if (knownCases && nonEmptyString(value.capability_case_id)) {
      if (!knownCases.has(value.capability_case_id)) {
        errors.push(
          `${path}.capability_case_id '${value.capability_case_id}' does not resolve to a known capability case; use evidence_status 'declared_gap' or a resolvable case id`
        );
      }
    }
    return;
  }

  rejectUnknownKeys(value, capabilityGapKeys, path, errors);
  assertString(value, "capability_case_id", path, errors);
  assertString(value, "gap_reason", path, errors);
}

function validateRequiredCapabilities(
  value: unknown,
  path: string,
  knownCases: ReadonlySet<string> | null,
  errors: string[]
): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  const ids = new Set<string>();
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    validateCapabilityRequirement(entry, entryPath, knownCases, errors);
    if (isRecord(entry) && nonEmptyString(entry.capability_case_id)) {
      if (ids.has(entry.capability_case_id)) {
        errors.push(`${entryPath}.capability_case_id duplicate '${entry.capability_case_id}'`);
      }
      ids.add(entry.capability_case_id);
    }
  }
}

function validateInteractionOpportunities(
  value: unknown,
  path: string,
  knownActorIds: ReadonlySet<string>,
  errors: string[]
): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  const ids = new Set<string>();
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(entry, interactionOpportunityKeys, entryPath, errors);
    assertString(entry, "opportunity_id", entryPath, errors);
    assertString(entry, "description", entryPath, errors);
    const involved = assertActorIdArray(
      entry.involved_actor_ids,
      `${entryPath}.involved_actor_ids`,
      knownActorIds,
      errors
    );
    if (involved.length < 2) {
      errors.push(`${entryPath}.involved_actor_ids must include at least two actors`);
    }
    if (nonEmptyString(entry.opportunity_id)) {
      if (ids.has(entry.opportunity_id)) {
        errors.push(`${entryPath}.opportunity_id duplicate '${entry.opportunity_id}'`);
      }
      ids.add(entry.opportunity_id);
    }
  }
}

function validateMaterialStakes(
  value: unknown,
  path: string,
  knownActorIds: ReadonlySet<string>,
  errors: string[]
): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }

  const ids = new Set<string>();
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(entry, materialStakeKeys, entryPath, errors);
    assertString(entry, "stake_id", entryPath, errors);
    assertString(entry, "description", entryPath, errors);
    if (!includesString(materialStakeKinds, entry.kind)) {
      errors.push(`${entryPath}.kind must be one of: ${materialStakeKinds.join(", ")}`);
    }
    assertActorIdArray(
      entry.affected_actor_ids,
      `${entryPath}.affected_actor_ids`,
      knownActorIds,
      errors
    );
    if (nonEmptyString(entry.stake_id)) {
      if (ids.has(entry.stake_id)) {
        errors.push(`${entryPath}.stake_id duplicate '${entry.stake_id}'`);
      }
      ids.add(entry.stake_id);
    }
  }
}

function validateResponseWindow(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, responseWindowKeys, path, errors);
  assertLiteralTrue(value, "require_subsequent_actor_turn", path, errors);
  assertPositiveIntegerField(value, "timeout_ms", path, errors);
}

function validateMetrics(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, metricsKeys, path, errors);
  for (const key of metricsKeys) {
    assertBoolean(value, key, path, errors);
  }
}

function validateVisual(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, visualKeys, path, errors);
  assertBoolean(value, "capture_first_person", path, errors);
  assertBoolean(value, "capture_third_person", path, errors);
  assertBoolean(value, "capture_video", path, errors);
  assertLiteralTrue(value, "pixels_are_review_only", path, errors);
}

function validateBudgets(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, budgetKeys, path, errors);
  assertPositiveIntegerField(value, "max_cycles", path, errors);
  assertPositiveIntegerField(value, "max_runtime_actions_per_actor", path, errors);
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

function validateProvenance(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, provenanceKeys, path, errors);
  if (!includesString(provenanceSourceKinds, value.source_kind)) {
    errors.push(`${path}.source_kind must be one of: ${provenanceSourceKinds.join(", ")}`);
  }
  assertString(value, "source_ref", path, errors);
  if (
    !Array.isArray(value.reset_refs) ||
    !value.reset_refs.every((entry) => typeof entry === "string" && entry.length > 0)
  ) {
    errors.push(`${path}.reset_refs must be a string array`);
  }
  if (value.notes !== undefined) {
    assertString(value, "notes", path, errors);
  }
}

export function validateInterdependentSocialScenario(
  value: unknown,
  options: ValidateSocialScenarioOptions = {}
): SocialScenarioValidationResult {
  const errors: string[] = [];
  const knownCases = toKnownCaseSet(options.knownCapabilityCaseIds);

  if (!isRecord(value)) {
    return { ok: false, errors: ["InterdependentSocialScenario must be an object"] };
  }

  rejectUnknownKeys(value, scenarioKeys, "InterdependentSocialScenario", errors);

  if (value.schema !== INTERDEPENDENT_SOCIAL_SCENARIO_SCHEMA) {
    errors.push(`schema must be '${INTERDEPENDENT_SOCIAL_SCENARIO_SCHEMA}'`);
  }

  assertString(value, "scenario_id", "InterdependentSocialScenario", errors);
  assertString(value, "version", "InterdependentSocialScenario", errors);
  assertString(value, "title", "InterdependentSocialScenario", errors);
  assertString(value, "description", "InterdependentSocialScenario", errors);
  assertWorldScenarioId(value, "world_scenario_id", "InterdependentSocialScenario", errors);

  if (!includesString(fixtureClasses, value.fixture_class)) {
    errors.push(
      `InterdependentSocialScenario.fixture_class must be one of: ${fixtureClasses.join(", ")}`
    );
  }

  assertLiteralFalse(
    value,
    "fixture_progress_credited_to_actors",
    "InterdependentSocialScenario",
    errors
  );
  assertLiteralFalse(value, "social_response_prescribed", "InterdependentSocialScenario", errors);

  if (!isPositiveInteger(value.actor_count)) {
    errors.push("InterdependentSocialScenario.actor_count must be a positive integer");
  } else if (value.actor_count < 2) {
    errors.push("InterdependentSocialScenario.actor_count must be at least 2");
  }

  if (!includesString(roleAssignmentModes, value.role_assignment_mode)) {
    errors.push(
      `InterdependentSocialScenario.role_assignment_mode must be one of: ${roleAssignmentModes.join(", ")}`
    );
  }

  const actorIds = validateActorProfiles(
    value.actor_profiles,
    "InterdependentSocialScenario.actor_profiles",
    value.role_assignment_mode,
    errors
  );

  if (
    isPositiveInteger(value.actor_count) &&
    Array.isArray(value.actor_profiles) &&
    value.actor_count !== value.actor_profiles.length
  ) {
    errors.push(
      `InterdependentSocialScenario.actor_count (${value.actor_count}) must equal actor_profiles.length (${value.actor_profiles.length})`
    );
  }

  const modelAssignment = assertRecord(
    value,
    "model_assignment",
    "InterdependentSocialScenario",
    errors
  );
  if (modelAssignment) {
    validateModelAssignment(
      modelAssignment,
      "InterdependentSocialScenario.model_assignment",
      actorIds,
      errors
    );
  }

  validateAsymmetries(
    value.asymmetries,
    "InterdependentSocialScenario.asymmetries",
    actorIds,
    errors
  );

  const activityGraph = assertRecord(
    value,
    "activity_graph",
    "InterdependentSocialScenario",
    errors
  );
  if (activityGraph) {
    validateActivityGraph(activityGraph, "InterdependentSocialScenario.activity_graph", errors);
  }

  validateRequiredCapabilities(
    value.required_capabilities,
    "InterdependentSocialScenario.required_capabilities",
    knownCases,
    errors
  );

  validateInteractionOpportunities(
    value.interaction_opportunities,
    "InterdependentSocialScenario.interaction_opportunities",
    actorIds,
    errors
  );

  validateMaterialStakes(
    value.material_stakes,
    "InterdependentSocialScenario.material_stakes",
    actorIds,
    errors
  );

  const responseWindow = assertRecord(
    value,
    "response_window",
    "InterdependentSocialScenario",
    errors
  );
  if (responseWindow) {
    validateResponseWindow(responseWindow, "InterdependentSocialScenario.response_window", errors);
  }

  const metrics = assertRecord(value, "metrics", "InterdependentSocialScenario", errors);
  if (metrics) {
    validateMetrics(metrics, "InterdependentSocialScenario.metrics", errors);
  }

  const visual = assertRecord(value, "visual", "InterdependentSocialScenario", errors);
  if (visual) {
    validateVisual(visual, "InterdependentSocialScenario.visual", errors);
  }

  const budgets = assertRecord(value, "budgets", "InterdependentSocialScenario", errors);
  if (budgets) {
    validateBudgets(budgets, "InterdependentSocialScenario.budgets", errors);
  }

  const provenance = assertRecord(value, "provenance", "InterdependentSocialScenario", errors);
  if (provenance) {
    validateProvenance(provenance, "InterdependentSocialScenario.provenance", errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, scenario: value as InterdependentSocialScenarioV1 };
}

export function assertInterdependentSocialScenario(
  value: unknown,
  options: ValidateSocialScenarioOptions = {}
): InterdependentSocialScenarioV1 {
  const result = validateInterdependentSocialScenario(value, options);
  if (!result.ok) {
    throw new Error(`Invalid InterdependentSocialScenario: ${result.errors.join("; ")}`);
  }
  return result.scenario;
}

export function loadInterdependentSocialScenarioFromFile(
  path: string,
  options: ValidateSocialScenarioOptions = {}
): InterdependentSocialScenarioV1 {
  const raw = readFileSync(path, "utf8");
  const parsed: unknown = JSON.parse(raw);
  return assertInterdependentSocialScenario(parsed, options);
}

/** Stable JSON stringify with sorted object keys for content hashing. */
export function stableJsonStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJsonStringify(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(record[key])}`)
    .join(",")}}`;
}

/** Deterministic SHA-256 hex digest of a validated scenario declaration. */
export function hashInterdependentSocialScenario(
  scenario: InterdependentSocialScenarioV1
): string {
  return createHash("sha256").update(stableJsonStringify(scenario)).digest("hex");
}

export type { SocialCapabilityRequirementV1 };
