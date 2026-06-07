/**
 * Branch-time Deliberation provider for reframing an Active Episode and
 * proposing guarded PlanBead operations.
 *
 * @remarks This stage is deliberately non-executable. It may preserve work
 * continuity and propose state updates, but it must not choose primitives,
 * Action Cards, generated source, or physical parameters.
 */
import { randomUUID } from "node:crypto";

import type { OpenAiJsonProviderConfig } from "./openaiApiJsonProvider.js";
import { callOpenAiJsonSchema } from "./openaiApiJsonProvider.js";
import type { GeminiJsonProviderConfig } from "./geminiApiJsonProvider.js";
import { callGeminiJsonSchema } from "./geminiApiJsonProvider.js";
import { normalizeOpenAiJsonPayload } from "./normalizeOpenAiJsonPayload.js";
import { writeProviderInputSnapshot } from "./providerInputStore.js";
import { writeProviderOutputSnapshot } from "./providerOutputStore.js";
import type { JsonValue } from "./inputSnapshot.js";
import type { ProviderUsageRecord } from "./providerUsageTracker.js";
import type { SocialCycleContextPacket } from "../runtime/goals/cycleContextAssembler.js";
import type { SocialCycleProviderId } from "../runtime/goals/types.js";
import {
  activeEpisodeStatuses,
  buildMinecraftBasicGuideProjection,
  buildActorTurnCurrentStateProjection,
  validateDeliberationOutput,
  writeActiveEpisode,
  type ActiveEpisode,
  type ActorTurnCurrentStateProjection,
  type DeliberationBranch,
  type DeliberationOutput,
  type EvidenceExpectation
} from "../runtime/goals/actorEpisode/index.js";
import {
  planBeadKinds,
  type PlanBeadKind,
  type PlanBeadPriority
} from "../runtime/goals/planBeads/index.js";

export const deliberationProviderSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    deliberation: {
      type: "object",
      additionalProperties: true,
      properties: {
        rationale: { type: "string" },
        next_episode: { type: "object", additionalProperties: true },
        plan_bead_op_proposals: {
          type: "array",
          items: { type: "object", additionalProperties: true }
        }
      },
      required: ["rationale", "next_episode", "plan_bead_op_proposals"]
    }
  },
  required: ["deliberation"]
} as const;

export const deliberationSystemPrompt = `You are the branch-time Deliberation provider for a Minecraft social simulation actor.
You may reframe the Active Episode and propose guarded PlanBead operations.
You must not choose an action, select an Action Card, emit primitive_id, action_skill_id, planner_action, generated source, helper settings, args, or executable parameters.
PlanBeads are durable work-state context only. They never supply physical args or prove Minecraft progress.
Use runtime evidence, branch reason, ActorSoul/LifeGoal context, memory refs, relationships, world events, and Minecraft Basic Guide.
Use current_state before older current_episode or PlanBead wording. If current_state.shared_storage is contributed and no deposit candidate is socially_requested, the shared-storage request is already satisfied; do not re-open chest/deposit/openability work unless a new unsatisfied request appears.
Keep the next Active Episode broad enough for a low-cost Actor Turn LLM to act freely, but concrete enough to avoid forgetting the branch reason.
PlanBead create proposals must be actionable compact-hint material: use a specific title, a description grounded in cited evidence, and next notes that say what remains open. Do not create a generic branch tracker such as "Branch concern <branch_id>" or "Track branch-time concern..."; return [] when no concrete durable concern is available.
If branch reason is episode_success, do not re-open the same successful action as the next focus. Use the evidence to pick a distinct next concern or prerequisite under the LifeGoal.
Return JSON only.`;

