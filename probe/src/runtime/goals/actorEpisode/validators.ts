/**
 * Runtime validators for Actor Episode, Actor Turn, deliberation, and review
 * contracts.
 *
 * @remarks These validators protect the boundary between provider-shaped JSON
 * and runtime authority. They intentionally reject executable authority in
 * context-only records and require evidence refs where success or closure would
 * otherwise become easy to fake.
 */
import {
  actionCardReadinesses,
  activeEpisodeStatuses,
  actorTurnChoices,
  actorTurnExpectedOutcomes,
  deliberationBranchReasons,
  episodeFailureClassifications,
  episodeVerdictStatuses,
  evidenceTraceOutcomes,
  type ActionCard,
  type ActiveEpisode,
  type ActorTurnInput,
  type ActorTurnExecutionDraft,
  type DeliberationBranch,
  type DeliberationOutput,
  type EpisodeReviewSummary,
  type EvidenceTraceEntry
} from "./types.js";
import {
  boundedMineflayerMethodNames,
  mineflayerActionSkillHelperNames,
  mineflayerCodegenSkillRef
} from "./mineflayerCodegenSkill.js";
import { validateSourceEvidenceBundle } from "./sourceEvidenceBundleValidator.js";

type ValidationFailure = { ok: false; errors: string[] };

type ValidationResult<T, K extends string> =
  | ({ ok: true } & Record<K, T>)
  | ValidationFailure;

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

function assertNonEmptyStringArray(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
) {
  assertStringArray(record, key, path, errors);
  const value = record[key];
  if (Array.isArray(value) && value.length === 0) {
    errors.push(`${path}.${key} must not be empty`);
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

function assertPlanBeadPriority(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
) {
  const value = record[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 4) {
    errors.push(`${path}.${key} must be an integer priority from 0 to 4`);
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

function assertArray(
  record: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[]
): unknown[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    errors.push(`${path}.${key} must be an array`);
    return [];
  }
  return value;
}

function assertAllowedKeys(
  record: Record<string, unknown>,
  disallowedKeys: readonly string[],
  path: string,
  errors: string[]
) {
  for (const key of disallowedKeys) {
    if (record[key] !== undefined) {
      errors.push(`${path}.${key} must not appear in this contract`);
    }
  }
}

const executableAuthorityKeys = new Set([
  // Rejected explicitly so branch-time Deliberation cannot revive the old
  // provider-facing action-intent object as executable authority.
  "action_intent",
  "action_card_id",
  "primitive_id",
  "action_skill_id",
  "runtime_mapping_ref",
  "args",
  "parameters",
  "candidate",
  "source_language",
  "source",
  "helper_api_version",
  "helper_allowlist",
  "timeout_ms"
]);

const actorTurnAuthoringHelperNames = new Set<string>(mineflayerActionSkillHelperNames);

function collectExecutableAuthorityKeyErrors(value: unknown, path: string, errors: string[]) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectExecutableAuthorityKeyErrors(entry, `${path}[${index}]`, errors));
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (executableAuthorityKeys.has(key)) {
      errors.push(`${path}.${key} must not appear in Deliberation output`);
    }
    collectExecutableAuthorityKeyErrors(entry, `${path}.${key}`, errors);
  }
}

function validateEvidenceExpectation(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  assertString(value, "kind", path, errors);
  assertString(value, "description", path, errors);
}

function validatePivotTrigger(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  assertString(value, "trigger", path, errors);
  assertStringArray(value, "evidence_refs", path, errors);
}

function validateSocialPressure(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  assertString(value, "kind", path, errors);
  assertString(value, "summary", path, errors);
  assertStringArray(value, "evidence_refs", path, errors);
}

function validatePlanBeadHint(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  assertString(value, "bead_id", path, errors);
  assertString(value, "title", path, errors);
  assertString(value, "status", path, errors);
  assertPlanBeadPriority(value, "priority", path, errors);
  assertString(value, "why_it_matters", path, errors);
  assertStringArray(value, "next_hints", path, errors);
  assertStringArray(value, "blockers", path, errors);
  assertStringArray(value, "acceptance_evidence_required", path, errors);
  assertStringArray(value, "evidence_refs", path, errors);
  assertStringArray(value, "dependency_refs", path, errors);
  assertString(value, "checkpoint_ref", path, errors);
}

