/**
 * Strict loader/validator for phenomenon-record/v1 and catalog index.
 */

import { readFileSync } from "node:fs";

import type {
  PhenomenonCatalogIndexV1,
  PhenomenonRecordV1,
  PhenomenonReviewerDecisionV1,
  PhenomenonStatusV1
} from "./types.js";
import {
  PHENOMENON_ALTERNATIVE_EXPLANATION_KINDS,
  PHENOMENON_CATALOG_INDEX_SCHEMA,
  PHENOMENON_OBSERVATION_CLASSES,
  PHENOMENON_RECORD_KINDS,
  PHENOMENON_RECORD_SCHEMA,
  PHENOMENON_REVIEWER_DECISIONS,
  PHENOMENON_REVIEWER_ROLES,
  PHENOMENON_STATUSES
} from "./types.js";

type ValidationFailure = { ok: false; errors: string[] };

export type PhenomenonRecordValidationResult =
  | { ok: true; record: PhenomenonRecordV1 }
  | ValidationFailure;

export type PhenomenonCatalogIndexValidationResult =
  | { ok: true; index: PhenomenonCatalogIndexV1 }
  | ValidationFailure;

export type PhenomenonReviewerDecisionValidationResult =
  | { ok: true; decision: PhenomenonReviewerDecisionV1 }
  | ValidationFailure;

const recordKeys = [
  "schema",
  "phenomenon_id",
  "title",
  "status",
  "record_kind",
  "is_research_result",
  "observation_class",
  "pattern",
  "scenario_versions",
  "run_refs",
  "seeds",
  "actor_ids",
  "model_configurations",
  "recurrence",
  "material_stake_refs",
  "opportunity_refs",
  "evidence_refs",
  "visual_segment_refs",
  "capability_refs",
  "continuity_refs",
  "alternative_explanations",
  "proposed_control",
  "user_decision"
] as const;

const scenarioVersionKeys = ["scenario_id", "version"] as const;
const modelConfigurationKeys = ["actor_id", "provider_id", "model"] as const;
const recurrenceKeys = ["numerator", "denominator", "notes"] as const;
const alternativeExplanationKeys = ["kind", "explanation"] as const;
const userDecisionKeys = ["status", "rationale", "decided_by", "decided_at"] as const;
const reviewerDecisionKeys = [
  "reviewer_role",
  "decision",
  "rationale",
  "decided_at"
] as const;
const catalogIndexKeys = ["schema", "updated_at", "entries"] as const;
const catalogEntryKeys = [
  "phenomenon_id",
  "title",
  "status",
  "record_kind",
  "is_research_result",
  "observation_class",
  "pattern",
  "scenario_ids",
  "scenario_versions",
  "run_refs",
  "seeds",
  "actor_ids",
  "models",
  "recurrence_numerator",
  "recurrence_denominator",
  "material_stake_refs",
  "opportunity_refs",
  "capability_refs",
  "continuity_refs",
  "record_ref"
] as const;

/** Keys that pretend a transcript quote alone is recurrence evidence. */
const forbiddenQuoteOnlyRecurrenceKeys = [
  "transcript_quote",
  "transcript_quotes",
  "quote_only_recurrence",
  "attractive_video_proof",
  "single_quote_recurrence"
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

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
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

function rejectForbiddenQuoteOnlyKeys(
  record: Record<string, unknown>,
  path: string,
  errors: string[]
) {
  for (const key of Object.keys(record)) {
    if (includesString(forbiddenQuoteOnlyRecurrenceKeys, key)) {
      errors.push(
        `${path}.${key} is forbidden: a single transcript quote or attractive video cannot satisfy recurrence; provide recurrence.numerator and recurrence.denominator`
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

function assertStringArray(value: unknown, path: string, errors: string[], allowEmpty = true): void {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string" && entry.length > 0)) {
    errors.push(`${path} must be a string array of non-empty strings`);
    return;
  }
  if (!allowEmpty && value.length === 0) {
    errors.push(`${path} must be a non-empty string array`);
  }
}

function validateRecurrence(value: unknown, path: string, errors: string[]): void {
  if (typeof value === "string") {
    errors.push(
      `${path} must be an object with numerator and denominator; a single transcript quote string cannot satisfy recurrence`
    );
    return;
  }
  if (!isRecord(value)) {
    errors.push(`${path} must be an object with numerator and denominator`);
    return;
  }

  rejectUnknownKeys(value, recurrenceKeys, path, errors);
  rejectForbiddenQuoteOnlyKeys(value, path, errors);

  if (!isNonNegativeInteger(value.numerator)) {
    errors.push(`${path}.numerator must be a non-negative integer`);
  }
  if (!isPositiveInteger(value.denominator)) {
    errors.push(
      `${path}.denominator must be a positive integer; recurrence without a denominator is rejected`
    );
  }
  if (
    isNonNegativeInteger(value.numerator) &&
    isPositiveInteger(value.denominator) &&
    value.numerator > value.denominator
  ) {
    errors.push(`${path}.numerator must be <= denominator`);
  }
  if (value.notes !== undefined) {
    assertString(value, "notes", path, errors);
  }
}

function validateScenarioVersions(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(entry, scenarioVersionKeys, entryPath, errors);
    assertString(entry, "scenario_id", entryPath, errors);
    assertString(entry, "version", entryPath, errors);
  }
}

function validateModelConfigurations(
  value: unknown,
  path: string,
  knownActorIds: ReadonlySet<string>,
  errors: string[]
): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }
  const seen = new Set<string>();
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(entry, modelConfigurationKeys, entryPath, errors);
    assertString(entry, "actor_id", entryPath, errors);
    assertString(entry, "provider_id", entryPath, errors);
    assertString(entry, "model", entryPath, errors);
    if (nonEmptyString(entry.actor_id)) {
      if (!knownActorIds.has(entry.actor_id)) {
        errors.push(`${entryPath}.actor_id '${entry.actor_id}' is not listed in actor_ids`);
      }
      if (seen.has(entry.actor_id)) {
        errors.push(`${entryPath}.actor_id duplicate '${entry.actor_id}'`);
      }
      seen.add(entry.actor_id);
    }
  }
}