export type DeliberationProviderInput = {
  schema: "deliberation-input/v1";
  branch: DeliberationBranch;
  current_episode: ActiveEpisode;
  current_episode_ref: string;
  actor_context: {
    actor_id: string;
    life_goal_summary: string;
  };
  plan_bead_packet: SocialCycleContextPacket["plan_bead_packet"];
  current_state: ActorTurnCurrentStateProjection;
  memory_refs: string[];
  relationship_refs: string[];
  world_event_summaries: string[];
  previous_judgment_refs: string[];
  runtime_retry_constraints: SocialCycleContextPacket["runtime_retry_constraints"];
  minecraft_basic_guide: ReturnType<typeof buildMinecraftBasicGuideProjection>;
};

export type DeliberationProviderResult =
  | {
      ok: true;
      deliberation: DeliberationOutput;
      episode: ActiveEpisode;
      episodeRef: string;
      inputRef: string;
      outputRef: string;
    }
  | { ok: false; error: string; inputRef: string; outputRef: string };

function memoryRefs(context: SocialCycleContextPacket) {
  const packet = context.memory_packet;
  return [
    ...packet.retrieved_episodic.map((entry) => entry.memory_id),
    ...packet.retrieved_procedural.map((entry) => entry.memory_id),
    ...packet.retrieved_semantic.map((entry) => entry.memory_id),
    ...packet.retrieved_social.map((entry) => entry.memory_id),
    ...packet.guardrails.map((entry) => entry.memory_id),
    ...packet.beliefs.map((entry) => entry.memory_id)
  ];
}

function relationshipRefs(context: SocialCycleContextPacket) {
  return [
    ...context.relationship_context.relationships.map((_, index) => `relationships/outgoing-${index}`),
    ...context.relationship_context.incoming_relationships.map((_, index) => `relationships/incoming-${index}`),
    ...context.relationship_context.relationship_context_signals.map((_, index) => `relationship-signals/outgoing-${index}`),
    ...context.relationship_context.incoming_relationship_context_signals.map((_, index) => `relationship-signals/incoming-${index}`)
  ];
}

export function buildDeliberationProviderInput(input: {
  branch: DeliberationBranch;
  currentEpisode: ActiveEpisode;
  currentEpisodeRef: string;
  context: SocialCycleContextPacket;
}): DeliberationProviderInput {
  return {
    schema: "deliberation-input/v1",
    branch: input.branch,
    current_episode: input.currentEpisode,
    current_episode_ref: input.currentEpisodeRef,
    actor_context: {
      actor_id: input.context.ActorSoul.actor_id,
      life_goal_summary: input.context.ActorLifeGoal.objective
    },
    plan_bead_packet: input.context.plan_bead_packet,
    current_state: buildActorTurnCurrentStateProjection(input.context),
    memory_refs: memoryRefs(input.context),
    relationship_refs: relationshipRefs(input.context),
    world_event_summaries: input.context.world_events.map((event) => event.summary),
    previous_judgment_refs: input.context.previous_cycle_judgments.map((judgment) => judgment.ref),
    runtime_retry_constraints: input.context.runtime_retry_constraints,
    minecraft_basic_guide: buildMinecraftBasicGuideProjection()
  };
}