function validateCurrentStateProjection(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (value.schema !== "actor-turn-current-state/v1") {
    errors.push(`${path}.schema must be actor-turn-current-state/v1`);
  }
  assertString(value, "observer_id", path, errors);
  assertRecord(value, "inventory_counts", path, errors);
  assertArray(value, "visible_actors", path, errors);
  if (value.session_lifecycle !== undefined) {
    const lifecycle = isRecord(value.session_lifecycle) ? value.session_lifecycle : null;
    if (!lifecycle) {
      errors.push(`${path}.session_lifecycle must be an object`);
    } else {
      if (lifecycle.schema !== "runtime-session-lifecycle/v1") {
        errors.push(`${path}.session_lifecycle.schema must be runtime-session-lifecycle/v1`);
      }
      assertString(lifecycle, "status", `${path}.session_lifecycle`, errors);
      assertNonNegativeInteger(lifecycle, "death_count", `${path}.session_lifecycle`, errors);
      assertNonNegativeInteger(lifecycle, "spawn_count", `${path}.session_lifecycle`, errors);
      if (typeof lifecycle.inventory_may_have_reset !== "boolean") {
        errors.push(`${path}.session_lifecycle.inventory_may_have_reset must be boolean`);
      }
      if (typeof lifecycle.branch_recommended !== "boolean") {
        errors.push(`${path}.session_lifecycle.branch_recommended must be boolean`);
      }
      assertStringArray(lifecycle, "notes", `${path}.session_lifecycle`, errors);
    }
  }
  for (const [index, block] of assertArray(value, "nearby_block_observations", path, errors).entries()) {
    if (!isRecord(block)) {
      errors.push(`${path}.nearby_block_observations[${index}] must be an object`);
      continue;
    }
    assertString(block, "name", `${path}.nearby_block_observations[${index}]`, errors);
    assertString(block, "source", `${path}.nearby_block_observations[${index}]`, errors);
    assertStringArray(block, "evidence_refs", `${path}.nearby_block_observations[${index}]`, errors);
  }
  const sharedStorage = assertRecord(value, "shared_storage", path, errors);
  if (sharedStorage) {
    assertString(sharedStorage, "status", `${path}.shared_storage`, errors);
    assertOptionalString(sharedStorage, "chest_id", `${path}.shared_storage`, errors);
    assertArray(sharedStorage, "items", `${path}.shared_storage`, errors);
    assertStringArray(sharedStorage, "evidence_refs", `${path}.shared_storage`, errors);
  }
  if (value.structure_progress !== undefined) {
    const structureProgress = isRecord(value.structure_progress) ? value.structure_progress : null;
    if (!structureProgress) {
      errors.push(`${path}.structure_progress must be an object`);
    } else {
      assertString(structureProgress, "status", `${path}.structure_progress`, errors);
      assertNonNegativeInteger(structureProgress, "total_placed_blocks", `${path}.structure_progress`, errors);
      assertOptionalString(structureProgress, "latest_pattern_id", `${path}.structure_progress`, errors);
      assertOptionalString(structureProgress, "latest_material", `${path}.structure_progress`, errors);
      assertStringArray(structureProgress, "evidence_refs", `${path}.structure_progress`, errors);
      assertStringArray(structureProgress, "summaries", `${path}.structure_progress`, errors);
      assertStringArray(structureProgress, "interpretation_notes", `${path}.structure_progress`, errors);
    }
  }
  const settlement = assertRecord(value, "settlement_progress", path, errors);
  if (settlement) {
    assertRecord(settlement, "inventory_counts", `${path}.settlement_progress`, errors);
    assertString(settlement, "shared_storage_status", `${path}.settlement_progress`, errors);
    assertRecord(settlement, "known_positions", `${path}.settlement_progress`, errors);
    assertArray(settlement, "checklist", `${path}.settlement_progress`, errors);
    assertArray(settlement, "recent_blockers", `${path}.settlement_progress`, errors);
  }
}

