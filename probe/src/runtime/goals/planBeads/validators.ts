import {
  planBeadCloseKinds,
  planBeadDependencyTypes,
  planBeadKinds,
  planBeadOperationConfidences,
  planBeadStatuses,
  type ActorPlanBead,
  type PlanBeadContextSummary,
  type PlanBeadDependency,
  type PlanBeadMetadataValue,
  type PlanBeadOperation,
  type PlanBeadPacket,
  type PlanBeadPriority
} from "./types.js";

type ValidationFailure = { ok: false; errors: string[] };

type ValidationResult<T, K extends string> =
  | ({ ok: true } & Record<K, T>)
  | ValidationFailure;

const noteKeys = [
  "completed",
  "in_progress",
  "blockers",
  "next",
  "key_decisions"
] as const;

const refKeys = [
  "evidence_refs",
  "memory_refs",
  "judgment_refs",
  "cycle_goal_refs",
  "relationship_refs",
  "world_event_refs",
  "action_skill_refs"
] as const;

const operationTypes = [
  "create",
  "update_notes",
  "set_status",
  "add_dependency"
] as const;

const authorityKeys = new Set([
  "args",
  "primitive_args",
  "primitive_id",
  "primitiveId",
  "allowed_primitive_ids",
  "allowedPrimitiveIds",
  "action_skill_id",
  "actionSkillId",
  "allowed_action_skill_ids",
  "allowedActionSkillIds",
  "actor_soul_patch",
  "life_goal_patch",
  "create_runtime_retry_constraint",
  "clear_runtime_retry_constraint",
  "retry_constraint_override",
  "runtime_retry_constraint",
  "physical_progress_claim"
]);

// PlanBead state must not smuggle execution authority such as primitive args,
// action skill ids, retry overrides, or physical-progress claims.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function includesString<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertString(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (!nonEmptyString(record[key])) {
    errors.push(`${path}.${key} must be a non-empty string`);
  }
}

function assertOptionalString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
) {
  if (record[key] !== undefined && !nonEmptyString(record[key])) {
    errors.push(`${path}.${key} must be a non-empty string when present`);
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

function assertTrue(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (record[key] !== true) {
    errors.push(`${path}.${key} must be true`);
  }
}

function assertFalse(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (record[key] !== false) {
    errors.push(`${path}.${key} must be false`);
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

function assertAllowedKeys(
  record: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
  errors: string[]
) {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      errors.push(`${path}.${key} is not a recognized PlanBead field`);
    }
  }
}

function isPriority(value: unknown): value is PlanBeadPriority {
  return Number.isInteger(value) && typeof value === "number" && value >= 0 && value <= 4;
}

function assertPriority(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (!isPriority(record[key])) {
    errors.push(`${path}.${key} must be an integer priority from 0 to 4`);
  }
}

function assertNonNegativeInteger(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
) {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    errors.push(`${path}.${key} must be a non-negative integer`);
  }
}

function assertMetadataValue(value: unknown, path: string, errors: string[]) {
  if (
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    (Array.isArray(value) && value.every((entry) => typeof entry === "string"))
  ) {
    return;
  }
  errors.push(`${path} must be a string, finite number, boolean, or string array`);
}

function collectAuthorityKeyErrors(value: unknown, path: string, errors: string[]) {
  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      collectAuthorityKeyErrors(entry, `${path}[${index}]`, errors);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (authorityKeys.has(key)) {
      errors.push(`${childPath} must not appear in PlanBead state or operations`);
    }
    collectAuthorityKeyErrors(entry, childPath, errors);
  }
}

function assertNotes(record: Record<string, unknown>, path: string, errors: string[]) {
  for (const key of noteKeys) {
    assertStringArray(record, key, path, errors);
  }
}

function assertRefs(record: Record<string, unknown>, path: string, errors: string[]) {
  for (const key of refKeys) {
    assertStringArray(record, key, path, errors);
  }
}