function deterministicDeliberation(input: {
  branch: DeliberationBranch;
  currentEpisode: ActiveEpisode;
  currentEpisodeRef: string;
}): DeliberationOutput {
  const nextEpisode: ActiveEpisode = {
    ...input.currentEpisode,
    episode_id: `episode-${input.branch.branch_id}`,
    purpose: `Reframe after ${input.branch.reason}: ${input.currentEpisode.purpose}`,
    current_focus: `Respond to ${input.branch.reason} while preserving the prior episode concern.`,
    opened_from_refs: [
      ...new Set([
        ...input.currentEpisode.opened_from_refs,
        input.currentEpisodeRef,
        ...input.branch.evidence_refs
      ])
    ],
    status: "active"
  };
  return {
    schema: "deliberation-output/v1",
    branch_id: input.branch.branch_id,
    current_episode_ref: input.currentEpisodeRef,
    rationale: `Deterministic Deliberation reframed the episode after ${input.branch.reason}.`,
    next_episode: nextEpisode,
    plan_bead_op_proposals: []
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stringArrayOr(value: unknown, fallback: readonly string[]) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  const strings = value.filter(nonEmptyString);
  return strings.length > 0 || fallback.length === 0 ? strings : [...fallback];
}

function arrayOr<T>(value: unknown, fallback: readonly T[]): unknown[] | readonly T[] {
  return Array.isArray(value) ? value : fallback;
}

const evidenceExpectationKinds = new Set<EvidenceExpectation["kind"]>([
  "inventory_delta",
  "position_delta",
  "block_delta",
  "container_delta",
  "chat_event",
  "relationship_event",
  "shared_storage_event",
  "world_scan",
  "runtime_artifact"
]);

function evidenceExpectationKindOrRuntimeArtifact(value: unknown) {
  return typeof value === "string" && evidenceExpectationKinds.has(value as EvidenceExpectation["kind"])
    ? value as EvidenceExpectation["kind"]
    : "runtime_artifact";
}

function normalizeSuccessSignals(value: unknown, fallback: ActiveEpisode["success_signals"]) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  const normalized = value.flatMap((entry) => {
    if (nonEmptyString(entry)) {
      return [{ kind: "runtime_artifact" as const, description: entry }];
    }
    if (!isRecord(entry)) {
      return [];
    }
    const description = nonEmptyString(entry.description)
      ? entry.description
      : nonEmptyString(entry.summary)
        ? entry.summary
        : nonEmptyString(entry.signal)
          ? entry.signal
          : "";
    if (!description) {
      return [];
    }
    return [{
      kind: evidenceExpectationKindOrRuntimeArtifact(entry.kind),
      description
    }];
  });
  return normalized.length > 0 || fallback.length === 0 ? normalized : [...fallback];
}

function normalizePivotTriggers(value: unknown, fallback: ActiveEpisode["pivot_triggers"]) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  const normalized = value.flatMap((entry) => {
    if (nonEmptyString(entry)) {
      return [{ trigger: entry, evidence_refs: [] }];
    }
    if (!isRecord(entry)) {
      return [];
    }
    const trigger = nonEmptyString(entry.trigger)
      ? entry.trigger
      : nonEmptyString(entry.description)
        ? entry.description
        : "";
    if (!trigger) {
      return [];
    }
    return [{
      trigger,
      evidence_refs: stringArrayOr(entry.evidence_refs, [])
    }];
  });
  return normalized.length > 0 || fallback.length === 0 ? normalized : [...fallback];
}

const socialPressureKinds = new Set([
  "chat",
  "request",
  "obligation",
  "visible_actor",
  "shared_storage",
  "world_event"
]);

function socialPressureKindOrWorldEvent(value: unknown) {
  return typeof value === "string" && socialPressureKinds.has(value)
    ? value as ActiveEpisode["social_pressure"][number]["kind"]
    : "world_event";
}

function normalizeSocialPressure(value: unknown, fallback: ActiveEpisode["social_pressure"]) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }
  const normalized = value.flatMap((entry) => {
    if (nonEmptyString(entry)) {
      return [{ kind: "world_event" as const, summary: entry, evidence_refs: [] }];
    }
    if (!isRecord(entry)) {
      return [];
    }
    const summary = nonEmptyString(entry.summary)
      ? entry.summary
      : nonEmptyString(entry.description)
        ? entry.description
        : "";
    if (!summary) {
      return [];
    }
    return [{
      kind: socialPressureKindOrWorldEvent(entry.kind),
      summary,
      evidence_refs: stringArrayOr(entry.evidence_refs, [])
    }];
  });
  return normalized.length > 0 || fallback.length === 0 ? normalized : [...fallback];
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.filter(nonEmptyString))];
}

function activeEpisodeStatusOrActive(value: unknown) {
  return typeof value === "string" && (activeEpisodeStatuses as readonly string[]).includes(value)
    ? value
    : "active";
}

