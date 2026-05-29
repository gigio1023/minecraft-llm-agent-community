import type { ActionSurfacePacket } from "../actionSurface.js";
import type { SettlementState } from "../settlement/settlementState.js";
import type { SocialCycleContextPacket } from "./cycleContextAssembler.js";
import type {
  ActionIntent,
  ActorCycleGoal,
  ActorLifeGoal,
  ActorSoul
} from "./types.js";

export const socialCycleAuthorityContextNames = [
  "ActorSoul",
  "ActorLifeGoal",
  "current CycleGoal",
  "current ActionIntent",
  "latest observation summary/ref",
  "action_surface contracts",
  "verifier/evidence refs"
] as const;

export type SocialCycleAuthorityContextName = typeof socialCycleAuthorityContextNames[number];

export type SocialCycleManifestContextName =
  | SocialCycleAuthorityContextName
  | "previous CycleJudgments"
  | "memory packet"
  | "relationship context"
  | "world events"
  | "settlement state"
  | "runtime retry constraints";

export type SocialCycleManifestRetention =
  | "full"
  | "summary_and_ref"
  | "refs_only"
  | "not_present";

export type SocialCycleContextManifestEntry = {
  context_name: SocialCycleManifestContextName;
  authority_bearing: boolean;
  present: boolean;
  retention: SocialCycleManifestRetention;
  refs: string[];
  estimated_tokens: number;
  reason: string;
};

export type SocialCycleContextManifest = {
  schema: "social-cycle-context-manifest/v1";
  entries: SocialCycleContextManifestEntry[];
};

export type SocialCycleSummaryFactScope =
  | "identity_seed"
  | "life_goal_continuity"
  | "cycle_goal_context"
  | "action_intent_context"
  | "observation_state"
  | "action_surface_contract"
  | "runtime_evidence_refs"
  | "prior_judgment_context"
  | "memory_context"
  | "world_event_context"
  | "relationship_context"
  | "settlement_state"
  | "runtime_retry_constraints";

export type EvidenceBackedSocialCycleSummaryFact = {
  label: string;
  scope: SocialCycleSummaryFactScope;
  summary: string;
  evidence_refs: string[];
  physical_progress_claim: false;
};

export type SocialCycleCompactSummary = {
  schema: "social-cycle-compact-summary/v1";
  facts: EvidenceBackedSocialCycleSummaryFact[];
  physical_progress_claims: [];
  evidence_policy: {
    summary_facts_require_refs: true;
    progress_requires_verifier_evidence: true;
    checkpoint_does_not_verify_or_execute: true;
  };
};

export type SocialCycleContextCompactionTrigger =
  | "token_limit"
  | "cycle_boundary"
  | "operator_request"
  | "report_snapshot";

export type SocialCycleRecentRefs = {
  inputContextRef: string;
  latestObservationRef: string;
  cycleGoalRef: string;
  actionIntentRef?: string;
  recentActionRefs?: readonly string[];
  evidenceRefs?: readonly string[];
  verifierRefs?: readonly string[];
  judgmentRefs?: readonly string[];
  providerInputRefs?: readonly string[];
  providerOutputRefs?: readonly string[];
  memoryRefs?: readonly string[];
  reviewRefs?: readonly string[];
};

export type SocialCycleContextPacketLike = {
  schema?: string;
  ActorSoul: ActorSoul;
  ActorLifeGoal: ActorLifeGoal;
  previous_cycle_judgments?: SocialCycleContextPacket["previous_cycle_judgments"];
  observation?: SocialCycleContextPacket["observation"];
  action_surface: ActionSurfacePacket;
  relationship_context?: SocialCycleContextPacket["relationship_context"];
  memory_packet?: SocialCycleContextPacket["memory_packet"];
  settlement_state?: SettlementState;
  runtime_retry_constraints?: SocialCycleContextPacket["runtime_retry_constraints"];
  world_events?: SocialCycleContextPacket["world_events"];
};

export type BuildSocialCycleContextCheckpointInput<
  TContext extends SocialCycleContextPacketLike = SocialCycleContextPacketLike
> = {
  checkpointId?: string;
  createdAt?: string;
  context: TContext;
  currentCycleGoal: ActorCycleGoal;
  currentActionIntent?: ActionIntent | null;
  refs: SocialCycleRecentRefs;
  trigger: SocialCycleContextCompactionTrigger;
  reason: string;
  recentTailRefLimit?: number;
};