function validateDecisionFrame(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (value.schema !== "actor-turn-decision-frame/v1") {
    errors.push(`${path}.schema must be actor-turn-decision-frame/v1`);
  }
  assertStringArray(value, "priority_order", path, errors);
  assertString(value, "episode_focus", path, errors);
  assertStringArray(value, "current_truths", path, errors);
  assertStringArray(value, "completed_work", path, errors);
  assertStringArray(value, "do_not_repeat", path, errors);
  assertStringArray(value, "next_action_guidance", path, errors);

  const focusStatus = assertRecord(value, "episode_focus_status", path, errors);
  if (focusStatus) {
    if (
      !includesString(
        ["open", "satisfied", "blocked_or_no_progress", "unknown"] as const,
        focusStatus.status
      )
    ) {
      errors.push(`${path}.episode_focus_status.status must be open, satisfied, blocked_or_no_progress, or unknown`);
    }
    assertString(focusStatus, "focus", `${path}.episode_focus_status`, errors);
    assertStringArray(focusStatus, "evidence_refs", `${path}.episode_focus_status`, errors);
    assertString(focusStatus, "next", `${path}.episode_focus_status`, errors);
  }

  for (const [index, verdict] of assertArray(value, "recent_action_verdicts", path, errors).entries()) {
    if (!isRecord(verdict)) {
      errors.push(`${path}.recent_action_verdicts[${index}] must be an object`);
      continue;
    }
    assertString(verdict, "turn_id", `${path}.recent_action_verdicts[${index}]`, errors);
    assertString(verdict, "action_summary", `${path}.recent_action_verdicts[${index}]`, errors);
    if (!includesString(evidenceTraceOutcomes, verdict.outcome)) {
      errors.push(`${path}.recent_action_verdicts[${index}].outcome must be a known evidence outcome`);
    }
    assertStringArray(verdict, "evidence_refs", `${path}.recent_action_verdicts[${index}]`, errors);
  }

  for (const [index, item] of assertArray(value, "open_progress_front", path, errors).entries()) {
    if (!isRecord(item)) {
      errors.push(`${path}.open_progress_front[${index}] must be an object`);
      continue;
    }
    assertString(item, "id", `${path}.open_progress_front[${index}]`, errors);
    assertString(item, "status", `${path}.open_progress_front[${index}]`, errors);
    assertString(item, "next_theme", `${path}.open_progress_front[${index}]`, errors);
    assertStringArray(item, "evidence_refs", `${path}.open_progress_front[${index}]`, errors);
  }

}

function validateRetryConstraint(value: unknown, path: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  assertString(value, "constraint_id", path, errors);
  assertString(value, "target_summary", path, errors);
  if (!("args_normalized" in value)) {
    errors.push(`${path}.args_normalized must be present`);
  }
  assertString(value, "blocked_reason", path, errors);
  assertNonNegativeInteger(value, "repeat_count", path, errors);
  assertStringArray(value, "evidence_refs", path, errors);
}

function validateKnownStringArray(
  record: Record<string, unknown>,
  key: string,
  path: string,
  allowed: ReadonlySet<string>,
  errors: string[]
) {
  assertStringArray(record, key, path, errors);
  const value = record[key];
  if (!Array.isArray(value)) {
    return;
  }
  for (const entry of value) {
    if (typeof entry === "string" && !allowed.has(entry)) {
      errors.push(`${path}.${key} contains unsupported value ${entry}`);
    }
  }
}

function validateArrayContainsAll(input: {
  record: Record<string, unknown>;
  key: string;
  path: string;
  expected: readonly string[];
  errors: string[];
}) {
  assertNonEmptyStringArray(input.record, input.key, input.path, input.errors);
  const value = input.record[input.key];
  if (!Array.isArray(value)) {
    return;
  }
  const actual = new Set(value.filter((entry): entry is string => typeof entry === "string"));
  for (const expected of input.expected) {
    if (!actual.has(expected)) {
      input.errors.push(`${input.path}.${input.key} must include ${expected}`);
    }
  }
}

function validateMineflayerCodegenSkillProjection(
  value: unknown,
  path: string,
  errors: string[]
) {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (value.schema !== "mineflayer-codegen-skill/v1") {
    errors.push(`${path}.schema must be mineflayer-codegen-skill/v1`);
  }
  if (value.skill_ref !== mineflayerCodegenSkillRef) {
    errors.push(`${path}.skill_ref must be ${mineflayerCodegenSkillRef}`);
  }
  assertString(value, "skill_markdown", path, errors);
  if (
    typeof value.skill_markdown === "string" &&
    !/\bMineflayer Code Generation\b/.test(value.skill_markdown)
  ) {
    errors.push(`${path}.skill_markdown must contain the Mineflayer Code Generation agent skill body`);
  }
  assertString(value, "upstream_ref", path, errors);
  if (value.applies_when !== "outer Actor Turn selected author_mineflayer_action") {
    errors.push(`${path}.applies_when must be outer Actor Turn selected author_mineflayer_action`);
  }
  if (value.helper_api_version !== "mineflayer-action-skill-helper/v1") {
    errors.push(`${path}.helper_api_version must be mineflayer-action-skill-helper/v1`);
  }
  validateArrayContainsAll({
    record: value,
    key: "allowed_ctx_helpers",
    path,
    expected: mineflayerActionSkillHelperNames,
    errors
  });
  validateArrayContainsAll({
    record: value,
    key: "bounded_mineflayer_methods",
    path,
    expected: boundedMineflayerMethodNames,
    errors
  });
  for (const key of [
    "output_schema_rules",
    "helper_call_contracts",
    "mineflayer_api_notes",
    "forbidden_source_patterns",
    "verifier_and_evidence_rules",
    "common_failure_modes"
  ] as const) {
    assertNonEmptyStringArray(value, key, path, errors);
  }
}