function priorityFromUnknown(value: unknown): PlanBeadPriority {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 4) {
    return value as PlanBeadPriority;
  }
  if (typeof value !== "string") {
    return 2;
  }
  switch (value.toLowerCase()) {
    case "critical":
    case "urgent":
    case "high":
      return 0;
    case "medium":
      return 2;
    case "low":
      return 4;
    default:
      return 2;
  }
}

function kindFromUnknown(value: unknown): PlanBeadKind {
  if (typeof value === "string" && (planBeadKinds as readonly string[]).includes(value)) {
    return value as PlanBeadKind;
  }
  if (typeof value === "string" && value.toLowerCase().includes("repair")) {
    return "blocker_repair";
  }
  if (typeof value === "string" && value.toLowerCase().includes("resource")) {
    return "resource_project";
  }
  if (typeof value === "string" && value.toLowerCase().includes("investig")) {
    return "investigation";
  }
  return "concern";
}

function readStringField(record: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = record[key];
    if (nonEmptyString(value)) {
      return value;
    }
  }
  return undefined;
}

function objectStringValues(value: unknown) {
  if (!isRecord(value)) {
    return [];
  }
  return Object.values(value).filter(nonEmptyString);
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function textBlob(values: readonly unknown[]) {
  return values
    .filter(nonEmptyString)
    .join(" ")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function sharedStorageSatisfiedByCurrentState(
  currentState: ActorTurnCurrentStateProjection | undefined
) {
  return Boolean(
    currentState?.shared_storage.status === "contributed" &&
      currentState.shared_storage.evidence_refs.length > 0
  );
}

function looksLikeSatisfiedSharedStorageWork(text: string) {
  const mentionsStorage = /\b(shared storage|shared chest|chest|container)\b/.test(text);
  const mentionsCompletedRequest = /\b(deposit|contribut|oak log|oaklog|npc a|trust|openability|reachability|container ui|openable|reachable)\b/
    .test(text);
  return mentionsStorage && mentionsCompletedRequest;
}

function isGenericBranchConcernText(value: string, branchId: string) {
  const text = normalizeText(value).toLowerCase();
  const lowerBranchId = branchId.toLowerCase();
  return (
    text.length === 0 ||
    text === lowerBranchId ||
    text === "concern" ||
    text === "branch concern" ||
    text === "branch-time concern" ||
    text === "runtime evidence matching this planbead's concern" ||
    text === `branch concern ${lowerBranchId}` ||
    text === `track branch-time concern from ${lowerBranchId}.` ||
    text === `track branch-time concern from ${lowerBranchId}` ||
    text.startsWith("track branch-time concern")
  );
}

function concretePlanBeadText(value: unknown, branchId: string): string | undefined {
  return nonEmptyString(value) && !isGenericBranchConcernText(value, branchId)
    ? normalizeText(value)
    : undefined;
}

function concreteStringArray(value: unknown, branchId: string) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    const concrete = concretePlanBeadText(entry, branchId);
    return concrete === undefined ? [] : [concrete];
  });
}

function hasActionableCreateContent(input: {
  title: unknown;
  description: unknown;
  notesNext: unknown;
  acceptanceEvidenceRequired: unknown;
  durableContextStrings?: readonly string[];
  branchId: string;
}) {
  const title = concretePlanBeadText(input.title, input.branchId);
  const body = [
    concretePlanBeadText(input.description, input.branchId),
    ...concreteStringArray(input.notesNext, input.branchId),
    ...concreteStringArray(input.acceptanceEvidenceRequired, input.branchId),
    ...(input.durableContextStrings ?? []).flatMap((entry) => {
      const concrete = concretePlanBeadText(entry, input.branchId);
      return concrete === undefined ? [] : [concrete];
    })
  ].filter(nonEmptyString);
  return title !== undefined && body.length > 0;
}