export type SocialCycleContextCheckpoint = {
  schema: "social-cycle-context-checkpoint/v1";
  checkpoint_id: string;
  created_at: string;
  actor_id: string;
  cycle_id: string;
  trigger: SocialCycleContextCompactionTrigger;
  reason: string;
  input_context_manifest: SocialCycleContextManifest;
  replacement_context_manifest: SocialCycleContextManifest;
  compact_summary: SocialCycleCompactSummary;
  recent_tail_refs: string[];
  estimated_tokens_before: number;
  estimated_tokens_after: number;
  rules: {
    local_token_estimate_only: true;
    no_provider_call: true;
    summaries_are_evidence_ref_backed: true;
    no_physical_progress_claims: true;
  };
};

const DEFAULT_RECENT_TAIL_REF_LIMIT = 16;

let checkpointIdCounter = 0;

function nextCheckpointId() {
  checkpointIdCounter += 1;
  return `social-cycle-context-checkpoint-${checkpointIdCounter}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueRefs(refs: readonly (string | undefined | null)[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const ref of refs) {
    if (typeof ref !== "string" || ref.length === 0 || seen.has(ref)) {
      continue;
    }
    seen.add(ref);
    result.push(ref);
  }
  return result;
}

function requireRef(name: string, ref: string | undefined) {
  if (typeof ref !== "string" || ref.length === 0) {
    throw new Error(`${name} is required for social-cycle context compaction`);
  }
  return ref;
}

function truncate(value: string, maxLength = 240) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function describeList(values: readonly string[], empty = "none", limit = 8) {
  if (values.length === 0) {
    return empty;
  }
  const head = values.slice(0, limit);
  const suffix = values.length > limit ? `, +${values.length - limit} more` : "";
  return `${head.join(", ")}${suffix}`;
}

function estimateTextTokens(text: string) {
  const matches = text.match(/[A-Za-z0-9_]+|[^\sA-Za-z0-9_]/g);
  const lexicalEstimate = Math.ceil((matches?.length ?? 0) * 0.75);
  const byteEstimate = Math.ceil(text.length / 4);
  return Math.max(1, lexicalEstimate, byteEstimate);
}

/** Uses a deterministic local approximation so compaction never performs a provider call. */
export function estimateSocialCycleContextTokens(value: unknown): number {
  if (typeof value === "string") {
    return estimateTextTokens(value);
  }
  const serialized = JSON.stringify(value);
  return serialized ? estimateTextTokens(serialized) : 0;
}

function buildFact(input: {
  label: string;
  scope: SocialCycleSummaryFactScope;
  summary: string;
  evidenceRefs: readonly string[];
}): EvidenceBackedSocialCycleSummaryFact {
  const evidenceRefs = uniqueRefs(input.evidenceRefs);
  if (evidenceRefs.length === 0) {
    throw new Error(`Compact summary fact "${input.label}" must include evidence_refs`);
  }
  return {
    label: input.label,
    scope: input.scope,
    summary: truncate(input.summary),
    evidence_refs: evidenceRefs,
    physical_progress_claim: false
  };
}

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function positionSummary(value: unknown) {
  if (!isRecord(value)) {
    return undefined;
  }
  const x = readNumber(value.x);
  const y = readNumber(value.y);
  const z = readNumber(value.z);
  if (x === undefined || y === undefined || z === undefined) {
    return undefined;
  }
  return `(${x}, ${y}, ${z})`;
}

function inventorySummary(observation: unknown) {
  const inventory = isRecord(observation) ? observation.inventory : undefined;
  if (!Array.isArray(inventory)) {
    return "inventory not present";
  }
  const items = inventory
    .map((item) =>
      isRecord(item) && typeof item.name === "string" && typeof item.count === "number"
        ? `${item.name} x${item.count}`
        : null
    )
    .filter((item): item is string => item !== null);
  return describeList(items, "empty inventory", 10);
}

function worldObservationSummary(observation: unknown) {
  if (!isRecord(observation)) {
    return "world observation not present";
  }

  const summary = isRecord(observation.worldStateSummary)
    ? observation.worldStateSummary
    : undefined;
  const blockObservations = summary && isRecord(summary.block_observations)
    ? summary.block_observations
    : undefined;
  const byName = blockObservations && Array.isArray(blockObservations.by_name)
    ? blockObservations.by_name
    : [];
  const namedCounts = byName
    .map((entry) =>
      isRecord(entry) && typeof entry.name === "string" && typeof entry.count === "number"
        ? `${entry.name} x${entry.count}`
        : null
    )
    .filter((entry): entry is string => entry !== null);

  if (summary) {
    const scanId = readString(summary.scan_id) ?? "unknown-scan";
    const totalVerified = readNumber(blockObservations?.total_verified) ?? 0;
    const truncated = readBoolean(blockObservations?.truncated);
    const loadedCoverage = isRecord(summary.loaded_coverage)
      ? summary.loaded_coverage
      : undefined;
    const coverageScope = readString(loadedCoverage?.scope) ?? "unknown_scope";
    const nonExhaustive = loadedCoverage?.absence_claims_exhaustive === false ||
      loadedCoverage?.exhaustive === false ||
      coverageScope === "sampled_columns_only";
    const coverage = nonExhaustive ? `${coverageScope}/non_exhaustive` : coverageScope;
    const limitations = Array.isArray(summary.limitations)
      ? summary.limitations.filter((entry): entry is string => typeof entry === "string")
      : [];
    const limitationSummary = describeList(limitations, "no limitations retained", 3);
    return [
      `world scan ${scanId}`,
      `verified_blocks=${totalVerified}`,
      `truncated=${truncated ?? "unknown"}`,
      `coverage=${coverage}`,
      `retained block counts=${describeList(namedCounts, "none retained", 10)}`,
      `limitations=${limitationSummary}`
    ].join("; ");
  }

  const nearbyBlocks = Array.isArray(observation.nearbyBlocks)
    ? observation.nearbyBlocks
    : [];
  const nearby = nearbyBlocks
    .map((entry) =>
      isRecord(entry) && typeof entry.name === "string"
        ? `${entry.name}${typeof entry.distance === "number" ? ` d=${entry.distance}` : ""}`
        : null
    )
    .filter((entry): entry is string => entry !== null);

  // Legacy nearbyBlocks are a hint list, not enough evidence for absence.
  return `legacy nearby block hints=${describeList(nearby, "not retained", 10)}`;
}

function visibleActorsSummary(observation: unknown) {
  const visibleActors = isRecord(observation) ? observation.visibleActors : undefined;
  if (!Array.isArray(visibleActors)) {
    return "visible actors not present";
  }
  const actors = visibleActors
    .map((actor) => {
      if (!isRecord(actor)) {
        return null;
      }
      const id = readString(actor.id);
      const distance = readNumber(actor.distance);
      return id ? `${id}${distance === undefined ? "" : ` d=${distance}`}` : null;
    })
    .filter((entry): entry is string => entry !== null);
  return describeList(actors, "no visible actors", 8);
}

function observationSummary(observation: unknown) {
  const position = isRecord(observation) ? positionSummary(observation.position) : undefined;
  return [
    `observer=${isRecord(observation) ? readString(observation.observerId) ?? "unknown" : "unknown"}`,
    `position=${position ?? "unknown"}`,
    `inventory=${inventorySummary(observation)}`,
    `visible=${visibleActorsSummary(observation)}`,
    worldObservationSummary(observation)
  ].join("; ");
}

function actionTarget(intent: ActionIntent) {
  return intent.kind === "use_primitive"
    ? intent.primitive_id ?? "unknown_primitive"
    : intent.kind === "use_action_skill"
      ? intent.action_skill_id ?? "unknown_action_skill"
      : intent.kind;
}

function summarizeActionSurface(actionSurface: ActionSurfacePacket) {
  const directPrimitives = actionSurface.direct_primitives.map((primitive) => primitive.primitive_id);
  const directActionSkills = actionSurface.direct_action_skills.map((skill) => skill.action_skill_id);
  const deferred = [
    ...actionSurface.deferred_primitives.map((primitive) => primitive.primitive_id),
    ...actionSurface.deferred_action_skills.map((skill) => skill.action_skill_id)
  ];
  return [
    `direct primitives=${describeList(directPrimitives)}`,
    `direct action skills=${describeList(directActionSkills)}`,
    `deferred=${describeList(deferred)}`,
    `missing affordances=${describeList(actionSurface.missing_affordances)}`,
    `mineflayer expansion opportunities=${actionSurface.mineflayer_expansion_opportunities.length}`,
    "runtime verification remains required"
  ].join("; ");
}

function summarizeSettlementState(settlementState: SettlementState) {
  const inventory = Object.entries(settlementState.inventory_counts)
    .map(([name, count]) => `${name} x${count}`)
    .sort();
  const actorPosition = positionSummary(settlementState.known_positions.actor_position);
  const blockers = settlementState.blocker_histogram.map((blocker) =>
    `${blocker.key} x${blocker.count}`
  );
  return [
    `inventory state=${describeList(inventory, "empty inventory")}`,
    `actor position=${actorPosition ?? "unknown"}`,
    `shared storage=${settlementState.shared_storage.status}`,
    `recent blockers=${describeList(blockers)}`
  ].join("; ");
}

function summarizeRuntimeRetryConstraints(
  constraints: NonNullable<SocialCycleContextPacket["runtime_retry_constraints"]>
) {
  const rows = constraints.map((constraint) =>
    `${constraint.target.kind}:${constraint.target.id} args=${constraint.args_fingerprint} blocker=${constraint.blocker_key} repeats=${constraint.repeat_count}`
  );
  return `runtime retry constraints=${describeList(rows, "none")}`;
}

function manifestEntry(input: {
  contextName: SocialCycleManifestContextName;
  present: boolean;
  retention: SocialCycleManifestRetention;
  refs: readonly string[];
  estimatedValue: unknown;
  reason: string;
}): SocialCycleContextManifestEntry {
  return {
    context_name: input.contextName,
    authority_bearing: socialCycleAuthorityContextNames.includes(
      input.contextName as SocialCycleAuthorityContextName
    ),
    present: input.present,
    retention: input.present ? input.retention : "not_present",
    refs: uniqueRefs(input.refs),
    estimated_tokens: input.present ? estimateSocialCycleContextTokens(input.estimatedValue) : 0,
    reason: input.reason
  };
}

function buildInputManifest(input: {
  context: SocialCycleContextPacketLike;
  currentCycleGoal: ActorCycleGoal;
  currentActionIntent?: ActionIntent | null;
  refs: SocialCycleRecentRefs;
}): SocialCycleContextManifest {
  const { context, refs } = input;
  return {
    schema: "social-cycle-context-manifest/v1",
    entries: [
      manifestEntry({
        contextName: "ActorSoul",
        present: true,
        retention: "full",
        refs: [refs.inputContextRef],
        estimatedValue: context.ActorSoul,
        reason: "Input context includes the actor identity seed."
      }),
      manifestEntry({
        contextName: "ActorLifeGoal",
        present: true,
        retention: "full",
        refs: [refs.inputContextRef],
        estimatedValue: context.ActorLifeGoal,
        reason: "Input context includes LifeGoal continuity."
      }),
      manifestEntry({
        contextName: "current CycleGoal",
        present: true,
        retention: "full",
        refs: [refs.cycleGoalRef],
        estimatedValue: input.currentCycleGoal,
        reason: "Current CycleGoal remains the active bounded objective."
      }),
      manifestEntry({
        contextName: "current ActionIntent",
        present: Boolean(input.currentActionIntent),
        retention: "full",
        refs: refs.actionIntentRef ? [refs.actionIntentRef] : [],
        estimatedValue: input.currentActionIntent,
        reason: "Current ActionIntent is a proposal only; runtime evidence owns success."
      }),
      manifestEntry({
        contextName: "latest observation summary/ref",
        present: Boolean(context.observation),
        retention: "full",
        refs: [refs.latestObservationRef],
        estimatedValue: context.observation,
        reason: "Observation is retained as current state evidence with an artifact ref."
      }),
      manifestEntry({
        contextName: "action_surface contracts",
        present: Boolean(context.action_surface),
        retention: "full",
        refs: [refs.inputContextRef],
        estimatedValue: context.action_surface,
        reason: "Action surface defines current executable contracts, not strategy."
      }),
      manifestEntry({
        contextName: "verifier/evidence refs",
        present: true,
        retention: "refs_only",
        refs: [
          refs.latestObservationRef,
          ...(refs.evidenceRefs ?? []),
          ...(refs.verifierRefs ?? [])
        ],
        estimatedValue: {
          evidenceRefs: refs.evidenceRefs ?? [],
          verifierRefs: refs.verifierRefs ?? []
        },
        reason: "Verifier and evidence refs remain the authority for physical truth."
      }),
      manifestEntry({
        contextName: "previous CycleJudgments",
        present: (context.previous_cycle_judgments?.length ?? 0) > 0,
        retention: "full",
        refs: context.previous_cycle_judgments?.map((entry) => entry.ref) ?? [],
        estimatedValue: context.previous_cycle_judgments ?? [],
        reason: "Prior judgments provide context but do not become new physical facts."
      }),
      manifestEntry({
        contextName: "memory packet",
        present: Boolean(context.memory_packet),
        retention: "full",
        refs: [refs.inputContextRef, ...(refs.memoryRefs ?? [])],
        estimatedValue: context.memory_packet,
        reason: "Memory context is artifact-grounded context, not physical success."
      }),
      manifestEntry({
        contextName: "relationship context",
        present: Boolean(context.relationship_context),
        retention: "full",
        refs: [refs.inputContextRef],
        estimatedValue: context.relationship_context,
        reason: "Relationship context informs goals under ActorSoul/LifeGoal."
      }),
      manifestEntry({
        contextName: "world events",
        present: (context.world_events?.length ?? 0) > 0,
        retention: "full",
        refs: [refs.inputContextRef],
        estimatedValue: context.world_events ?? [],
        reason: "WorldEvents provide context and do not replace LifeGoal."
      }),
      manifestEntry({
        contextName: "settlement state",
        present: Boolean(context.settlement_state),
        retention: "full",
        refs: [refs.inputContextRef, ...(refs.evidenceRefs ?? [])],
        estimatedValue: context.settlement_state,
        reason: "Settlement state is runtime-owned state and blocker context."
      }),
      manifestEntry({
        contextName: "runtime retry constraints",
        present: (context.runtime_retry_constraints?.length ?? 0) > 0,
        retention: "full",
        refs: [refs.inputContextRef, ...(refs.evidenceRefs ?? [])],
        estimatedValue: context.runtime_retry_constraints ?? [],
        reason: "Retry constraints are runtime gates over exact repeated target/args failures."
      })
    ]
  };
}

function buildReplacementManifest(input: {
  context: SocialCycleContextPacketLike;
  currentCycleGoal: ActorCycleGoal;
  currentActionIntent?: ActionIntent | null;
  refs: SocialCycleRecentRefs;
  compactSummary: SocialCycleCompactSummary;
}): SocialCycleContextManifest {
  const factByLabel = new Map(input.compactSummary.facts.map((fact) => [fact.label, fact]));
  const latestObservationFact = factByLabel.get("latest observation");
  const actionSurfaceFact = factByLabel.get("action_surface contracts");
  const evidenceFact = factByLabel.get("verifier/evidence refs");
  const retryConstraintsFact = factByLabel.get("runtime retry constraints");
  return {
    schema: "social-cycle-context-manifest/v1",
    entries: [
      manifestEntry({
        contextName: "ActorSoul",
        present: true,
        retention: "full",
        refs: [input.refs.inputContextRef],
        estimatedValue: input.context.ActorSoul,
        reason: "Replacement context keeps ActorSoul as authority-bearing context."
      }),
      manifestEntry({
        contextName: "ActorLifeGoal",
        present: true,
        retention: "full",
        refs: [input.refs.inputContextRef],
        estimatedValue: input.context.ActorLifeGoal,
        reason: "Replacement context keeps LifeGoal continuity."
      }),
      manifestEntry({
        contextName: "current CycleGoal",
        present: true,
        retention: "full",
        refs: [input.refs.cycleGoalRef],
        estimatedValue: input.currentCycleGoal,
        reason: "Replacement context keeps the current CycleGoal contract."
      }),
      manifestEntry({
        contextName: "current ActionIntent",
        present: Boolean(input.currentActionIntent),
        retention: "full",
        refs: input.refs.actionIntentRef ? [input.refs.actionIntentRef] : [],
        estimatedValue: input.currentActionIntent,
        reason: "Replacement context keeps the current ActionIntent contract when one exists."
      }),
      manifestEntry({
        contextName: "latest observation summary/ref",
        present: Boolean(latestObservationFact),
        retention: "summary_and_ref",
        refs: [input.refs.latestObservationRef],
        estimatedValue: latestObservationFact,
        reason: "Raw observation is replaced by evidence-backed state summary plus ref."
      }),
      manifestEntry({
        contextName: "action_surface contracts",
        present: Boolean(actionSurfaceFact),
        retention: "summary_and_ref",
        refs: [input.refs.inputContextRef],
        estimatedValue: actionSurfaceFact,
        reason: "Action surface is compacted to executable/deferred contract summary."
      }),
      manifestEntry({
        contextName: "verifier/evidence refs",
        present: Boolean(evidenceFact),
        retention: "refs_only",
        refs: [
          input.refs.latestObservationRef,
          ...(input.refs.evidenceRefs ?? []),
          ...(input.refs.verifierRefs ?? [])
        ],
        estimatedValue: evidenceFact,
        reason: "Replacement context retains refs instead of restating physical progress."
      }),
      manifestEntry({
        contextName: "previous CycleJudgments",
        present: (input.context.previous_cycle_judgments?.length ?? 0) > 0,
        retention: "summary_and_ref",
        refs: input.context.previous_cycle_judgments?.map((entry) => entry.ref) ?? [],
        estimatedValue: input.compactSummary.facts.filter((fact) => fact.scope === "prior_judgment_context"),
        reason: "Prior judgments are summarized as judgment context, not new progress claims."
      }),
      manifestEntry({
        contextName: "memory packet",
        present: Boolean(input.context.memory_packet),
        retention: "summary_and_ref",
        refs: [input.refs.inputContextRef, ...(input.refs.memoryRefs ?? [])],
        estimatedValue: input.compactSummary.facts.filter((fact) => fact.scope === "memory_context"),
        reason: "Memory packet is compacted to artifact-backed retrieval summary."
      }),
      manifestEntry({
        contextName: "relationship context",
        present: Boolean(input.context.relationship_context),
        retention: "summary_and_ref",
        refs: [input.refs.inputContextRef],
        estimatedValue: input.compactSummary.facts.filter((fact) => fact.scope === "relationship_context"),
        reason: "Relationship context is summarized without mutating actor truth."
      }),
      manifestEntry({
        contextName: "world events",
        present: (input.context.world_events?.length ?? 0) > 0,
        retention: "summary_and_ref",
        refs: [input.refs.inputContextRef],
        estimatedValue: input.compactSummary.facts.filter((fact) => fact.scope === "world_event_context"),
        reason: "WorldEvents remain context under ActorSoul/LifeGoal."
      }),
      manifestEntry({
        contextName: "settlement state",
        present: Boolean(input.context.settlement_state),
        retention: "summary_and_ref",
        refs: [input.refs.inputContextRef, ...(input.refs.evidenceRefs ?? [])],
        estimatedValue: input.compactSummary.facts.filter((fact) => fact.scope === "settlement_state"),
        reason: "Settlement state is summarized as current state and blockers."
      }),
      manifestEntry({
        contextName: "runtime retry constraints",
        present: (input.context.runtime_retry_constraints?.length ?? 0) > 0,
        retention: "summary_and_ref",
        refs: [input.refs.inputContextRef, ...(input.refs.evidenceRefs ?? [])],
        estimatedValue: retryConstraintsFact,
        reason: "Retry constraints are compacted as gate state, not as provider advice."
      })
    ]
  };
}

function countArray(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function buildCompactSummary(input: {
  context: SocialCycleContextPacketLike;
  currentCycleGoal: ActorCycleGoal;
  currentActionIntent?: ActionIntent | null;
  refs: SocialCycleRecentRefs;
}): SocialCycleCompactSummary {
  const { context, refs } = input;
  const allEvidenceRefs = uniqueRefs([
    refs.latestObservationRef,
    ...(refs.evidenceRefs ?? []),
    ...(refs.verifierRefs ?? [])
  ]);
  const facts: EvidenceBackedSocialCycleSummaryFact[] = [
    buildFact({
      label: "ActorSoul",
      scope: "identity_seed",
      summary: `ActorSoul ${context.ActorSoul.actor_id} (${context.ActorSoul.role}) remains the identity seed: ${context.ActorSoul.life_goal}`,
      evidenceRefs: [refs.inputContextRef]
    }),
    buildFact({
      label: "ActorLifeGoal",
      scope: "life_goal_continuity",
      summary: `ActorLifeGoal ${context.ActorLifeGoal.goal_id} is ${context.ActorLifeGoal.status}: ${context.ActorLifeGoal.objective}`,
      evidenceRefs: [refs.inputContextRef]
    }),
    buildFact({
      label: "current CycleGoal",
      scope: "cycle_goal_context",
      summary: `CycleGoal ${input.currentCycleGoal.goal_id} for ${input.currentCycleGoal.cycle_id}: ${input.currentCycleGoal.summary}; success remains verifier-owned.`,
      evidenceRefs: [refs.cycleGoalRef]
    }),
    buildFact({
      label: "latest observation",
      scope: "observation_state",
      summary: `Latest observed state: ${observationSummary(context.observation)}. This is state context, not a progress claim.`,
      evidenceRefs: [refs.latestObservationRef]
    }),
    buildFact({
      label: "action_surface contracts",
      scope: "action_surface_contract",
      summary: summarizeActionSurface(context.action_surface),
      evidenceRefs: [refs.inputContextRef]
    }),
    buildFact({
      label: "verifier/evidence refs",
      scope: "runtime_evidence_refs",
      summary: `Retained runtime truth refs: evidence=${describeList(allEvidenceRefs)}; verifier=${describeList(refs.verifierRefs ?? [])}. The checkpoint records refs and does not verify new progress.`,
      evidenceRefs: allEvidenceRefs
    })
  ];

  if (input.currentActionIntent) {
    facts.push(buildFact({
      label: "current ActionIntent",
      scope: "action_intent_context",
      summary: `ActionIntent proposes ${input.currentActionIntent.kind}:${actionTarget(input.currentActionIntent)} for ${input.currentActionIntent.cycle_id}; execution and success are outside compaction.`,
      evidenceRefs: [requireRef("actionIntentRef", refs.actionIntentRef)]
    }));
  }

  for (const judgment of (context.previous_cycle_judgments ?? []).slice(-4)) {
    facts.push(buildFact({
      label: `previous CycleJudgment ${judgment.cycle_id}`,
      scope: "prior_judgment_context",
      summary: `Prior CycleJudgment ${judgment.cycle_id} reported outcome=${judgment.outcome}; checkpoint carries it only as judgment context.`,
      evidenceRefs: [judgment.ref]
    }));
  }

  if (context.settlement_state) {
    facts.push(buildFact({
      label: "settlement state",
      scope: "settlement_state",
      summary: `${summarizeSettlementState(context.settlement_state)}. Inventory and storage are current-state claims only.`,
      evidenceRefs: uniqueRefs([
        refs.inputContextRef,
        refs.latestObservationRef,
        ...context.settlement_state.shared_storage.evidence_refs,
        ...(refs.evidenceRefs ?? [])
      ])
    }));
  }

  if ((context.runtime_retry_constraints?.length ?? 0) > 0) {
    facts.push(buildFact({
      label: "runtime retry constraints",
      scope: "runtime_retry_constraints",
      summary: `${summarizeRuntimeRetryConstraints(context.runtime_retry_constraints!)}. These are exact target/args gates, not a domain strategy.`,
      evidenceRefs: uniqueRefs([
        refs.inputContextRef,
        ...(refs.evidenceRefs ?? []),
        ...context.runtime_retry_constraints!.flatMap((constraint) => constraint.evidence_refs)
      ])
    }));
  }

  if (context.memory_packet) {
    facts.push(buildFact({
      label: "memory packet",
      scope: "memory_context",
      summary: `Memory packet retained counts: episodic=${countArray((context.memory_packet as { retrieved_episodic?: unknown }).retrieved_episodic)}, procedural=${countArray((context.memory_packet as { retrieved_procedural?: unknown }).retrieved_procedural)}, social=${countArray((context.memory_packet as { retrieved_social?: unknown }).retrieved_social)}.`,
      evidenceRefs: [refs.inputContextRef, ...(refs.memoryRefs ?? [])]
    }));
  }

  if (context.relationship_context) {
    facts.push(buildFact({
      label: "relationship context",
      scope: "relationship_context",
      summary: `Relationship context retained counts: relationships=${countArray(context.relationship_context.relationships)}, incoming=${countArray(context.relationship_context.incoming_relationships)}, context signals=${countArray(context.relationship_context.relationship_context_signals)}.`,
      evidenceRefs: [refs.inputContextRef]
    }));
  }

  if ((context.world_events?.length ?? 0) > 0) {
    const summaries = context.world_events!.slice(-4).map((event) => event.summary);
    facts.push(buildFact({
      label: "world events",
      scope: "world_event_context",
      summary: `WorldEvents retained as context: ${describeList(summaries)}.`,
      evidenceRefs: [refs.inputContextRef, ...context.world_events!.flatMap((event) => event.evidence_refs)]
    }));
  }

  return {
    schema: "social-cycle-compact-summary/v1",
    facts,
    physical_progress_claims: [],
    evidence_policy: {
      summary_facts_require_refs: true,
      progress_requires_verifier_evidence: true,
      checkpoint_does_not_verify_or_execute: true
    }
  };
}

function recentTailRefs(input: {
  refs: SocialCycleRecentRefs;
  limit: number;
}) {
  const refs = input.refs;
  const orderedRefs = uniqueRefs([
    refs.inputContextRef,
    refs.cycleGoalRef,
    refs.actionIntentRef,
    ...(refs.recentActionRefs ?? []),
    refs.latestObservationRef,
    ...(refs.evidenceRefs ?? []),
    ...(refs.verifierRefs ?? []),
    ...(refs.judgmentRefs ?? []),
    ...(refs.providerInputRefs ?? []),
    ...(refs.providerOutputRefs ?? []),
    ...(refs.memoryRefs ?? []),
    ...(refs.reviewRefs ?? [])
  ]);
  return orderedRefs.slice(Math.max(0, orderedRefs.length - input.limit));
}

function assertCheckpointPolicy(checkpoint: SocialCycleContextCheckpoint) {
  for (const fact of checkpoint.compact_summary.facts) {
    if (fact.evidence_refs.length === 0) {
      throw new Error(`Compact summary fact "${fact.label}" lost evidence_refs`);
    }
    if (fact.physical_progress_claim !== false) {
      throw new Error(`Compact summary fact "${fact.label}" attempted a physical progress claim`);
    }
  }
  if (checkpoint.compact_summary.physical_progress_claims.length !== 0) {
    throw new Error("Social-cycle context checkpoint cannot include physical_progress_claims");
  }
}

/**
 * Builds a social-cycle checkpoint for future provider-context replacement.
 *
 * @remarks This helper is intentionally pure and local: it estimates token
 * counts with JSON/text size, keeps authority-bearing context names visible in
 * both manifests, and refuses summary facts without artifact refs. It does not
 * execute, verify, call a provider, or integrate with the cycle assembler.
 */
export function buildSocialCycleContextCheckpoint<
  TContext extends SocialCycleContextPacketLike = SocialCycleContextPacketLike
>(input: BuildSocialCycleContextCheckpointInput<TContext>): SocialCycleContextCheckpoint {
  if (input.reason.length === 0) {
    throw new Error("reason is required for social-cycle context compaction");
  }
  const refs = {
    ...input.refs,
    inputContextRef: requireRef("inputContextRef", input.refs.inputContextRef),
    latestObservationRef: requireRef("latestObservationRef", input.refs.latestObservationRef),
    cycleGoalRef: requireRef("cycleGoalRef", input.refs.cycleGoalRef)
  };
  if (input.currentActionIntent) {
    requireRef("actionIntentRef", refs.actionIntentRef);
  }

  const compactSummary = buildCompactSummary({
    context: input.context,
    currentCycleGoal: input.currentCycleGoal,
    currentActionIntent: input.currentActionIntent,
    refs
  });
  const inputManifest = buildInputManifest({
    context: input.context,
    currentCycleGoal: input.currentCycleGoal,
    currentActionIntent: input.currentActionIntent,
    refs
  });
  const replacementManifest = buildReplacementManifest({
    context: input.context,
    currentCycleGoal: input.currentCycleGoal,
    currentActionIntent: input.currentActionIntent,
    refs,
    compactSummary
  });
  const recentRefs = recentTailRefs({
    refs,
    limit: input.recentTailRefLimit ?? DEFAULT_RECENT_TAIL_REF_LIMIT
  });
  const estimatedBefore = estimateSocialCycleContextTokens({
    context: input.context,
    currentCycleGoal: input.currentCycleGoal,
    currentActionIntent: input.currentActionIntent,
    refs
  });
  const estimatedAfter = estimateSocialCycleContextTokens({
    ActorSoul: input.context.ActorSoul,
    ActorLifeGoal: input.context.ActorLifeGoal,
    currentCycleGoal: input.currentCycleGoal,
    currentActionIntent: input.currentActionIntent,
    compactSummary,
    recent_tail_refs: recentRefs
  });
  const checkpoint: SocialCycleContextCheckpoint = {
    schema: "social-cycle-context-checkpoint/v1",
    checkpoint_id: input.checkpointId ?? nextCheckpointId(),
    created_at: input.createdAt ?? new Date().toISOString(),
    actor_id: input.context.ActorSoul.actor_id,
    cycle_id: input.currentCycleGoal.cycle_id,
    trigger: input.trigger,
    reason: input.reason,
    input_context_manifest: inputManifest,
    replacement_context_manifest: replacementManifest,
    compact_summary: compactSummary,
    recent_tail_refs: recentRefs,
    estimated_tokens_before: estimatedBefore,
    estimated_tokens_after: estimatedAfter,
    rules: {
      local_token_estimate_only: true,
      no_provider_call: true,
      summaries_are_evidence_ref_backed: true,
      no_physical_progress_claims: true
    }
  };
  assertCheckpointPolicy(checkpoint);
  return checkpoint;
}
