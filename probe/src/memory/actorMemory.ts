import fs from "node:fs/promises";
import path from "node:path";

import type { JsonValue } from "../provider/inputSnapshot.js";
import {
  getActorMemoryRecordPath,
  getActorWorkspacePaths,
  sanitizeWorkspaceFileId,
  type ActorMemoryLayerPath
} from "../runtime/actorWorkspacePaths.js";
import { writeJson } from "../runtime/actorWorkspaceStore.js";
import type { DirectGeneratedObjectiveReport } from "../objectives/directGeneratedRunner.js";
import { getObjectiveDefinition } from "../objectives/registry.js";

type JsonRecord = Record<string, JsonValue>;

export type ActorMemoryLayer = ActorMemoryLayerPath;

export type ActorMemoryStatus =
  | "candidate"
  | "active"
  | "superseded"
  | "stale"
  | "rejected";

export type ActorMemoryConfidence =
  | "observed"
  | "reviewed"
  | "inferred"
  | "uncertain";

export type ActorMemoryScope =
  | {
      kind: "actor_private";
      actor_id: string;
    }
  | {
      kind: "shared";
      shared_with_actor_ids: string[];
    };

export type ActorMemoryIndex = {
  objective_ids: string[];
  objective_categories: string[];
  item_names: string[];
  block_names: string[];
  tool_names: string[];
  action_skill_ids: string[];
  diagnoses: string[];
  verifier_statuses: string[];
  causal_refs: string[];
};

export type ActorMemoryRecord = {
  schema: "actor-memory-record/v1";
  memory_id: string;
  actor_id: string;
  layer: ActorMemoryLayer;
  status: ActorMemoryStatus;
  confidence: ActorMemoryConfidence;
  scope: ActorMemoryScope;
  created_at: string;
  updated_at: string;
  summary: string;
  evidence_refs: string[];
  tags: string[];
  index: ActorMemoryIndex;
  content: JsonRecord;
};

export type ActorMemoryRef = {
  memory_id: string;
  layer: ActorMemoryLayer;
  status: ActorMemoryStatus;
  confidence: ActorMemoryConfidence;
  summary: string;
  evidence_refs: string[];
  reason: string;
  score: number;
};

export type ActorMemoryRetrievalPacket = {
  schema: "actor-memory-retrieval/v1";
  actor_id: string;
  retrieval_policy: {
    objective_id?: string;
    objective_category?: string;
    item_names: string[];
    action_skill_ids: string[];
    limit: number;
    ranking_signals: string[];
  };
  retrieved_episodic: ActorMemoryRef[];
  retrieved_procedural: ActorMemoryRef[];
  retrieved_semantic: ActorMemoryRef[];
  retrieved_social: ActorMemoryRef[];
  guardrails: ActorMemoryRef[];
  beliefs: ActorMemoryRef[];
};

export type ActorMemoryQuery = {
  objectiveId?: string;
  objectiveCategory?: string;
  itemNames?: readonly string[];
  actionSkillIds?: readonly string[];
  limit?: number;
};

const actorMemoryLayers: ActorMemoryLayer[] = [
  "working",
  "episodic",
  "semantic",
  "procedural",
  "social",
  "belief",
  "guardrail"
];

function unique(values: readonly (string | undefined | null)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(toJsonValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, toJsonValue(entry)])
    );
  }

  return null;
}

function emptyIndex(overrides: Partial<ActorMemoryIndex> = {}): ActorMemoryIndex {
  return {
    objective_ids: [],
    objective_categories: [],
    item_names: [],
    block_names: [],
    tool_names: [],
    action_skill_ids: [],
    diagnoses: [],
    verifier_statuses: [],
    causal_refs: [],
    ...overrides
  };
}

function directTrialRelativeRef(report: DirectGeneratedObjectiveReport) {
  return report.artifactRefs.actorWorkspaceTrialPath;
}