function validateAuthoringInputSchemaDefinition(input: {
  schema: Record<string, unknown>;
  parameters: Record<string, unknown> | null;
  path: string;
  errors: string[];
}) {
  if (input.schema.type !== "object") {
    input.errors.push(`${input.path}.type must be object`);
  }
  if (input.schema.additionalProperties !== false) {
    input.errors.push(`${input.path}.additionalProperties must be false`);
  }
  const properties = assertRecord(input.schema, "properties", input.path, input.errors);
  const rawRequired = input.schema.required;
  const required = Array.isArray(rawRequired) &&
    rawRequired.every((entry) => typeof entry === "string" && entry.length > 0)
    ? rawRequired as string[]
    : null;
  if (!required) {
    input.errors.push(`${input.path}.required must be a string array`);
  }
  if (!properties || !required) {
    return;
  }
  const requiredSet = new Set(required);
  for (const key of required) {
    if (!(key in properties)) {
      input.errors.push(`${input.path}.required includes ${key} but properties.${key} is missing`);
    }
  }
  for (const [key, propertySchema] of Object.entries(properties)) {
    if (!isRecord(propertySchema)) {
      input.errors.push(`${input.path}.properties.${key} must be an object`);
    }
  }
  for (const key of Object.keys(input.parameters ?? {})) {
    if (!(key in properties)) {
      input.errors.push(`ActorTurnExecutionDraft.parameters.${key} must be declared in ${input.path}.properties`);
    }
    if (!requiredSet.has(key)) {
      input.errors.push(`ActorTurnExecutionDraft.parameters.${key} must be listed in ${input.path}.required`);
    }
  }
}

export function validateActiveEpisode(
  value: unknown
): ValidationResult<ActiveEpisode, "episode"> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["ActiveEpisode must be an object"] };
  }
  if (value.schema !== "active-episode/v1") {
    errors.push("ActiveEpisode.schema must be active-episode/v1");
  }
  assertString(value, "episode_id", "ActiveEpisode", errors);
  assertString(value, "actor_id", "ActiveEpisode", errors);
  assertString(value, "life_goal_ref", "ActiveEpisode", errors);
  assertString(value, "purpose", "ActiveEpisode", errors);
  assertString(value, "current_focus", "ActiveEpisode", errors);
  assertOptionalString(value, "started_at_turn_ref", "ActiveEpisode", errors);
  assertStringArray(value, "actors_visible_or_relevant", "ActiveEpisode", errors);
  assertStringArray(value, "selected_plan_bead_refs", "ActiveEpisode", errors);
  assertStringArray(value, "related_plan_bead_refs", "ActiveEpisode", errors);
  assertStringArray(value, "opened_from_refs", "ActiveEpisode", errors);
  if (!includesString(activeEpisodeStatuses, value.status)) {
    errors.push("ActiveEpisode.status must be a known Active Episode status");
  }

  for (const [index, entry] of assertArray(value, "success_signals", "ActiveEpisode", errors).entries()) {
    validateEvidenceExpectation(entry, `ActiveEpisode.success_signals[${index}]`, errors);
  }
  for (const [index, entry] of assertArray(value, "pivot_triggers", "ActiveEpisode", errors).entries()) {
    validatePivotTrigger(entry, `ActiveEpisode.pivot_triggers[${index}]`, errors);
  }
  for (const [index, entry] of assertArray(value, "social_pressure", "ActiveEpisode", errors).entries()) {
    validateSocialPressure(entry, `ActiveEpisode.social_pressure[${index}]`, errors);
  }

  const mistakeBudget = assertRecord(value, "mistake_budget", "ActiveEpisode", errors);
  if (mistakeBudget) {
    assertNonNegativeInteger(mistakeBudget, "allow_exploration_turns", "ActiveEpisode.mistake_budget", errors);
    assertNonNegativeInteger(mistakeBudget, "observe_repeat_limit", "ActiveEpisode.mistake_budget", errors);
    assertNonNegativeInteger(mistakeBudget, "exact_blocker_repeat_limit", "ActiveEpisode.mistake_budget", errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, episode: value as ActiveEpisode };
}