function validateContextSummary(
  value: unknown,
  path: string,
  errors: string[]
): value is PlanBeadContextSummary {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }
  assertString(value, "bead_id", path, errors);
  assertString(value, "title", path, errors);
  assertString(value, "description_summary", path, errors);
  assertString(value, "checkpoint_ref", path, errors);
  assertPriority(value, "priority", path, errors);
  assertNonNegativeInteger(value, "checkpoint_version", path, errors);
  assertStringArray(value, "acceptance_evidence_required", path, errors);
  assertStringArray(value, "notes_next", path, errors);
  assertStringArray(value, "blockers", path, errors);
  assertStringArray(value, "labels", path, errors);
  assertStringArray(value, "evidence_refs", path, errors);
  assertStringArray(value, "dependency_refs", path, errors);
  if (!includesString(planBeadKinds, value.kind)) {
    errors.push(`${path}.kind must be a known PlanBead kind`);
  }
  if (!includesString(planBeadStatuses, value.status)) {
    errors.push(`${path}.status must be a known PlanBead status`);
  }
  return true;
}

/**
 * Validates serialized PlanBead state before it enters the actor workspace or
 * provider context.
 */
export function validateActorPlanBead(
  value: unknown
): ValidationResult<ActorPlanBead, "bead"> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["ActorPlanBead must be an object"] };
  }

  collectAuthorityKeyErrors(value, "ActorPlanBead", errors);

  if (value.schema !== "actor-plan-bead/v1") {
    errors.push("ActorPlanBead.schema must be actor-plan-bead/v1");
  }
  assertString(value, "bead_id", "ActorPlanBead", errors);
  assertString(value, "actor_id", "ActorPlanBead", errors);
  assertString(value, "life_goal_id", "ActorPlanBead", errors);
  assertOptionalString(value, "run_id", "ActorPlanBead", errors);
  assertString(value, "title", "ActorPlanBead", errors);
  assertString(value, "description", "ActorPlanBead", errors);
  assertString(value, "design_notes", "ActorPlanBead", errors);
  assertPriority(value, "priority", "ActorPlanBead", errors);

  if (!includesString(planBeadKinds, value.kind)) {
    errors.push("ActorPlanBead.kind must be a known PlanBead kind");
  }
  if (!includesString(planBeadStatuses, value.status)) {
    errors.push("ActorPlanBead.status must be a known PlanBead status");
  }

  const acceptance = assertRecord(value, "acceptance_criteria", "ActorPlanBead", errors);
  if (acceptance) {
    assertStringArray(acceptance, "evidence_required", "ActorPlanBead.acceptance_criteria", errors);
    assertBoolean(
      acceptance,
      "non_physical_resolution_allowed",
      "ActorPlanBead.acceptance_criteria",
      errors
    );
  }

  const notes = assertRecord(value, "notes", "ActorPlanBead", errors);
  if (notes) {
    assertNotes(notes, "ActorPlanBead.notes", errors);
  }

  assertStringArray(value, "labels", "ActorPlanBead", errors);

  const metadata = assertRecord(value, "metadata", "ActorPlanBead", errors);
  if (metadata) {
    for (const [key, entry] of Object.entries(metadata)) {
      assertMetadataValue(entry, `ActorPlanBead.metadata.${key}`, errors);
    }
  }

  const refs = assertRecord(value, "refs", "ActorPlanBead", errors);
  if (refs) {
    assertRefs(refs, "ActorPlanBead.refs", errors);
  }

  const checkpoint = assertRecord(value, "checkpoint", "ActorPlanBead", errors);
  if (checkpoint) {
    assertNonNegativeInteger(checkpoint, "version", "ActorPlanBead.checkpoint", errors);
    assertString(checkpoint, "created_at", "ActorPlanBead.checkpoint", errors);
    assertString(checkpoint, "updated_at", "ActorPlanBead.checkpoint", errors);
    assertOptionalString(checkpoint, "last_touched_cycle_id", "ActorPlanBead.checkpoint", errors);
    assertStringArray(checkpoint, "evidence_refs", "ActorPlanBead.checkpoint", errors);
    if (checkpoint.close_kind !== undefined && !includesString(planBeadCloseKinds, checkpoint.close_kind)) {
      errors.push("ActorPlanBead.checkpoint.close_kind must be a known PlanBead close kind");
    }
    assertOptionalString(checkpoint, "close_reason", "ActorPlanBead.checkpoint", errors);
    if (value.status === "closed") {
      if (!includesString(planBeadCloseKinds, checkpoint.close_kind)) {
        errors.push("ActorPlanBead.checkpoint.close_kind is required when status is closed");
      }
      assertString(checkpoint, "close_reason", "ActorPlanBead.checkpoint", errors);
    }
  }

  const assertionPolicy = assertRecord(value, "assertion_policy", "ActorPlanBead", errors);
  if (assertionPolicy) {
    assertTrue(
      assertionPolicy,
      "bead_is_context_not_authority",
      "ActorPlanBead.assertion_policy",
      errors
    );
    assertTrue(
      assertionPolicy,
      "physical_success_requires_current_evidence",
      "ActorPlanBead.assertion_policy",
      errors
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, bead: value as ActorPlanBead };
}