function validateAlternativeExplanations(value: unknown, path: string, errors: string[]): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${path} must be a non-empty array`);
    return;
  }
  const seenKinds = new Set<string>();
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isRecord(entry)) {
      errors.push(`${entryPath} must be an object`);
      continue;
    }
    rejectUnknownKeys(entry, alternativeExplanationKeys, entryPath, errors);
    if (!includesString(PHENOMENON_ALTERNATIVE_EXPLANATION_KINDS, entry.kind)) {
      errors.push(
        `${entryPath}.kind must be one of: ${PHENOMENON_ALTERNATIVE_EXPLANATION_KINDS.join(", ")}`
      );
    } else if (seenKinds.has(entry.kind)) {
      errors.push(`${entryPath}.kind duplicate '${entry.kind}'`);
    } else {
      seenKinds.add(entry.kind);
    }
    assertString(entry, "explanation", entryPath, errors);
  }

  for (const required of PHENOMENON_ALTERNATIVE_EXPLANATION_KINDS) {
    if (!seenKinds.has(required)) {
      errors.push(
        `${path} must include an alternative explanation for kind '${required}'`
      );
    }
  }
}

function validateUserDecision(
  value: unknown,
  path: string,
  status: unknown,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object when present`);
    return;
  }
  rejectUnknownKeys(value, userDecisionKeys, path, errors);
  if (!includesString(PHENOMENON_STATUSES, value.status)) {
    errors.push(`${path}.status must be one of: ${PHENOMENON_STATUSES.join(", ")}`);
  }
  assertString(value, "rationale", path, errors);
  if (!includesString(PHENOMENON_REVIEWER_ROLES, value.decided_by)) {
    errors.push(`${path}.decided_by must be one of: ${PHENOMENON_REVIEWER_ROLES.join(", ")}`);
  }
  assertString(value, "decided_at", path, errors);

  if (
    includesString(PHENOMENON_STATUSES, status) &&
    includesString(PHENOMENON_STATUSES, value.status) &&
    value.status !== status
  ) {
    errors.push(`${path}.status must match record.status '${String(status)}'`);
  }
}

export function validatePhenomenonReviewerDecision(
  value: unknown
): PhenomenonReviewerDecisionValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["reviewer_decision must be an object"] };
  }
  rejectUnknownKeys(value, reviewerDecisionKeys, "reviewer_decision", errors);
  if (!includesString(PHENOMENON_REVIEWER_ROLES, value.reviewer_role)) {
    errors.push(
      `reviewer_decision.reviewer_role must be one of: ${PHENOMENON_REVIEWER_ROLES.join(", ")}`
    );
  }
  if (!includesString(PHENOMENON_REVIEWER_DECISIONS, value.decision)) {
    errors.push(
      `reviewer_decision.decision must be one of: ${PHENOMENON_REVIEWER_DECISIONS.join(", ")}`
    );
  }
  assertString(value, "rationale", "reviewer_decision", errors);
  assertString(value, "decided_at", "reviewer_decision", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, decision: value as PhenomenonReviewerDecisionV1 };
}

/**
 * Resolve persisted status from an optional reviewer_decision.
 * Default is always `candidate` when reviewer_decision is absent.
 */
