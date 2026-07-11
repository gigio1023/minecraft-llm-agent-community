/**
 * Phenomenon catalog writer and searchable index helpers.
 *
 * Status defaults to `candidate`. Promotion to `selected_for_followup` requires
 * an explicit `reviewer_decision` from `user` or `delegated_reviewer`.
 */

import fs from "node:fs";
import path from "node:path";

import {
  assertPhenomenonCatalogIndex,
  assertPhenomenonRecord,
  resolvePhenomenonStatusFromReviewerDecision,
  validatePhenomenonRecord,
  validatePhenomenonReviewerDecision
} from "./loader.js";
import type {
  PhenomenonCatalogIndexEntryV1,
  PhenomenonCatalogIndexV1,
  PhenomenonCatalogSearchQueryV1,
  PhenomenonRecordV1,
  PhenomenonReviewerDecisionV1,
  PhenomenonStatusV1,
  PhenomenonUserDecisionV1
} from "./types.js";
import { PHENOMENON_CATALOG_INDEX_SCHEMA, PHENOMENON_RECORD_SCHEMA } from "./types.js";

export const PHENOMENON_CATALOG_INDEX_FILENAME = "catalog-index.json" as const;

export type PhenomenonRecordDraftV1 = Omit<PhenomenonRecordV1, "schema" | "status" | "user_decision"> & {
  schema?: typeof PHENOMENON_RECORD_SCHEMA;
  /** Ignored unless backed by reviewer_decision; writer defaults to candidate. */
  status?: PhenomenonStatusV1;
  user_decision?: PhenomenonUserDecisionV1;
};

/**
 * Writer request. `reviewer_decision` is required to leave `candidate`.
 * When omitted, status is forced to `candidate` regardless of draft.status.
 */
export type WritePhenomenonRecordRequestV1 = {
  record: PhenomenonRecordDraftV1;
  /**
   * Explicit reviewer decision. Absent → status `candidate`.
   * `select_for_followup` requires reviewer_role `user` | `delegated_reviewer`.
   */
  reviewer_decision?: PhenomenonReviewerDecisionV1;
};

export type WritePhenomenonRecordResultV1 = {
  record: PhenomenonRecordV1;
  record_path: string;
  index: PhenomenonCatalogIndexV1;
  index_path: string;
};

function toArray<T>(value: T | readonly T[] | undefined): T[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? [...value] : [value as T];
}

export function buildPhenomenonCatalogIndexEntry(
  record: PhenomenonRecordV1,
  recordRef: string
): PhenomenonCatalogIndexEntryV1 {
  return {
    phenomenon_id: record.phenomenon_id,
    title: record.title,
    status: record.status,
    record_kind: record.record_kind,
    observation_class: record.observation_class,
    pattern: record.pattern,
    scenario_ids: record.scenario_versions.map((entry) => entry.scenario_id),
    scenario_versions: record.scenario_versions.map(
      (entry) => `${entry.scenario_id}@${entry.version}`
    ),
    run_refs: [...record.run_refs],
    seeds: [...record.seeds],
    actor_ids: [...record.actor_ids],
    models: record.model_configurations.map(
      (entry) => `${entry.provider_id}/${entry.model}`
    ),
    recurrence_numerator: record.recurrence.numerator,
    recurrence_denominator: record.recurrence.denominator,
    material_stake_refs: [...record.material_stake_refs],
    opportunity_refs: [...record.opportunity_refs],
    capability_refs: [...record.capability_refs],
    continuity_refs: [...record.continuity_refs],
    record_ref: recordRef
  };
}