function compactHelperEvents(report: DirectGeneratedObjectiveReport) {
  return report.generated.execution.helperEvents.map((event) => ({
    name: event.name,
    args: toJsonValue(event.args),
    status: event.status ?? null,
    ...(event.error ? { error: event.error } : {})
  }));
}

function directTrialDiagnosis(report: DirectGeneratedObjectiveReport) {
  if (report.evidence.verifierStatus === "passed") {
    return "verified_current_run_inventory_delta";
  }

  if (report.generated.execution.status === "timeout") {
    return "timeout";
  }

  if (report.generated.execution.status === "rejected") {
    return "provider_code_rejected";
  }

  if (report.generated.execution.status === "skill_error") {
    return "provider_code_error";
  }

  if (report.evidence.delta <= 0) {
    return "inventory_no_delta";
  }

  return "verification_failed";
}

export function buildDirectGeneratedObjectiveMemoryRecords(input: {
  report: DirectGeneratedObjectiveReport;
  now?: string;
}): ActorMemoryRecord[] {
  const now = input.now ?? new Date().toISOString();
  const report = input.report;
  const objective = getObjectiveDefinition(report.objectiveId);
  const artifactRef = directTrialRelativeRef(report);
  const diagnosis = directTrialDiagnosis(report);
  const baseIndex = emptyIndex({
    objective_ids: [report.objectiveId],
    objective_categories: ["craft"],
    item_names: unique([
      objective.target.itemName,
      ...report.evidence.preInventory.map((item) => item.name),
      ...report.evidence.postInventory.map((item) => item.name)
    ]),
    action_skill_ids: [...objective.requiredActionSkillIds],
    diagnoses: [diagnosis],
    verifier_statuses: [report.evidence.verifierStatus],
    causal_refs: [artifactRef]
  });
  const base = {
    actor_id: report.actorId,
    created_at: now,
    updated_at: now,
    scope: {
      kind: "actor_private" as const,
      actor_id: report.actorId
    },
    evidence_refs: [artifactRef],
    tags: unique([
      "direct-generated-objective",
      report.objectiveId,
      report.evidence.itemName,
      report.status
    ])
  };

  const episodic: ActorMemoryRecord = {
    schema: "actor-memory-record/v1",
    memory_id: `episode-${report.runId}`,
    layer: "episodic",
    status: "active",
    confidence: "observed",
    summary:
      report.status === "passed"
        ? `${report.actorId} produced ${report.evidence.itemName} through a current-run direct action trial.`
        : `${report.actorId} attempted ${report.evidence.itemName} through a direct action trial but verification failed.`,
    index: baseIndex,
    content: toJsonValue({
      kind: "direct_generated_objective_episode",
      run_id: report.runId,
      objective_id: report.objectiveId,
      provider_id: report.generated.providerId,
      model: report.generated.model,
      execution_status: report.generated.execution.status,
      verifier_status: report.evidence.verifierStatus,
      verifier_reason: report.evidence.verifierReason,
      pre_inventory: report.evidence.preInventory,
      post_inventory: report.evidence.postInventory,
      helper_events: compactHelperEvents(report),
      generated_source_ref: report.generated.sourcePath ?? null,
      provider_input_ref: report.generated.providerInputRef ?? null,
      provider_output_ref: report.generated.providerOutputRef ?? null,
      diagnosis
    }) as JsonRecord,
    ...base
  };

  if (report.status === "passed") {
    const procedural: ActorMemoryRecord = {
      schema: "actor-memory-record/v1",
      memory_id: `procedure-candidate-${report.runId}`,
      layer: "procedural",
      status: "candidate",
      confidence: "observed",
      summary: `Candidate procedure: generate and execute a Mineflayer TypeScript plan for ${report.objectiveId}.`,
      index: {
        ...baseIndex,
        diagnoses: ["candidate_procedure_from_verified_direct_trial"]
      },
      content: toJsonValue({
        kind: "direct_generated_procedural_candidate",
        objective_id: report.objectiveId,
        action_skill_ids: objective.requiredActionSkillIds,
        helper_sequence: report.generated.execution.helperEvents.map((event) => event.name),
        proof_ref: artifactRef,
        generated_source_ref: report.generated.sourcePath ?? null,
        promotion_boundary: "candidate_until_reviewed_and_promoted"
      }) as JsonRecord,
      ...base
    };

    return [episodic, procedural];
  }

  const guardrail: ActorMemoryRecord = {
    schema: "actor-memory-record/v1",
    memory_id: `guardrail-candidate-${report.runId}`,
    layer: "guardrail",
    status: "candidate",
    confidence: "observed",
    summary: `Guardrail candidate: do not treat ${report.objectiveId} as successful without current-run ${report.evidence.itemName} inventory evidence.`,
    index: {
      ...baseIndex,
      diagnoses: unique([
        diagnosis,
        report.evidence.delta <= 0 ? "inventory_no_delta" : null,
        "guardrail_candidate_from_failed_direct_trial"
      ])
    },
    content: toJsonValue({
      kind: "direct_generated_guardrail_candidate",
      objective_id: report.objectiveId,
      failed_because: report.evidence.verifierReason,
      execution_status: report.generated.execution.status,
      proof_ref: artifactRef,
      applies_until: "future_verified_trial_supersedes_this_guardrail"
    }) as JsonRecord,
    ...base
  };

  return [episodic, guardrail];
}