function normalizePlanBeadProposal(input: {
  proposal: unknown;
  actorId: string;
  branchEvidenceRefs: readonly string[];
  branchId: string;
}): unknown | undefined {
  if (!isRecord(input.proposal)) {
    return input.proposal;
  }
  const proposal = input.proposal;
  const durableContextStrings = objectStringValues(proposal.durable_context);
  const evidenceRefs = stringArrayOr(proposal.evidence_refs, input.branchEvidenceRefs);
  const rationale =
    readStringField(proposal, ["rationale", "guarded_reason", "purpose", "reason", "notes"]) ??
    `Track branch-time concern from ${input.branchId}.`;
  const confidence = nonEmptyString(proposal.confidence) &&
    ["observed", "reviewed", "inferred", "uncertain"].includes(proposal.confidence)
      ? proposal.confidence
      : "inferred";

  if (proposal.schema === "plan-bead-operation/v1" || nonEmptyString(proposal.op)) {
    const patch = isRecord(proposal.patch)
      ? {
          ...proposal.patch,
          ...(proposal.op === "create"
            ? {
                kind: kindFromUnknown(proposal.patch.kind),
                priority: priorityFromUnknown(proposal.patch.priority)
              }
            : {})
        }
      : proposal.patch;
    if (
      proposal.op === "create" &&
      isRecord(patch) &&
      !hasActionableCreateContent({
        title: patch.title,
        description: patch.description,
        notesNext: patch.notes_next,
        acceptanceEvidenceRequired: patch.acceptance_evidence_required,
        branchId: input.branchId
      })
    ) {
      return undefined;
    }
    return {
      ...proposal,
      schema: "plan-bead-operation/v1",
      actor_id: nonEmptyString(proposal.actor_id) ? proposal.actor_id : input.actorId,
      rationale,
      evidence_refs: evidenceRefs,
      confidence,
      ...(patch !== undefined ? { patch } : {})
    };
  }

  const title =
    readStringField(proposal, ["title", "name", "plan_bead_ref", "bead_id", "bead_id_ref", "operation_type"]) ??
    `Branch concern ${input.branchId}`;
  const description =
    readStringField(proposal, ["description", "description_summary", "purpose", "guarded_reason", "notes"]) ??
    rationale;
  const acceptanceEvidence = uniqueStrings([
    ...stringArrayOr(proposal.acceptance_evidence_required, []),
    ...stringArrayOr(proposal.evidence_required, []),
    ...durableContextStrings.filter((entry) =>
      /success|counts as success|failure|target|goal|placement|conversion/i.test(entry)
    ),
    readStringField(proposal, ["ready_when"]) ?? "",
    "runtime evidence matching this PlanBead's concern"
  ]).slice(0, 6);
  const notesNext = uniqueStrings([
    ...stringArrayOr(proposal.notes_next, []),
    readStringField(proposal, ["ready_when"]) ?? "",
    readStringField(proposal, ["notes"]) ?? "",
    ...durableContextStrings
  ]).slice(0, 8);

  if (
    !hasActionableCreateContent({
      title,
      description,
      notesNext,
      acceptanceEvidenceRequired: acceptanceEvidence,
      durableContextStrings,
      branchId: input.branchId
    })
  ) {
    return undefined;
  }

  return {
    schema: "plan-bead-operation/v1",
    actor_id: input.actorId,
    rationale,
    evidence_refs: evidenceRefs,
    confidence,
    op: "create",
    patch: {
      kind: kindFromUnknown(proposal.operation_type ?? proposal.kind),
      title,
      description,
      acceptance_evidence_required: acceptanceEvidence.length > 0
        ? acceptanceEvidence
        : ["runtime evidence matching this PlanBead's concern"],
      notes_next: notesNext.length > 0 ? notesNext : [description],
      priority: priorityFromUnknown(proposal.priority)
    }
  };
}

function planBeadOperationText(operation: unknown) {
  if (!isRecord(operation)) {
    return "";
  }
  const patch = isRecord(operation.patch) ? operation.patch : {};
  return textBlob([
    operation.rationale,
    operation.bead_id,
    patch.title,
    patch.description,
    ...(Array.isArray(patch.acceptance_evidence_required) ? patch.acceptance_evidence_required : []),
    ...(Array.isArray(patch.notes_next) ? patch.notes_next : [])
  ]);
}