export function validateActionCard(value: unknown): ValidationResult<ActionCard, "card"> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["ActionCard must be an object"] };
  }
  if (value.schema !== "action-card/v1") {
    errors.push("ActionCard.schema must be action-card/v1");
  }
  assertString(value, "action_card_id", "ActionCard", errors);
  assertString(value, "title", "ActionCard", errors);
  assertString(value, "description", "ActionCard", errors);
  assertString(value, "parameters_schema_ref", "ActionCard", errors);
  assertString(value, "runtime_mapping_ref", "ActionCard", errors);
  assertStringArray(value, "parameter_hints", "ActionCard", errors);
  assertStringArray(value, "current_state_requirements", "ActionCard", errors);
  assertStringArray(value, "expected_evidence", "ActionCard", errors);
  assertStringArray(value, "likely_blockers", "ActionCard", errors);
  if (!includesString(actionCardReadinesses, value.readiness)) {
    errors.push("ActionCard.readiness must be a known readiness");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, card: value as ActionCard };
}

export function validateEvidenceTraceEntry(
  value: unknown
): ValidationResult<EvidenceTraceEntry, "entry"> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["EvidenceTraceEntry must be an object"] };
  }
  if (value.schema !== "evidence-trace/v1") {
    errors.push("EvidenceTraceEntry.schema must be evidence-trace/v1");
  }
  assertString(value, "turn_id", "EvidenceTraceEntry", errors);
  assertString(value, "episode_id", "EvidenceTraceEntry", errors);
  assertString(value, "action_ref", "EvidenceTraceEntry", errors);
  assertString(value, "runtime_gate_ref", "EvidenceTraceEntry", errors);
  assertOptionalString(value, "execution_ref", "EvidenceTraceEntry", errors);
  assertOptionalString(value, "verifier_ref", "EvidenceTraceEntry", errors);
  assertOptionalString(value, "post_observation_ref", "EvidenceTraceEntry", errors);
  assertOptionalString(value, "provider_usage_ref", "EvidenceTraceEntry", errors);
  const selectedAction = value.selected_action;
  if (selectedAction !== undefined) {
    const record = assertRecord(value, "selected_action", "EvidenceTraceEntry", errors);
    if (record) {
      assertString(record, "kind", "EvidenceTraceEntry.selected_action", errors);
      assertString(record, "id", "EvidenceTraceEntry.selected_action", errors);
      assertOptionalString(record, "action_card_id", "EvidenceTraceEntry.selected_action", errors);
      assertOptionalString(record, "title", "EvidenceTraceEntry.selected_action", errors);
    }
  }
  if (value.parameters !== undefined) {
    assertRecord(value, "parameters", "EvidenceTraceEntry", errors);
  }
  const rationale = value.rationale;
  if (rationale !== undefined) {
    const record = assertRecord(value, "rationale", "EvidenceTraceEntry", errors);
    if (record) {
      assertOptionalString(record, "why_this_action", "EvidenceTraceEntry.rationale", errors);
      assertOptionalString(record, "fallback_if_blocked", "EvidenceTraceEntry.rationale", errors);
    }
  }
  assertOptionalString(value, "runtime_status", "EvidenceTraceEntry", errors);
  if (value.tool_statuses !== undefined) {
    for (const [index, status] of assertArray(value, "tool_statuses", "EvidenceTraceEntry", errors).entries()) {
      if (!isRecord(status)) {
        errors.push(`EvidenceTraceEntry.tool_statuses[${index}] must be an object`);
        continue;
      }
      assertString(status, "tool", `EvidenceTraceEntry.tool_statuses[${index}]`, errors);
      assertString(status, "status", `EvidenceTraceEntry.tool_statuses[${index}]`, errors);
    }
  }
  assertOptionalString(value, "blocker_reason", "EvidenceTraceEntry", errors);
  assertString(value, "compact_summary", "EvidenceTraceEntry", errors);
  if (!includesString(evidenceTraceOutcomes, value.outcome)) {
    errors.push("EvidenceTraceEntry.outcome must be a known evidence outcome");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, entry: value as EvidenceTraceEntry };
}