export function validatePlanBeadDependency(
  value: unknown
): ValidationResult<PlanBeadDependency, "dependency"> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["PlanBeadDependency must be an object"] };
  }

  collectAuthorityKeyErrors(value, "PlanBeadDependency", errors);

  if (value.schema !== "actor-plan-bead-dependency/v1") {
    errors.push("PlanBeadDependency.schema must be actor-plan-bead-dependency/v1");
  }
  assertString(value, "actor_id", "PlanBeadDependency", errors);
  assertString(value, "bead_id", "PlanBeadDependency", errors);
  assertString(value, "depends_on_bead_id", "PlanBeadDependency", errors);
  assertString(value, "rationale", "PlanBeadDependency", errors);
  assertString(value, "created_at", "PlanBeadDependency", errors);
  assertStringArray(value, "evidence_refs", "PlanBeadDependency", errors);
  if (!includesString(planBeadDependencyTypes, value.type)) {
    errors.push("PlanBeadDependency.type must be a known dependency type");
  }
  if (
    nonEmptyString(value.bead_id) &&
    nonEmptyString(value.depends_on_bead_id) &&
    value.bead_id === value.depends_on_bead_id
  ) {
    errors.push("PlanBeadDependency must not reference the same bead as its dependency");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, dependency: value as PlanBeadDependency };
}

/**
 * Validates the compact packet sent to provider stages.
 *
 * The packet is rejected if it claims physical progress or weakens the rules
 * that keep PlanBeads subordinate to the action surface and runtime verifier.
 */
export function validatePlanBeadPacket(
  value: unknown
): ValidationResult<PlanBeadPacket, "packet"> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["PlanBeadPacket must be an object"] };
  }

  if (value.schema !== "plan-bead-packet/v1") {
    errors.push("PlanBeadPacket.schema must be plan-bead-packet/v1");
  }
  assertFalse(value, "physical_progress_claim", "PlanBeadPacket", errors);

  for (const key of ["ready_beads", "in_progress_beads", "blocked_beads"] as const) {
    const summaries = value[key];
    if (!Array.isArray(summaries)) {
      errors.push(`PlanBeadPacket.${key} must be an array`);
      continue;
    }
    for (const [index, summary] of summaries.entries()) {
      validateContextSummary(summary, `PlanBeadPacket.${key}[${index}]`, errors);
    }
  }

  if (!Array.isArray(value.recently_closed_beads)) {
    errors.push("PlanBeadPacket.recently_closed_beads must be an array");
  } else {
    for (const [index, closed] of value.recently_closed_beads.entries()) {
      const path = `PlanBeadPacket.recently_closed_beads[${index}]`;
      if (!isRecord(closed)) {
        errors.push(`${path} must be an object`);
        continue;
      }
      assertString(closed, "bead_id", path, errors);
      assertString(closed, "title", path, errors);
      assertString(closed, "close_reason", path, errors);
      assertStringArray(closed, "evidence_refs", path, errors);
      if (!includesString(planBeadCloseKinds, closed.close_kind)) {
        errors.push(`${path}.close_kind must be a known PlanBead close kind`);
      }
    }
  }

  const graphSummary = assertRecord(value, "graph_summary", "PlanBeadPacket", errors);
  if (graphSummary) {
    for (const key of [
      "open_count",
      "ready_count",
      "blocked_count",
      "deferred_count",
      "closed_recent_count"
    ] as const) {
      assertNonNegativeInteger(graphSummary, key, "PlanBeadPacket.graph_summary", errors);
    }
  }

  const rules = assertRecord(value, "rules", "PlanBeadPacket", errors);
  if (rules) {
    assertTrue(rules, "beads_are_context_not_authority", "PlanBeadPacket.rules", errors);
    assertTrue(rules, "ready_front_guides_goal_selection", "PlanBeadPacket.rules", errors);
    assertTrue(rules, "action_surface_controls_execution", "PlanBeadPacket.rules", errors);
    assertTrue(rules, "runtime_verifies_physical_progress", "PlanBeadPacket.rules", errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, packet: value as PlanBeadPacket };
}