function episodeText(episode: ActiveEpisode) {
  const episodeRecord = episode as unknown as Record<string, unknown>;
  return textBlob([
    episodeRecord.title,
    episode.purpose,
    episode.current_focus,
    episodeRecord.episode_purpose,
    episodeRecord.broad_scope,
    ...episode.success_signals.map((signal) => signal.description),
    ...episode.pivot_triggers.map((trigger) => trigger.trigger),
    ...episode.social_pressure.map((pressure) => pressure.summary)
  ]);
}

function sanitizeDeliberationForCurrentState(input: {
  output: DeliberationOutput;
  currentState?: ActorTurnCurrentStateProjection;
}): DeliberationOutput {
  if (!sharedStorageSatisfiedByCurrentState(input.currentState)) {
    return input.output;
  }

  const filteredPlanBeadOps = input.output.plan_bead_op_proposals.filter((operation) =>
    !(
      isRecord(operation) &&
      operation.op === "create" &&
      looksLikeSatisfiedSharedStorageWork(planBeadOperationText(operation))
    )
  );
  const staleEpisode = looksLikeSatisfiedSharedStorageWork(episodeText(input.output.next_episode));
  if (!staleEpisode && filteredPlanBeadOps.length === input.output.plan_bead_op_proposals.length) {
    return input.output;
  }

  const contributionRefs = input.currentState?.shared_storage.evidence_refs ?? [];
  return {
    ...input.output,
    rationale: [
      input.output.rationale,
      "Runtime current_state already shows shared-storage contribution evidence, so stale chest/deposit/openability work is treated as completed context."
    ].join(" "),
    next_episode: staleEpisode
      ? {
          ...input.output.next_episode,
          purpose: "Continue after the completed shared-storage contribution with a distinct evidence-backed step.",
          current_focus:
            "Use current_state and visible Action Cards for a different useful Minecraft or social step; do not re-open the completed shared-storage deposit/openability request unless a new unsatisfied request appears.",
          selected_plan_bead_refs: [],
          related_plan_bead_refs: [],
          success_signals: [
            {
              kind: "runtime_artifact",
              description: "Runtime evidence of a distinct non-storage action, social response, or truthful blocker."
            }
          ],
          pivot_triggers: [
            {
              trigger: "A new unsatisfied social request creates a fresh shared-storage question.",
              evidence_refs: []
            },
            {
              trigger: "The chosen non-storage step succeeds or blocks with evidence.",
              evidence_refs: []
            }
          ],
          social_pressure: [
            ...input.output.next_episode.social_pressure,
            {
              kind: "shared_storage",
              summary: "Shared storage contribution is already satisfied in current_state.",
              evidence_refs: [...contributionRefs]
            }
          ]
        }
      : input.output.next_episode,
    plan_bead_op_proposals: filteredPlanBeadOps
  };
}