export function validateActorTurnInput(
  value: unknown
): ValidationResult<ActorTurnInput, "input"> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["ActorTurnInput must be an object"] };
  }
  if (value.schema !== "actor-turn-input/v1") {
    errors.push("ActorTurnInput.schema must be actor-turn-input/v1");
  }
  assertString(value, "turn_id", "ActorTurnInput", errors);
  validateDecisionFrame(
    value.decision_frame,
    "ActorTurnInput.decision_frame",
    errors
  );
  const episodeResult = validateActiveEpisode(value.active_episode);
  if (!episodeResult.ok) {
    errors.push(...episodeResult.errors.map((error) => `ActorTurnInput.active_episode: ${error}`));
  }
  const actorContext = assertRecord(value, "actor_context", "ActorTurnInput", errors);
  if (actorContext) {
    assertString(actorContext, "actor_id", "ActorTurnInput.actor_context", errors);
    assertString(actorContext, "actor_soul_ref", "ActorTurnInput.actor_context", errors);
    assertString(actorContext, "life_goal_ref", "ActorTurnInput.actor_context", errors);
    assertString(actorContext, "life_goal_summary", "ActorTurnInput.actor_context", errors);
  }
  assertStringArray(value, "current_observation_refs", "ActorTurnInput", errors);
  validateCurrentStateProjection(value.current_state, "ActorTurnInput.current_state", errors);
  validateSourceEvidenceBundle(value.source_evidence_bundle, "ActorTurnInput.source_evidence_bundle", errors);
  assertStringArray(value, "memory_refs", "ActorTurnInput", errors);

  for (const [index, entry] of assertArray(value, "recent_evidence_trace", "ActorTurnInput", errors).entries()) {
    const result = validateEvidenceTraceEntry(entry);
    if (!result.ok) {
      errors.push(...result.errors.map((error) => `ActorTurnInput.recent_evidence_trace[${index}]: ${error}`));
    }
  }
  for (const [index, hint] of assertArray(value, "compact_plan_bead_hints", "ActorTurnInput", errors).entries()) {
    validatePlanBeadHint(hint, `ActorTurnInput.compact_plan_bead_hints[${index}]`, errors);
  }
  for (const [index, constraint] of assertArray(value, "runtime_retry_constraints", "ActorTurnInput", errors).entries()) {
    validateRetryConstraint(constraint, `ActorTurnInput.runtime_retry_constraints[${index}]`, errors);
  }
  for (const [index, card] of assertArray(value, "action_cards", "ActorTurnInput", errors).entries()) {
    const result = validateActionCard(card);
    if (!result.ok) {
      errors.push(...result.errors.map((error) => `ActorTurnInput.action_cards[${index}]: ${error}`));
    }
  }

  const relationships = assertRecord(value, "relationship_context", "ActorTurnInput", errors);
  if (relationships) {
    assertStringArray(relationships, "relationship_refs", "ActorTurnInput.relationship_context", errors);
    assertStringArray(relationships, "visible_actor_ids", "ActorTurnInput.relationship_context", errors);
    assertArray(relationships, "relationship_cards", "ActorTurnInput.relationship_context", errors);
  }
  const guide = assertRecord(value, "minecraft_basic_guide", "ActorTurnInput", errors);
  if (guide) {
    if (guide.schema !== "minecraft-basic-guide/v1") {
      errors.push("ActorTurnInput.minecraft_basic_guide.schema must be minecraft-basic-guide/v1");
    }
    assertOptionalString(guide, "guide_ref", "ActorTurnInput.minecraft_basic_guide", errors);
    assertStringArray(guide, "item_flows", "ActorTurnInput.minecraft_basic_guide", errors);
    assertStringArray(guide, "station_requirements", "ActorTurnInput.minecraft_basic_guide", errors);
    assertStringArray(guide, "blocker_recovery_guides", "ActorTurnInput.minecraft_basic_guide", errors);
    assertStringArray(guide, "observe_stop_guides", "ActorTurnInput.minecraft_basic_guide", errors);
  }
  validateMineflayerCodegenSkillProjection(
    value.mineflayer_codegen_skill,
    "ActorTurnInput.mineflayer_codegen_skill",
    errors
  );
  const budget = assertRecord(value, "provider_budget_hint", "ActorTurnInput", errors);
  if (budget) {
    assertString(budget, "provider_id", "ActorTurnInput.provider_budget_hint", errors);
    assertString(budget, "model", "ActorTurnInput.provider_budget_hint", errors);
    assertString(budget, "status", "ActorTurnInput.provider_budget_hint", errors);
    if (budget.remaining_turns_hint !== undefined) {
      assertNonNegativeInteger(budget, "remaining_turns_hint", "ActorTurnInput.provider_budget_hint", errors);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, input: value as ActorTurnInput };
}