function validateOperationBase(record: Record<string, unknown>, errors: string[]) {
  if (record.schema !== "plan-bead-operation/v1") {
    errors.push("PlanBeadOperation.schema must be plan-bead-operation/v1");
  }
  assertString(record, "actor_id", "PlanBeadOperation", errors);
  assertString(record, "rationale", "PlanBeadOperation", errors);
  assertStringArray(record, "evidence_refs", "PlanBeadOperation", errors);
  if (!includesString(planBeadOperationConfidences, record.confidence)) {
    errors.push("PlanBeadOperation.confidence must be observed, reviewed, inferred, or uncertain");
  }
  if (record.expected_checkpoint_version !== undefined) {
    assertNonNegativeInteger(
      record,
      "expected_checkpoint_version",
      "PlanBeadOperation",
      errors
    );
  }
}

function validateDependencyPatch(
  patch: Record<string, unknown>,
  path: string,
  errors: string[]
) {
  assertAllowedKeys(
    patch,
    ["bead_id", "depends_on_bead_id", "type", "rationale", "evidence_refs"],
    path,
    errors
  );
  assertString(patch, "bead_id", path, errors);
  assertString(patch, "depends_on_bead_id", path, errors);
  assertString(patch, "rationale", path, errors);
  assertStringArray(patch, "evidence_refs", path, errors);
  if (!includesString(planBeadDependencyTypes, patch.type)) {
    errors.push(`${path}.type must be a known dependency type`);
  }
  if (
    nonEmptyString(patch.bead_id) &&
    nonEmptyString(patch.depends_on_bead_id) &&
    patch.bead_id === patch.depends_on_bead_id
  ) {
    errors.push(`${path} must not reference the same bead as its dependency`);
  }
}

/**
 * Validates one proposed PlanBead operation.
 *
 * Malformed operations should be reported by the guarded applier instead of
 * causing the whole provider judgment to disappear.
 */