export function resolvePhenomenonStatusFromReviewerDecision(
  reviewerDecision: PhenomenonReviewerDecisionV1 | undefined
): PhenomenonStatusV1 {
  if (!reviewerDecision) {
    return "candidate";
  }
  if (reviewerDecision.decision === "select_for_followup") {
    return "selected_for_followup";
  }
  if (reviewerDecision.decision === "retire") {
    return "retired";
  }
  return "candidate";
}

export function validatePhenomenonRecord(value: unknown): PhenomenonRecordValidationResult {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return { ok: false, errors: ["PhenomenonRecord must be an object"] };
  }

  rejectForbiddenQuoteOnlyKeys(value, "PhenomenonRecord", errors);
  rejectUnknownKeys(value, recordKeys, "PhenomenonRecord", errors);

  if (value.schema !== PHENOMENON_RECORD_SCHEMA) {
    errors.push(`schema must be '${PHENOMENON_RECORD_SCHEMA}'`);
  }

  assertString(value, "phenomenon_id", "PhenomenonRecord", errors);
  assertString(value, "title", "PhenomenonRecord", errors);
  assertString(value, "pattern", "PhenomenonRecord", errors);
  assertString(value, "proposed_control", "PhenomenonRecord", errors);
  assertBoolean(value, "is_research_result", "PhenomenonRecord", errors);

  if (!includesString(PHENOMENON_STATUSES, value.status)) {
    errors.push(
      `PhenomenonRecord.status must be one of: ${PHENOMENON_STATUSES.join(", ")}`
    );
  }
  if (!includesString(PHENOMENON_RECORD_KINDS, value.record_kind)) {
    errors.push(
      `PhenomenonRecord.record_kind must be one of: ${PHENOMENON_RECORD_KINDS.join(", ")}`
    );
  }
  if (!includesString(PHENOMENON_OBSERVATION_CLASSES, value.observation_class)) {
    errors.push(
      `PhenomenonRecord.observation_class must be one of: ${PHENOMENON_OBSERVATION_CLASSES.join(", ")}`
    );
  }

  if (value.record_kind === "fixture") {
    if (value.is_research_result !== false) {
      errors.push(
        "PhenomenonRecord.is_research_result must be false when record_kind is 'fixture' (fixtures are not research results)"
      );
    }
    if (
      nonEmptyString(value.title) &&
      !/fixture/i.test(value.title) &&
      !/\[FIXTURE\]/i.test(value.title)
    ) {
      errors.push(
        "PhenomenonRecord.title for fixtures must clearly label the record as a fixture (include 'fixture' or '[FIXTURE]')"
      );
    }
    if (nonEmptyString(value.pattern) && !/fixture/i.test(value.pattern)) {
      errors.push(
        "PhenomenonRecord.pattern for fixtures must state that the record is a fixture, not a research result"
      );
    }
  }

  if (value.is_research_result === true && value.record_kind === "fixture") {
    errors.push(
      "PhenomenonRecord cannot be both a fixture and a research result"
    );
  }

  if (value.status === "selected_for_followup") {
    if (value.user_decision === undefined) {
      errors.push(
        "PhenomenonRecord.user_decision is required when status is 'selected_for_followup' (only user or delegated reviewer may promote)"
      );
    }
  }

  if (value.status === "retired" && value.user_decision === undefined) {
    errors.push(
      "PhenomenonRecord.user_decision is required when status is 'retired'"
    );
  }

  if (value.user_decision !== undefined) {
    validateUserDecision(
      value.user_decision,
      "PhenomenonRecord.user_decision",
      value.status,
      errors
    );
    if (
      value.status === "selected_for_followup" &&
      isRecord(value.user_decision) &&
      !includesString(PHENOMENON_REVIEWER_ROLES, value.user_decision.decided_by)
    ) {
      errors.push(
        "PhenomenonRecord.user_decision.decided_by must be 'user' or 'delegated_reviewer' for selected_for_followup"
      );
    }
  }

  validateScenarioVersions(
    value.scenario_versions,
    "PhenomenonRecord.scenario_versions",
    errors
  );
  assertStringArray(value.run_refs, "PhenomenonRecord.run_refs", errors, false);
  assertStringArray(value.seeds, "PhenomenonRecord.seeds", errors, false);
  assertStringArray(value.actor_ids, "PhenomenonRecord.actor_ids", errors, false);
  assertStringArray(
    value.material_stake_refs,
    "PhenomenonRecord.material_stake_refs",
    errors,
    true
  );
  assertStringArray(
    value.opportunity_refs,
    "PhenomenonRecord.opportunity_refs",
    errors,
    true
  );
  assertStringArray(value.evidence_refs, "PhenomenonRecord.evidence_refs", errors, true);
  assertStringArray(
    value.visual_segment_refs,
    "PhenomenonRecord.visual_segment_refs",
    errors,
    true
  );
  assertStringArray(value.capability_refs, "PhenomenonRecord.capability_refs", errors, false);
  assertStringArray(value.continuity_refs, "PhenomenonRecord.continuity_refs", errors, false);

  const actorIds = new Set<string>();
  if (Array.isArray(value.actor_ids)) {
    for (const actorId of value.actor_ids) {
      if (typeof actorId === "string" && actorId.length > 0) {
        actorIds.add(actorId);
      }
    }
  }

  validateModelConfigurations(
    value.model_configurations,
    "PhenomenonRecord.model_configurations",
    actorIds,
    errors
  );
  validateRecurrence(value.recurrence, "PhenomenonRecord.recurrence", errors);
  validateAlternativeExplanations(
    value.alternative_explanations,
    "PhenomenonRecord.alternative_explanations",
    errors
  );

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, record: value as PhenomenonRecordV1 };
}