export function validateActorTurnExecutionDraft(
  value: unknown
): ValidationResult<ActorTurnExecutionDraft, "output"> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["ActorTurnExecutionDraft must be an object"] };
  }
  if (value.schema !== "actor-turn-execution-draft/v1") {
    errors.push("ActorTurnExecutionDraft.schema must be actor-turn-execution-draft/v1");
  }
  if (!includesString(actorTurnChoices, value.choice)) {
    errors.push("ActorTurnExecutionDraft.choice must be use_existing_action or author_mineflayer_action");
  }
  const parameters = assertRecord(value, "parameters", "ActorTurnExecutionDraft", errors);
  assertString(value, "why_this_action", "ActorTurnExecutionDraft", errors);
  assertStringArray(value, "expected_evidence", "ActorTurnExecutionDraft", errors);
  assertString(value, "fallback_if_blocked", "ActorTurnExecutionDraft", errors);
  if (!includesString(actorTurnExpectedOutcomes, value.expected_outcome)) {
    errors.push("ActorTurnExecutionDraft.expected_outcome must be a known Actor Turn expected outcome");
  }

  if (value.choice === "use_existing_action") {
    assertString(value, "action_card_id", "ActorTurnExecutionDraft", errors);
    assertAllowedKeys(
      value,
      ["primitive_id", "action_skill_id", "candidate", "source", "runtime_mapping_ref", "args"],
      "ActorTurnExecutionDraft",
      errors
    );
  } else if (value.choice === "author_mineflayer_action") {
    assertString(value, "proposed_action_skill_id", "ActorTurnExecutionDraft", errors);
    assertString(value, "purpose", "ActorTurnExecutionDraft", errors);
    const inputSchema = assertRecord(value, "input_schema", "ActorTurnExecutionDraft", errors);
    if (inputSchema) {
      validateAuthoringInputSchemaDefinition({
        schema: inputSchema,
        parameters,
        path: "ActorTurnExecutionDraft.input_schema",
        errors
      });
    }
    assertString(value, "source_language", "ActorTurnExecutionDraft", errors);
    if (value.source_language !== "typescript") {
      errors.push("ActorTurnExecutionDraft.source_language must be typescript");
    }
    assertString(value, "source", "ActorTurnExecutionDraft", errors);
    if (value.helper_api_version !== "mineflayer-action-skill-helper/v1") {
      errors.push("ActorTurnExecutionDraft.helper_api_version must be mineflayer-action-skill-helper/v1");
    }
    validateKnownStringArray(
      value,
      "helper_allowlist",
      "ActorTurnExecutionDraft",
      actorTurnAuthoringHelperNames,
      errors
    );
    if (
      typeof value.timeout_ms !== "number" ||
      !Number.isInteger(value.timeout_ms) ||
      value.timeout_ms < 500 ||
      value.timeout_ms > 120_000
    ) {
      errors.push("ActorTurnExecutionDraft.timeout_ms must be an integer between 500 and 120000");
    }
    assertRecord(value, "verifier", "ActorTurnExecutionDraft", errors);
    assertStringArray(value, "known_failure_modes", "ActorTurnExecutionDraft", errors);
    if (value.promotion_policy !== "promote_after_passed_trial") {
      errors.push("ActorTurnExecutionDraft.promotion_policy must be promote_after_passed_trial");
    }
    assertAllowedKeys(
      value,
      ["primitive_id", "action_skill_id", "action_card_id", "runtime_mapping_ref", "args"],
      "ActorTurnExecutionDraft",
      errors
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, output: value as ActorTurnExecutionDraft };
}

export function validateDeliberationBranch(
  value: unknown
): ValidationResult<DeliberationBranch, "branch"> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["DeliberationBranch must be an object"] };
  }
  if (value.schema !== "deliberation-branch/v1") {
    errors.push("DeliberationBranch.schema must be deliberation-branch/v1");
  }
  assertString(value, "branch_id", "DeliberationBranch", errors);
  assertString(value, "current_episode_ref", "DeliberationBranch", errors);
  assertNonEmptyStringArray(value, "evidence_refs", "DeliberationBranch", errors);
  if (!includesString(deliberationBranchReasons, value.reason)) {
    errors.push("DeliberationBranch.reason must be a known branch reason");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, branch: value as DeliberationBranch };
}