export function validatePlanBeadOperation(
  value: unknown
): ValidationResult<PlanBeadOperation, "operation"> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["PlanBeadOperation must be an object"] };
  }

  collectAuthorityKeyErrors(value, "PlanBeadOperation", errors);
  validateOperationBase(value, errors);

  if (!includesString(operationTypes, value.op)) {
    errors.push("PlanBeadOperation.op must be create, update_notes, set_status, or add_dependency");
  } else if (value.op === "create") {
    assertAllowedKeys(
      value,
      ["schema", "actor_id", "rationale", "evidence_refs", "confidence", "expected_checkpoint_version", "op", "patch"],
      "PlanBeadOperation",
      errors
    );
    const patch = assertRecord(value, "patch", "PlanBeadOperation", errors);
    if (patch) {
      assertAllowedKeys(
        patch,
        ["kind", "title", "description", "acceptance_evidence_required", "notes_next", "priority"],
        "PlanBeadOperation.patch",
        errors
      );
      if (!includesString(planBeadKinds, patch.kind)) {
        errors.push("PlanBeadOperation.patch.kind must be a known PlanBead kind");
      }
      assertString(patch, "title", "PlanBeadOperation.patch", errors);
      assertString(patch, "description", "PlanBeadOperation.patch", errors);
      assertStringArray(patch, "acceptance_evidence_required", "PlanBeadOperation.patch", errors);
      assertStringArray(patch, "notes_next", "PlanBeadOperation.patch", errors);
      assertPriority(patch, "priority", "PlanBeadOperation.patch", errors);
    }
  } else if (value.op === "update_notes") {
    assertAllowedKeys(
      value,
      ["schema", "actor_id", "rationale", "evidence_refs", "confidence", "expected_checkpoint_version", "op", "bead_id", "patch"],
      "PlanBeadOperation",
      errors
    );
    assertString(value, "bead_id", "PlanBeadOperation", errors);
    const patch = assertRecord(value, "patch", "PlanBeadOperation", errors);
    if (patch) {
      assertAllowedKeys(patch, noteKeys, "PlanBeadOperation.patch", errors);
      if (Object.keys(patch).length === 0) {
        errors.push("PlanBeadOperation.patch must include at least one notes field");
      }
      for (const key of noteKeys) {
        if (patch[key] !== undefined) {
          assertStringArray(patch, key, "PlanBeadOperation.patch", errors);
        }
      }
    }
  } else if (value.op === "set_status") {
    assertAllowedKeys(
      value,
      ["schema", "actor_id", "rationale", "evidence_refs", "confidence", "expected_checkpoint_version", "op", "bead_id", "patch"],
      "PlanBeadOperation",
      errors
    );
    assertString(value, "bead_id", "PlanBeadOperation", errors);
    const patch = assertRecord(value, "patch", "PlanBeadOperation", errors);
    if (patch) {
      assertAllowedKeys(patch, ["status", "close_kind", "close_reason"], "PlanBeadOperation.patch", errors);
      if (!includesString(planBeadStatuses, patch.status)) {
        errors.push("PlanBeadOperation.patch.status must be a known PlanBead status");
      }
      if (patch.close_kind !== undefined && !includesString(planBeadCloseKinds, patch.close_kind)) {
        errors.push("PlanBeadOperation.patch.close_kind must be a known PlanBead close kind");
      }
      assertOptionalString(patch, "close_reason", "PlanBeadOperation.patch", errors);
      if (patch.status === "closed") {
        if (!includesString(planBeadCloseKinds, patch.close_kind)) {
          errors.push("PlanBeadOperation.patch.close_kind is required when setting closed status");
        }
        assertString(patch, "close_reason", "PlanBeadOperation.patch", errors);
      }
    }
  } else if (value.op === "add_dependency") {
    assertAllowedKeys(
      value,
      ["schema", "actor_id", "rationale", "evidence_refs", "confidence", "expected_checkpoint_version", "op", "patch"],
      "PlanBeadOperation",
      errors
    );
    const patch = assertRecord(value, "patch", "PlanBeadOperation", errors);
    if (patch) {
      validateDependencyPatch(patch, "PlanBeadOperation.patch", errors);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, operation: value as PlanBeadOperation };
}

export function assertValidActorPlanBead(value: unknown): ActorPlanBead {
  const result = validateActorPlanBead(value);
  if (!result.ok) {
    throw new Error(`Invalid ActorPlanBead: ${result.errors.join("; ")}`);
  }
  return result.bead;
}

export function assertValidPlanBeadDependency(value: unknown): PlanBeadDependency {
  const result = validatePlanBeadDependency(value);
  if (!result.ok) {
    throw new Error(`Invalid PlanBeadDependency: ${result.errors.join("; ")}`);
  }
  return result.dependency;
}

export function assertValidPlanBeadPacket(value: unknown): PlanBeadPacket {
  const result = validatePlanBeadPacket(value);
  if (!result.ok) {
    throw new Error(`Invalid PlanBeadPacket: ${result.errors.join("; ")}`);
  }
  return result.packet;
}

export function assertValidPlanBeadOperation(value: unknown): PlanBeadOperation {
  const result = validatePlanBeadOperation(value);
  if (!result.ok) {
    throw new Error(`Invalid PlanBeadOperation: ${result.errors.join("; ")}`);
  }
  return result.operation;
}
