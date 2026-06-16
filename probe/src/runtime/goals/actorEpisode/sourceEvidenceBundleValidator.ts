/**
 * Validator for the Actor Turn source evidence companion packet.
 *
 * @remarks This stays separate from the larger Actor Episode validator module so
 * source evidence rules can evolve without turning `validators.ts` into a mixed
 * contract registry. The bundle is context only, but it must still be shaped
 * enough that compact summaries cannot quietly lose their source cards.
 */
import { evidenceTraceOutcomes } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function assertString(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  if (!nonEmptyString(record[key])) {
    errors.push(`${path}.${key} must be a non-empty string`);
  }
}

function assertStringArray(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  const value = record[key];
  if (
    !Array.isArray(value) ||
    !value.every((entry) => typeof entry === "string" && entry.length > 0)
  ) {
    errors.push(`${path}.${key} must be a string array`);
  }
}

function assertArray(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  const value = record[key];
  if (!Array.isArray(value)) {
    errors.push(`${path}.${key} must be an array`);
    return [];
  }
  return value;
}

function assertNonNegativeNumber(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  const value = record[key];
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    errors.push(`${path}.${key} must be a non-negative number`);
  }
}

function assertOptionalNumber(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  const value = record[key];
  if (value !== undefined && (typeof value !== "number" || Number.isNaN(value))) {
    errors.push(`${path}.${key} must be a number when present`);
  }
}

function assertOptionalBoolean(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  const value = record[key];
  if (value !== undefined && typeof value !== "boolean") {
    errors.push(`${path}.${key} must be boolean when present`);
  }
}

function assertOptionalPosition(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  const value = record[key];
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    errors.push(`${path}.${key} must be an object when present`);
    return;
  }
  for (const axis of ["x", "y", "z"] as const) {
    if (typeof value[axis] !== "number" || Number.isNaN(value[axis])) {
      errors.push(`${path}.${key}.${axis} must be a number`);
    }
  }
}

function assertRecord(record: Record<string, unknown>, key: string, path: string, errors: string[]) {
  const value = record[key];
  if (!isRecord(value)) {
    errors.push(`${path}.${key} must be an object`);
    return null;
  }
  return value;
}

function validateInventoryItem(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  assertString(value, "name", path, errors);
  assertNonNegativeNumber(value, "count", path, errors);
}

function validateVisibleActor(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  assertString(value, "id", path, errors);
  assertOptionalNumber(value, "distance", path, errors);
  assertOptionalBoolean(value, "busy", path, errors);
}

function validateNearbyBlock(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  assertString(value, "name", path, errors);
  if (
    value.source !== "world_scan_nearest" &&
    value.source !== "observation_nearby_block"
  ) {
    errors.push(`${path}.source must be world_scan_nearest or observation_nearby_block`);
  }
  assertOptionalPosition(value, "position", path, errors);
  assertOptionalNumber(value, "distance", path, errors);
  assertStringArray(value, "evidence_refs", path, errors);
}

function validateToolStatus(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  assertString(value, "tool", path, errors);
  assertString(value, "status", path, errors);
}

function validateRecentActionDetail(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  assertString(value, "turn_id", path, errors);
  assertString(value, "episode_id", path, errors);
  if (
    typeof value.outcome !== "string" ||
    !evidenceTraceOutcomes.includes(value.outcome as (typeof evidenceTraceOutcomes)[number])
  ) {
    errors.push(`${path}.outcome must be a known evidence outcome`);
  }
  assertString(value, "compact_summary", path, errors);
  assertStringArray(value, "evidence_refs", path, errors);
  const selectedAction = value.selected_action;
  if (selectedAction !== undefined) {
    if (!isRecord(selectedAction)) {
      errors.push(`${path}.selected_action must be an object when present`);
    } else {
      assertString(selectedAction, "kind", `${path}.selected_action`, errors);
      assertString(selectedAction, "id", `${path}.selected_action`, errors);
    }
  }
  if (value.tool_statuses !== undefined) {
    for (const [index, status] of assertArray(value, "tool_statuses", path, errors).entries()) {
      validateToolStatus(status, `${path}.tool_statuses[${index}]`, errors);
    }
  }
}