export function parseDeliberationProviderOutput(
  value: unknown,
  defaults: {
    branchId: string;
    currentEpisodeRef: string;
    currentEpisode: ActiveEpisode;
    branchEvidenceRefs: readonly string[];
    currentState?: ActorTurnCurrentStateProjection;
  }
):
  | { ok: true; output: DeliberationOutput }
  | { ok: false; errors: string[] } {
  const payload = isRecord(value) ? value as { deliberation?: unknown } : {};
  const body = isRecord(payload.deliberation)
    ? payload.deliberation
    : {};
  const rawNextEpisode = isRecord(body.next_episode) ? body.next_episode : {};
  const currentEpisode = defaults.currentEpisode;
  const nextEpisode = {
    ...currentEpisode,
    ...rawNextEpisode,
    schema: "active-episode/v1",
    episode_id: nonEmptyString(rawNextEpisode.episode_id)
      ? rawNextEpisode.episode_id
      : `episode-${defaults.branchId}`,
    actor_id: nonEmptyString(rawNextEpisode.actor_id)
      ? rawNextEpisode.actor_id
      : currentEpisode.actor_id,
    life_goal_ref: nonEmptyString(rawNextEpisode.life_goal_ref)
      ? rawNextEpisode.life_goal_ref
      : currentEpisode.life_goal_ref,
    actors_visible_or_relevant: stringArrayOr(
      rawNextEpisode.actors_visible_or_relevant,
      currentEpisode.actors_visible_or_relevant
    ),
    selected_plan_bead_refs: stringArrayOr(
      rawNextEpisode.selected_plan_bead_refs,
      currentEpisode.selected_plan_bead_refs
    ),
    related_plan_bead_refs: stringArrayOr(
      rawNextEpisode.related_plan_bead_refs,
      currentEpisode.related_plan_bead_refs
    ),
    opened_from_refs: uniqueStrings([
      ...currentEpisode.opened_from_refs,
      defaults.currentEpisodeRef,
      ...defaults.branchEvidenceRefs,
      ...stringArrayOr(rawNextEpisode.opened_from_refs, [])
    ]),
    success_signals: normalizeSuccessSignals(rawNextEpisode.success_signals, currentEpisode.success_signals),
    pivot_triggers: normalizePivotTriggers(rawNextEpisode.pivot_triggers, currentEpisode.pivot_triggers),
    mistake_budget: isRecord(rawNextEpisode.mistake_budget)
      ? rawNextEpisode.mistake_budget
      : currentEpisode.mistake_budget,
    social_pressure: normalizeSocialPressure(rawNextEpisode.social_pressure, currentEpisode.social_pressure),
    status: activeEpisodeStatusOrActive(rawNextEpisode.status)
  };
  const candidate = {
    schema: "deliberation-output/v1",
    ...body,
    branch_id: defaults.branchId,
    current_episode_ref: defaults.currentEpisodeRef,
    rationale: nonEmptyString(body.rationale)
      ? body.rationale
      : `Reframed Active Episode after branch ${defaults.branchId}.`,
    next_episode: nextEpisode,
    plan_bead_op_proposals: Array.isArray(body.plan_bead_op_proposals)
      ? body.plan_bead_op_proposals.flatMap((proposal) => {
          const normalized = normalizePlanBeadProposal({
            proposal,
            actorId: currentEpisode.actor_id,
            branchEvidenceRefs: defaults.branchEvidenceRefs,
            branchId: defaults.branchId
          });
          return normalized === undefined ? [] : [normalized];
        })
      : []
  };
  const result = validateDeliberationOutput(candidate);
  if (!result.ok) {
    return { ok: false, errors: result.errors };
  }
  const sanitized = sanitizeDeliberationForCurrentState({
    output: result.output,
    currentState: defaults.currentState
  });
  const sanitizedResult = validateDeliberationOutput(sanitized);
  return sanitizedResult.ok
    ? { ok: true, output: sanitizedResult.output }
    : { ok: false, errors: sanitizedResult.errors };
}

async function writeFailureOutput(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  turnId: string;
  providerId: SocialCycleProviderId;
  model: string;
  snapshotId: string;
  rawText?: string;
  error: string;
  usageRecord?: ProviderUsageRecord;
}) {
  return writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-output-snapshot/v1",
    snapshot_id: `${input.snapshotId}-out`,
    actor_id: input.actorId,
    turn_id: input.turnId,
    provider_id: input.providerId,
    model: input.model,
    created_at: new Date().toISOString(),
    raw_output_text: input.rawText ?? "",
    parsed_output: { error: input.error },
    proposal: { error: input.error },
    usage: input.usageRecord
  });
}