export async function writeActorMemoryRecord(rootDir: string, record: ActorMemoryRecord) {
  const filePath = getActorMemoryRecordPath(
    rootDir,
    record.actor_id,
    record.layer,
    record.memory_id
  );
  await writeJson(filePath, record);
  return filePath;
}

export async function writeActorMemoryRecords(rootDir: string, records: readonly ActorMemoryRecord[]) {
  return Promise.all(records.map((record) => writeActorMemoryRecord(rootDir, record)));
}

async function readJsonIfExists<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function listLayerRecords(rootDir: string, actorId: string, layer: ActorMemoryLayer) {
  const filePath = getActorMemoryRecordPath(rootDir, actorId, layer, "placeholder");
  const dir = path.dirname(filePath);
  let entries: string[];

  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const records = await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".json"))
      .sort()
      .map((entry) => readJsonIfExists<ActorMemoryRecord>(path.join(dir, entry)))
  );

  return records.filter((record): record is ActorMemoryRecord => Boolean(record));
}

export async function listActorMemoryRecords(
  rootDir: string,
  actorId: string,
  layers: readonly ActorMemoryLayer[] = actorMemoryLayers
) {
  const records = await Promise.all(layers.map((layer) => listLayerRecords(rootDir, actorId, layer)));
  return records.flat().sort((left, right) => left.created_at.localeCompare(right.created_at));
}

function recordScore(record: ActorMemoryRecord, query: ActorMemoryQuery) {
  if (record.status === "rejected" || record.status === "superseded" || record.status === "stale") {
    return null;
  }

  const reasons: string[] = [];
  let score = 0;

  if (query.objectiveId && record.index.objective_ids.includes(query.objectiveId)) {
    score += 12;
    reasons.push(`objective:${query.objectiveId}`);
  }

  if (query.objectiveCategory && record.index.objective_categories.includes(query.objectiveCategory)) {
    score += 4;
    reasons.push(`category:${query.objectiveCategory}`);
  }

  const itemMatches = (query.itemNames ?? []).filter((itemName) =>
    record.index.item_names.includes(itemName)
  );
  if (itemMatches.length > 0) {
    score += itemMatches.length * 5;
    reasons.push(`items:${itemMatches.join(",")}`);
  }

  const actionSkillMatches = (query.actionSkillIds ?? []).filter((skillId) =>
    record.index.action_skill_ids.includes(skillId)
  );
  if (actionSkillMatches.length > 0) {
    score += actionSkillMatches.length * 4;
    reasons.push(`action-skills:${actionSkillMatches.join(",")}`);
  }

  if (record.layer === "guardrail") {
    score += 3;
    reasons.push("guardrail");
  }

  if (record.layer === "procedural" && record.status === "candidate") {
    score += 2;
    reasons.push("procedural-candidate");
  }

  if (score <= 0) {
    return null;
  }

  return { score, reason: reasons.join("; ") };
}