export function searchPhenomenonCatalog(
  index: PhenomenonCatalogIndexV1,
  query: PhenomenonCatalogSearchQueryV1 = {}
): PhenomenonCatalogIndexEntryV1[] {
  const statuses = toArray(query.status);
  const observationClasses = toArray(query.observation_class);
  const recordKinds = toArray(query.record_kind);
  const includeFixtures = query.include_fixtures !== false;
  const includeRetired = query.include_retired !== false;
  const includeNegativeOrBoring = query.include_negative_or_boring !== false;
  const text = query.text?.trim().toLowerCase();

  return index.entries.filter((entry) => {
    if (!includeFixtures && entry.record_kind === "fixture") {
      return false;
    }
    if (!includeRetired && entry.status === "retired") {
      return false;
    }
    if (
      !includeNegativeOrBoring &&
      (entry.observation_class === "negative" ||
        entry.observation_class === "boring" ||
        entry.observation_class === "degenerate")
    ) {
      return false;
    }
    if (statuses && !statuses.includes(entry.status)) {
      return false;
    }
    if (observationClasses && !observationClasses.includes(entry.observation_class)) {
      return false;
    }
    if (recordKinds && !recordKinds.includes(entry.record_kind)) {
      return false;
    }
    if (query.scenario_id && !entry.scenario_ids.includes(query.scenario_id)) {
      return false;
    }
    if (query.actor_id && !entry.actor_ids.includes(query.actor_id)) {
      return false;
    }
    if (query.model && !entry.models.some((model) => model.includes(query.model!))) {
      return false;
    }
    if (query.seed && !entry.seeds.includes(query.seed)) {
      return false;
    }
    if (text) {
      const haystack = `${entry.title} ${entry.pattern}`.toLowerCase();
      if (!haystack.includes(text)) {
        return false;
      }
    }
    return true;
  });
}

export function upsertPhenomenonCatalogIndexEntry(
  index: PhenomenonCatalogIndexV1,
  entry: PhenomenonCatalogIndexEntryV1,
  updatedAt = new Date().toISOString()
): PhenomenonCatalogIndexV1 {
  const entries = index.entries.filter(
    (existing) => existing.phenomenon_id !== entry.phenomenon_id
  );
  entries.push(entry);
  entries.sort((a, b) => a.phenomenon_id.localeCompare(b.phenomenon_id));
  return {
    schema: PHENOMENON_CATALOG_INDEX_SCHEMA,
    updated_at: updatedAt,
    entries
  };
}

export function emptyPhenomenonCatalogIndex(
  updatedAt = new Date().toISOString()
): PhenomenonCatalogIndexV1 {
  return {
    schema: PHENOMENON_CATALOG_INDEX_SCHEMA,
    updated_at: updatedAt,
    entries: []
  };
}

/**
 * Apply reviewer_decision and produce a validated persisted record.
 * Defaults to candidate when reviewer_decision is absent.
 */