export function validateDeliberationOutput(
  value: unknown
): ValidationResult<DeliberationOutput, "output"> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["DeliberationOutput must be an object"] };
  }
  if (value.schema !== "deliberation-output/v1") {
    errors.push("DeliberationOutput.schema must be deliberation-output/v1");
  }
  collectExecutableAuthorityKeyErrors(value, "DeliberationOutput", errors);
  assertString(value, "branch_id", "DeliberationOutput", errors);
  assertString(value, "current_episode_ref", "DeliberationOutput", errors);
  assertString(value, "rationale", "DeliberationOutput", errors);
  const episode = assertRecord(value, "next_episode", "DeliberationOutput", errors);
  if (episode) {
    const episodeResult = validateActiveEpisode(episode);
    if (!episodeResult.ok) {
      errors.push(...episodeResult.errors.map((error) => `DeliberationOutput.next_episode: ${error}`));
    }
  }
  assertArray(value, "plan_bead_op_proposals", "DeliberationOutput", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, output: value as DeliberationOutput };
}

export function validateEpisodeReviewSummary(
  value: unknown
): ValidationResult<EpisodeReviewSummary, "summary"> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["EpisodeReviewSummary must be an object"] };
  }
  if (value.schema !== "episode-review-summary/v1") {
    errors.push("EpisodeReviewSummary.schema must be episode-review-summary/v1");
  }
  assertString(value, "episode_id", "EpisodeReviewSummary", errors);
  assertString(value, "actor_id", "EpisodeReviewSummary", errors);
  assertNonNegativeInteger(value, "total_turns", "EpisodeReviewSummary", errors);
  assertStringArray(value, "evidence_trace_refs", "EpisodeReviewSummary", errors);

  const provider = assertRecord(value, "provider", "EpisodeReviewSummary", errors);
  if (provider) {
    assertString(provider, "provider_id", "EpisodeReviewSummary.provider", errors);
    assertString(provider, "model", "EpisodeReviewSummary.provider", errors);
  }

  const verdict = assertRecord(value, "final_verdict", "EpisodeReviewSummary", errors);
  if (verdict) {
    if (!includesString(episodeVerdictStatuses, verdict.status)) {
      errors.push("EpisodeReviewSummary.final_verdict.status must be a known verdict status");
    }
    assertString(verdict, "reason", "EpisodeReviewSummary.final_verdict", errors);
    assertStringArray(verdict, "evidence_refs", "EpisodeReviewSummary.final_verdict", errors);
  }

  const metrics = assertRecord(value, "metrics", "EpisodeReviewSummary", errors);
  if (metrics) {
    for (const key of [
      "non_observe_wait_remember_turns",
      "verified_mutation_turns",
      "social_visibility_events",
      "false_pass_count",
      "unsupported_claim_count",
      "exact_retry_constraint_blocks",
      "distinct_action_families"
    ] as const) {
      assertNonNegativeInteger(metrics, key, "EpisodeReviewSummary.metrics", errors);
    }
  }

  for (const [index, check] of assertArray(value, "plan_bead_closure_checks", "EpisodeReviewSummary", errors).entries()) {
    const path = `EpisodeReviewSummary.plan_bead_closure_checks[${index}]`;
    if (!isRecord(check)) {
      errors.push(`${path} must be an object`);
      continue;
    }
    assertString(check, "bead_id", path, errors);
    assertString(check, "close_kind", path, errors);
    assertString(check, "status", path, errors);
    assertStringArray(check, "evidence_refs", path, errors);
    assertStringArray(check, "acceptance_evidence_required", path, errors);
    if (typeof check.matched_acceptance_criteria !== "boolean") {
      errors.push(`${path}.matched_acceptance_criteria must be a boolean`);
    }
    assertString(check, "reason", path, errors);
  }

  const socialVisibility = assertRecord(value, "social_visibility", "EpisodeReviewSummary", errors);
  if (socialVisibility) {
    assertNonNegativeInteger(socialVisibility, "event_count", "EpisodeReviewSummary.social_visibility", errors);
    assertStringArray(socialVisibility, "evidence_refs", "EpisodeReviewSummary.social_visibility", errors);
  }

  const classifications = assertArray(value, "failure_classifications", "EpisodeReviewSummary", errors);
  for (const [index, classification] of classifications.entries()) {
    if (!includesString(episodeFailureClassifications, classification)) {
      errors.push(`EpisodeReviewSummary.failure_classifications[${index}] must be a known classification`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, summary: value as EpisodeReviewSummary };
}