function toMemoryRef(record: ActorMemoryRecord, score: number, reason: string): ActorMemoryRef {
  return {
    memory_id: record.memory_id,
    layer: record.layer,
    status: record.status,
    confidence: record.confidence,
    summary: record.summary,
    evidence_refs: [...record.evidence_refs],
    reason,
    score
  };
}

function bucketRefs(refs: ActorMemoryRef[]) {
  return {
    retrieved_episodic: refs.filter((ref) => ref.layer === "episodic"),
    retrieved_procedural: refs.filter((ref) => ref.layer === "procedural"),
    retrieved_semantic: refs.filter((ref) => ref.layer === "semantic"),
    retrieved_social: refs.filter((ref) => ref.layer === "social"),
    guardrails: refs.filter((ref) => ref.layer === "guardrail"),
    beliefs: refs.filter((ref) => ref.layer === "belief")
  };
}

export function listActorMemoryRefs(packet: ActorMemoryRetrievalPacket): ActorMemoryRef[] {
  return [
    ...packet.retrieved_episodic,
    ...packet.retrieved_procedural,
    ...packet.retrieved_semantic,
    ...packet.retrieved_social,
    ...packet.guardrails,
    ...packet.beliefs
  ];
}

export async function retrieveActorMemoryForObjective(
  rootDir: string,
  actorId: string,
  query: ActorMemoryQuery = {}
): Promise<ActorMemoryRetrievalPacket> {
  const limit = query.limit ?? 8;
  const records = await listActorMemoryRecords(rootDir, actorId);
  const ranked = records
    .map((record) => {
      const scored = recordScore(record, query);
      return scored ? toMemoryRef(record, scored.score, scored.reason) : null;
    })
    .filter((record): record is ActorMemoryRef => Boolean(record))
    .sort((left, right) => right.score - left.score || right.memory_id.localeCompare(left.memory_id))
    .slice(0, limit);
  const buckets = bucketRefs(ranked);

  return {
    schema: "actor-memory-retrieval/v1",
    actor_id: actorId,
    retrieval_policy: {
      ...(query.objectiveId ? { objective_id: query.objectiveId } : {}),
      ...(query.objectiveCategory ? { objective_category: query.objectiveCategory } : {}),
      item_names: unique(query.itemNames ?? []),
      action_skill_ids: unique(query.actionSkillIds ?? []),
      limit,
      ranking_signals: [
        "actor_scope",
        "objective_id",
        "objective_category",
        "item_names",
        "action_skill_ids",
        "status",
        "layer"
      ]
    },
    ...buckets
  };
}

export async function writeDirectGeneratedObjectiveMemory(input: {
  actorWorkspaceRootDir: string;
  report: DirectGeneratedObjectiveReport;
  now?: string;
}) {
  const records = buildDirectGeneratedObjectiveMemoryRecords({
    report: input.report,
    now: input.now
  });
  const paths = await writeActorMemoryRecords(input.actorWorkspaceRootDir, records);
  const actorPaths = getActorWorkspacePaths(input.actorWorkspaceRootDir, input.report.actorId);
  await writeJson(path.join(actorPaths.memory.indexDir, "latest-direct-objective-memory.json"), {
    schema: "actor-memory-index/v1",
    actor_id: input.report.actorId,
    updated_at: input.now ?? new Date().toISOString(),
    latest_objective_id: input.report.objectiveId,
    memory_refs: paths.map((filePath) => path.relative(actorPaths.actorDir, filePath))
  });
  return paths;
}