function validatePlanBeadCard(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  assertString(value, "bead_id", path, errors);
  assertString(value, "title", path, errors);
  assertString(value, "status", path, errors);
  assertNonNegativeNumber(value, "priority", path, errors);
  assertString(value, "why_it_matters", path, errors);
  assertStringArray(value, "next_hints", path, errors);
  assertStringArray(value, "blockers", path, errors);
  assertStringArray(value, "acceptance_evidence_required", path, errors);
  assertStringArray(value, "evidence_refs", path, errors);
  assertStringArray(value, "dependency_refs", path, errors);
  assertString(value, "checkpoint_ref", path, errors);
}

export function validateSourceEvidenceBundle(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (value.schema !== "actor-turn-source-evidence-bundle/v1") {
    errors.push(`${path}.schema must be actor-turn-source-evidence-bundle/v1`);
  }
  const observation = assertRecord(value, "observation", path, errors);
  if (observation) {
    assertStringArray(observation, "observation_refs", `${path}.observation`, errors);
    assertOptionalPosition(observation, "position", `${path}.observation`, errors);
    for (const [index, item] of assertArray(observation, "inventory_items", `${path}.observation`, errors).entries()) {
      validateInventoryItem(item, `${path}.observation.inventory_items[${index}]`, errors);
    }
    for (const [index, actor] of assertArray(observation, "visible_actors", `${path}.observation`, errors).entries()) {
      validateVisibleActor(actor, `${path}.observation.visible_actors[${index}]`, errors);
    }
    for (const [index, block] of assertArray(observation, "nearby_blocks", `${path}.observation`, errors).entries()) {
      validateNearbyBlock(block, `${path}.observation.nearby_blocks[${index}]`, errors);
    }
  }
  for (const [index, event] of assertArray(value, "world_event_cards", path, errors).entries()) {
    if (!isRecord(event)) {
      errors.push(`${path}.world_event_cards[${index}] must be an object`);
      continue;
    }
    assertString(event, "event_id", `${path}.world_event_cards[${index}]`, errors);
    assertString(event, "kind", `${path}.world_event_cards[${index}]`, errors);
    assertString(event, "authority", `${path}.world_event_cards[${index}]`, errors);
    assertString(event, "summary", `${path}.world_event_cards[${index}]`, errors);
    assertStringArray(event, "actor_refs", `${path}.world_event_cards[${index}]`, errors);
    assertStringArray(event, "evidence_refs", `${path}.world_event_cards[${index}]`, errors);
    assertString(event, "created_at", `${path}.world_event_cards[${index}]`, errors);
  }
  for (const [index, memory] of assertArray(value, "memory_cards", path, errors).entries()) {
    if (!isRecord(memory)) {
      errors.push(`${path}.memory_cards[${index}] must be an object`);
      continue;
    }
    assertString(memory, "memory_id", `${path}.memory_cards[${index}]`, errors);
    assertString(memory, "kind", `${path}.memory_cards[${index}]`, errors);
    assertString(memory, "layer", `${path}.memory_cards[${index}]`, errors);
    assertString(memory, "confidence", `${path}.memory_cards[${index}]`, errors);
    assertString(memory, "summary", `${path}.memory_cards[${index}]`, errors);
    assertStringArray(memory, "evidence_refs", `${path}.memory_cards[${index}]`, errors);
    assertString(memory, "reason", `${path}.memory_cards[${index}]`, errors);
  }
  for (const [index, detail] of assertArray(value, "recent_action_details", path, errors).entries()) {
    validateRecentActionDetail(detail, `${path}.recent_action_details[${index}]`, errors);
  }
  for (const [index, card] of assertArray(value, "plan_bead_cards", path, errors).entries()) {
    validatePlanBeadCard(card, `${path}.plan_bead_cards[${index}]`, errors);
  }
}