export function preparePhenomenonRecordForWrite(
  request: WritePhenomenonRecordRequestV1
): PhenomenonRecordV1 {
  const { record: draft, reviewer_decision: reviewerDecision } = request;

  if (draft.status === "selected_for_followup" && !reviewerDecision) {
    throw new Error(
      "selected_for_followup requires an explicit reviewer_decision from user or delegated_reviewer; writer defaults to candidate without it"
    );
  }

  if (draft.status === "retired" && !reviewerDecision) {
    throw new Error(
      "retired status requires an explicit reviewer_decision; writer defaults to candidate without it"
    );
  }

  let resolvedDecision: PhenomenonReviewerDecisionV1 | undefined;
  if (reviewerDecision !== undefined) {
    const decisionResult = validatePhenomenonReviewerDecision(reviewerDecision);
    if (!decisionResult.ok) {
      throw new Error(`Invalid reviewer_decision: ${decisionResult.errors.join("; ")}`);
    }
    resolvedDecision = decisionResult.decision;
  }

  const status = resolvePhenomenonStatusFromReviewerDecision(resolvedDecision);

  if (
    draft.status !== undefined &&
    draft.status !== "candidate" &&
    draft.status !== status
  ) {
    throw new Error(
      `draft status '${draft.status}' conflicts with reviewer_decision resolution '${status}'`
    );
  }

  let userDecision: PhenomenonUserDecisionV1 | undefined;
  if (status === "selected_for_followup" || status === "retired") {
    if (!resolvedDecision) {
      throw new Error(
        `status '${status}' requires reviewer_decision (user or delegated_reviewer only)`
      );
    }
    userDecision = {
      status,
      rationale: resolvedDecision.rationale,
      decided_by: resolvedDecision.reviewer_role,
      decided_at: resolvedDecision.decided_at
    };
  }

  const candidate: PhenomenonRecordV1 = {
    schema: PHENOMENON_RECORD_SCHEMA,
    phenomenon_id: draft.phenomenon_id,
    title: draft.title,
    status,
    record_kind: draft.record_kind,
    observation_class: draft.observation_class,
    pattern: draft.pattern,
    scenario_versions: draft.scenario_versions,
    run_refs: draft.run_refs,
    seeds: draft.seeds,
    actor_ids: draft.actor_ids,
    model_configurations: draft.model_configurations,
    recurrence: draft.recurrence,
    material_stake_refs: draft.material_stake_refs,
    opportunity_refs: draft.opportunity_refs,
    evidence_refs: draft.evidence_refs,
    visual_segment_refs: draft.visual_segment_refs,
    capability_refs: draft.capability_refs,
    continuity_refs: draft.continuity_refs,
    alternative_explanations: draft.alternative_explanations,
    proposed_control: draft.proposed_control,
    ...(userDecision ? { user_decision: userDecision } : {})
  };

  const validation = validatePhenomenonRecord(candidate);
  if (!validation.ok) {
    throw new Error(`Invalid PhenomenonRecord: ${validation.errors.join("; ")}`);
  }
  return validation.record;
}

function phenomenonRecordFilename(phenomenonId: string): string {
  return `${phenomenonId}.json`;
}

export function writePhenomenonCatalogIndex(
  catalogDir: string,
  index: PhenomenonCatalogIndexV1
): string {
  const validated = assertPhenomenonCatalogIndex(index);
  fs.mkdirSync(catalogDir, { recursive: true });
  const indexPath = path.join(catalogDir, PHENOMENON_CATALOG_INDEX_FILENAME);
  fs.writeFileSync(indexPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  return indexPath;
}

export function loadOrCreatePhenomenonCatalogIndex(
  catalogDir: string
): PhenomenonCatalogIndexV1 {
  const indexPath = path.join(catalogDir, PHENOMENON_CATALOG_INDEX_FILENAME);
  if (!fs.existsSync(indexPath)) {
    return emptyPhenomenonCatalogIndex();
  }
  const raw = fs.readFileSync(indexPath, "utf8");
  return assertPhenomenonCatalogIndex(JSON.parse(raw) as unknown);
}

/**
 * Validate, write a phenomenon record, and upsert the searchable catalog index.
 * Negative, boring, and retired candidates are retained in the index.
 */
export function writePhenomenonRecord(
  catalogDir: string,
  request: WritePhenomenonRecordRequestV1
): WritePhenomenonRecordResultV1 {
  const record = preparePhenomenonRecordForWrite(request);
  fs.mkdirSync(catalogDir, { recursive: true });

  const filename = phenomenonRecordFilename(record.phenomenon_id);
  const recordPath = path.join(catalogDir, filename);
  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  assertPhenomenonRecord(JSON.parse(fs.readFileSync(recordPath, "utf8")) as unknown);

  const relativeRef = filename;
  const entry = buildPhenomenonCatalogIndexEntry(record, relativeRef);
  const previous = loadOrCreatePhenomenonCatalogIndex(catalogDir);
  const next = upsertPhenomenonCatalogIndexEntry(
    previous,
    entry,
    new Date().toISOString()
  );
  const indexPath = writePhenomenonCatalogIndex(catalogDir, next);

  return {
    record,
    record_path: recordPath,
    index: next,
    index_path: indexPath
  };
}