export async function runSocialDeliberationProvider(input: {
  providerId: SocialCycleProviderId;
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  branch: DeliberationBranch;
  currentEpisode: ActiveEpisode;
  currentEpisodeRef: string;
  context: SocialCycleContextPacket;
  openAi?: OpenAiJsonProviderConfig;
  gemini?: GeminiJsonProviderConfig;
  runId?: string;
}): Promise<DeliberationProviderResult> {
  const turnId = `${input.cycleId}-deliberation`;
  const snapshotId = `deliberation-${turnId}-${randomUUID()}`;
  const model = input.openAi?.model ?? input.gemini?.model ?? "deterministic-social";
  const providerInput = buildDeliberationProviderInput({
    branch: input.branch,
    currentEpisode: input.currentEpisode,
    currentEpisodeRef: input.currentEpisodeRef,
    context: input.context
  });
  const inputPath = await writeProviderInputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-input-snapshot/v1",
    snapshot_id: snapshotId,
    actor_id: input.actorId,
    turn_id: turnId,
    provider_id: input.providerId,
    model,
    created_at: new Date().toISOString(),
    input: providerInput as unknown as JsonValue
  });

  let deliberation: DeliberationOutput;
  let rawText = "";
  let usageRecord: ProviderUsageRecord | undefined;
  if (input.providerId === "deterministic-social") {
    deliberation = sanitizeDeliberationForCurrentState({
      output: deterministicDeliberation({
        branch: input.branch,
        currentEpisode: input.currentEpisode,
        currentEpisodeRef: input.currentEpisodeRef
      }),
      currentState: providerInput.current_state
    });
    rawText = JSON.stringify({ deliberation });
  } else {
    const providerCall = {
      schemaName: "social_deliberation",
      schema: deliberationProviderSchema,
      system: deliberationSystemPrompt,
      user: JSON.stringify(providerInput as unknown as JsonValue),
      usageContext: {
        runId: input.runId,
        actorId: input.actorId,
        turnId,
        stage: "deliberation"
      }
    };
    const result = input.providerId === "gemini-api"
      ? await callGeminiJsonSchema<{ deliberation: unknown }>({
          config: input.gemini!,
          ...providerCall
        })
      : await callOpenAiJsonSchema<{ deliberation: unknown }>({
          config: input.openAi!,
          ...providerCall
        });
    rawText = result.rawText ?? "";
    usageRecord = result.usageRecord;
    if (!result.ok) {
      const outputRef = await writeFailureOutput({
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        actorId: input.actorId,
        turnId,
        providerId: input.providerId,
        model: result.model,
        snapshotId,
        rawText,
        error: result.message,
        usageRecord
      });
      return { ok: false, error: result.message, inputRef: inputPath, outputRef };
    }
    const parsed = parseDeliberationProviderOutput(
      normalizeOpenAiJsonPayload(result.parsed as Record<string, unknown>),
      {
        branchId: input.branch.branch_id,
        currentEpisodeRef: input.currentEpisodeRef,
        currentEpisode: input.currentEpisode,
        branchEvidenceRefs: input.branch.evidence_refs,
        currentState: providerInput.current_state
      }
    );
    if (!parsed.ok) {
      const error = parsed.errors.join("; ");
      const outputRef = await writeFailureOutput({
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        actorId: input.actorId,
        turnId,
        providerId: input.providerId,
        model: result.model,
        snapshotId,
        rawText,
        error,
        usageRecord
      });
      return { ok: false, error, inputRef: inputPath, outputRef };
    }
    deliberation = parsed.output;
  }

  const episodeWrite = await writeActiveEpisode(
    input.actorWorkspaceRootDir,
    input.actorId,
    deliberation.next_episode
  );
  const outputRef = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-output-snapshot/v1",
    snapshot_id: `${snapshotId}-out`,
    actor_id: input.actorId,
    turn_id: turnId,
    provider_id: input.providerId,
    model,
    created_at: new Date().toISOString(),
    raw_output_text: rawText,
    parsed_output: deliberation as unknown as JsonValue,
    proposal: {
      active_episode_ref: episodeWrite.ref,
      plan_bead_op_proposals: deliberation.plan_bead_op_proposals as unknown as JsonValue
    },
    usage: usageRecord
  });

  return {
    ok: true,
    deliberation,
    episode: deliberation.next_episode,
    episodeRef: episodeWrite.ref,
    inputRef: inputPath,
    outputRef
  };
}