export function assertPhenomenonRecord(value: unknown): PhenomenonRecordV1 {
  const result = validatePhenomenonRecord(value);
  if (!result.ok) {
    throw new Error(`Invalid PhenomenonRecord: ${result.errors.join("; ")}`);
  }
  return result.record;
}

export function loadPhenomenonRecordFromFile(path: string): PhenomenonRecordV1 {
  const raw = readFileSync(path, "utf8");
  const parsed: unknown = JSON.parse(raw);
  return assertPhenomenonRecord(parsed);
}

function validateCatalogEntry(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  rejectUnknownKeys(value, catalogEntryKeys, path, errors);
  assertString(value, "phenomenon_id", path, errors);
  assertString(value, "title", path, errors);
  assertString(value, "pattern", path, errors);
  assertString(value, "record_ref", path, errors);
  assertBoolean(value, "is_research_result", path, errors);

  if (!includesString(PHENOMENON_STATUSES, value.status)) {
    errors.push(`${path}.status must be one of: ${PHENOMENON_STATUSES.join(", ")}`);
  }
  if (!includesString(PHENOMENON_RECORD_KINDS, value.record_kind)) {
    errors.push(`${path}.record_kind must be one of: ${PHENOMENON_RECORD_KINDS.join(", ")}`);
  }
  if (!includesString(PHENOMENON_OBSERVATION_CLASSES, value.observation_class)) {
    errors.push(
      `${path}.observation_class must be one of: ${PHENOMENON_OBSERVATION_CLASSES.join(", ")}`
    );
  }

  for (const key of [
    "scenario_ids",
    "scenario_versions",
    "run_refs",
    "seeds",
    "actor_ids",
    "models",
    "material_stake_refs",
    "opportunity_refs",
    "capability_refs",
    "continuity_refs"
  ] as const) {
    assertStringArray(value[key], `${path}.${key}`, errors, true);
  }

  if (!isNonNegativeInteger(value.recurrence_numerator)) {
    errors.push(`${path}.recurrence_numerator must be a non-negative integer`);
  }
  if (!isPositiveInteger(value.recurrence_denominator)) {
    errors.push(`${path}.recurrence_denominator must be a positive integer`);
  }
}

export function validatePhenomenonCatalogIndex(
  value: unknown
): PhenomenonCatalogIndexValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["PhenomenonCatalogIndex must be an object"] };
  }
  rejectUnknownKeys(value, catalogIndexKeys, "PhenomenonCatalogIndex", errors);
  if (value.schema !== PHENOMENON_CATALOG_INDEX_SCHEMA) {
    errors.push(`schema must be '${PHENOMENON_CATALOG_INDEX_SCHEMA}'`);
  }
  assertString(value, "updated_at", "PhenomenonCatalogIndex", errors);

  if (!Array.isArray(value.entries)) {
    errors.push("PhenomenonCatalogIndex.entries must be an array");
  } else {
    const ids = new Set<string>();
    for (const [index, entry] of value.entries.entries()) {
      validateCatalogEntry(entry, `PhenomenonCatalogIndex.entries[${index}]`, errors);
      if (isRecord(entry) && nonEmptyString(entry.phenomenon_id)) {
        if (ids.has(entry.phenomenon_id)) {
          errors.push(
            `PhenomenonCatalogIndex.entries duplicate phenomenon_id '${entry.phenomenon_id}'`
          );
        }
        ids.add(entry.phenomenon_id);
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, index: value as PhenomenonCatalogIndexV1 };
}

export function assertPhenomenonCatalogIndex(value: unknown): PhenomenonCatalogIndexV1 {
  const result = validatePhenomenonCatalogIndex(value);
  if (!result.ok) {
    throw new Error(`Invalid PhenomenonCatalogIndex: ${result.errors.join("; ")}`);
  }
  return result.index;
}

export function loadPhenomenonCatalogIndexFromFile(path: string): PhenomenonCatalogIndexV1 {
  const raw = readFileSync(path, "utf8");
  const parsed: unknown = JSON.parse(raw);
  return assertPhenomenonCatalogIndex(parsed);
}
