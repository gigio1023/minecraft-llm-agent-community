import { randomUUID } from "node:crypto";

import type { SocialCycleContextPacket } from "../runtime/goals/cycleContextAssembler.js";
import type { ActionIntent, ActorCycleGoal, CycleJudgment } from "../runtime/goals/types.js";
import type { PlanBeadOperation } from "../runtime/goals/planBeads/index.js";
import { validateCycleJudgment } from "../runtime/goals/types.js";
import { writeCycleJudgment } from "../runtime/goals/cycleJudgmentStore.js";
import {
  clampCycleJudgmentOutcome,
  deterministicJudgmentOutcome
} from "../runtime/socialCycleProgress.js";
import { callOpenAiJsonSchema, type OpenAiJsonProviderConfig } from "./openaiApiJsonProvider.js";
import { callGeminiJsonSchema, type GeminiJsonProviderConfig } from "./geminiApiJsonProvider.js";
import { normalizeOpenAiJsonPayload } from "./normalizeOpenAiJsonPayload.js";
import { asStringArray } from "./llmJsonArrays.js";
import { writeProviderInputSnapshot } from "./providerInputStore.js";
import { writeProviderOutputSnapshot } from "./providerOutputStore.js";
import type { JsonValue } from "./inputSnapshot.js";
import type { ProviderUsageRecord } from "./providerUsageTracker.js";

const planBeadOperationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    schema: { type: "string", enum: ["plan-bead-operation/v1"] },
    actor_id: { type: "string" },
    op: {
      type: "string",
      enum: ["create", "update_notes", "set_status", "add_dependency"]
    },
    bead_id: { type: "string" },
    rationale: { type: "string" },
    evidence_refs: { type: "array", items: { type: "string" } },
    confidence: {
      type: "string",
      enum: ["observed", "reviewed", "inferred", "uncertain"]
    },
    expected_checkpoint_version: { type: "number" },
    patch: { type: "object" }
  },
  required: ["schema", "actor_id", "op", "rationale", "evidence_refs", "confidence", "patch"]
} as const;

const judgmentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    cycle_judgment: {
      type: "object",
      additionalProperties: false,
      properties: {
        outcome: {
          type: "string",
          enum: ["verified_progress", "partial_verified_progress", "no_progress", "blocked", "unsafe", "socially_resolved"]
        },
        what_happened: { type: "string" },
        why_it_mattered_for_life_goal: { type: "string" },
        verifier_status: {
          type: "string",
          enum: ["passed", "failed", "not_applicable"]
        },
        memory_writes: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              layer: {
                type: "string",
                enum: ["episodic", "procedural", "social", "belief", "guardrail"]
              },
              summary: { type: "string" },
              confidence: {
                type: "string",
                enum: ["observed", "inferred", "uncertain"]
              }
            },
            required: ["layer", "summary", "confidence"]
          }
        },
        relationship_event_proposals: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              target_actor_id: { type: "string" },
              kind: { type: "string" },
              evidence_refs: { type: "array", items: { type: "string" } }
            },
            required: ["target_actor_id", "kind", "evidence_refs"]
          }
        },
        bead_op_proposals: {
          type: "array",
          items: planBeadOperationSchema
        },
        next_goal_context: { type: "array", items: { type: "string" } }
      },
      required: [
        "outcome",
        "what_happened",
        "why_it_mattered_for_life_goal",
        "verifier_status",
        "memory_writes",
        "relationship_event_proposals",
        "bead_op_proposals",
        "next_goal_context"
      ]
    }
  },
  required: ["cycle_judgment"]
} as const;

export type CycleJudgmentProviderResult =
  | { ok: true; judgment: CycleJudgment; judgmentRef: string; inputRef: string; outputRef: string }
  | { ok: false; error: string; inputRef: string; outputRef: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function extractCycleJudgmentPayload(payload: Record<string, unknown>) {
  const nested = payload.cycle_judgment;
  if (isRecord(nested)) {
    return nested;
  }

  if (
    typeof payload.outcome === "string" ||
    typeof payload.what_happened === "string" ||
    typeof payload.why_it_mattered_for_life_goal === "string"
  ) {
    return payload;
  }

  return {};
}

type ProviderCycleJudgmentPayload = {
  outcome: CycleJudgment["outcome"];
  what_happened: string;
  why_it_mattered_for_life_goal: string;
  verifier_status: CycleJudgment["verifier_status"];
  memory_writes: CycleJudgment["memory_writes"];
  relationship_event_proposals: CycleJudgment["relationship_event_proposals"];
  bead_op_proposals: unknown[];
  next_goal_context: string[];
};

type CycleJudgmentBody = Omit<
  CycleJudgment,
  "schema" | "actor_id" | "cycle_id" | "cycle_goal_id" | "evidence_refs"
>;

export function buildCycleJudgmentBodyFromPayload(
  raw: Record<string, unknown>,
  verifierStatus: CycleJudgment["verifier_status"]
): CycleJudgmentBody {
  return {
    outcome: raw.outcome as CycleJudgment["outcome"],
    what_happened: String(raw.what_happened ?? ""),
    why_it_mattered_for_life_goal: String(raw.why_it_mattered_for_life_goal ?? ""),
    verifier_status: verifierStatus,
    memory_writes: Array.isArray(raw.memory_writes)
      ? (raw.memory_writes as CycleJudgment["memory_writes"])
      : [],
    relationship_event_proposals: Array.isArray(raw.relationship_event_proposals)
      ? (raw.relationship_event_proposals as CycleJudgment["relationship_event_proposals"])
      : [],
    bead_op_proposals: Array.isArray(raw.bead_op_proposals)
      ? [...raw.bead_op_proposals]
      : [],
    next_goal_context: asStringArray(raw.next_goal_context)
  };
}

function buildRuntimeFallbackJudgmentBody(input: {
  actionIntent: ActionIntent;
  executedTools: string[];
  toolStatuses?: Array<{ tool: string; status: string }>;
  verifierStatus: CycleJudgment["verifier_status"];
  validationErrors: readonly string[];
}): CycleJudgmentBody {
  const tools = input.executedTools.length > 0
    ? input.executedTools.join(", ")
    : input.actionIntent.kind;
  return {
    outcome: deterministicJudgmentOutcome({
      verifierStatus: input.verifierStatus,
      executedTools: input.executedTools,
      toolStatuses: input.toolStatuses
    }),
    what_happened: `Runtime recorded ${input.verifierStatus} evidence for ${tools}; the provider judgment payload was malformed.`,
    why_it_mattered_for_life_goal:
      "The cycle keeps truthful continuity by using verifier evidence instead of accepting malformed provider judgment text.",
    verifier_status: input.verifierStatus,
    memory_writes: [
      {
        layer: "guardrail",
        summary: `Provider judgment payload was malformed: ${input.validationErrors.join("; ")}`,
        confidence: "observed"
      }
    ],
    relationship_event_proposals: [],
    bead_op_proposals: [],
    next_goal_context: [
      "Use runtime evidence from the previous action; do not rely on the malformed provider judgment text."
    ]
  };
}

function deterministicBeadOpProposals(input: {
  actorId: string;
  cycleGoal: ActorCycleGoal;
  context: SocialCycleContextPacket;
  evidenceRefs: readonly string[];
}): PlanBeadOperation[] {
  if (input.evidenceRefs.length === 0 || !input.context.plan_bead_packet) {
    return [];
  }

  const selectedRefs = input.cycleGoal.derived_from.plan_bead_refs ?? [];
  const selectedReady = input.context.plan_bead_packet.ready_beads.find((bead) =>
    selectedRefs.includes(bead.checkpoint_ref)
  );
  if (selectedReady) {
    return [
      {
        schema: "plan-bead-operation/v1",
        actor_id: input.actorId,
        op: "set_status",
        bead_id: selectedReady.bead_id,
        rationale:
          "The current CycleGoal selected this ready PlanBead; mark it in_progress as work-state context only.",
        evidence_refs: [...input.evidenceRefs],
        confidence: "observed",
        patch: {
          status: "in_progress"
        }
      }
    ];
  }

  const current = input.context.plan_bead_packet.in_progress_beads[0];
  if (!current) {
    return [];
  }
  return [
    {
      schema: "plan-bead-operation/v1",
      actor_id: input.actorId,
      op: "update_notes",
      bead_id: current.bead_id,
      rationale:
        "Preserve current in-progress PlanBead continuity after the cycle judgment.",
      evidence_refs: [...input.evidenceRefs],
      confidence: "observed",
      patch: {
        in_progress: [
          ...current.notes_next,
          `Cycle ${input.cycleGoal.cycle_id} kept this bead in active context.`
        ]
      }
    }
  ];
}

/**
 * Writes CycleJudgment from runtime evidence and clamps provider overclaims.
 *
 * @remarks The model can explain why a result mattered, but the verifier status
 * and tool statuses decide whether the outcome is full, partial, or blocked.
 */
export async function runSocialCycleJudgmentProvider(input: {
  providerId: "openai-api" | "gemini-api" | "deterministic-social";
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  cycleGoal: ActorCycleGoal;
  actionIntent: ActionIntent;
  context: SocialCycleContextPacket;
  runtimeResult: JsonValue;
  evidenceRefs: string[];
  executedTools: string[];
  toolStatuses?: Array<{ tool: string; status: string }>;
  verifierStatus: CycleJudgment["verifier_status"];
  runId?: string;
  openAi?: OpenAiJsonProviderConfig;
  gemini?: GeminiJsonProviderConfig;
  turnId?: string;
  actionIndex?: number;
}): Promise<CycleJudgmentProviderResult> {
  const turnId = input.turnId ?? input.cycleId;
  const snapshotId = `cycle-judgment-${turnId}-${randomUUID()}`;
  const providerInput = {
    stage: "cycle_judgment",
    turn_id: turnId,
    action_index: input.actionIndex,
    ActorSoul: input.context.ActorSoul,
    ActorLifeGoal: input.context.ActorLifeGoal,
    cycle_goal: input.cycleGoal,
    action_intent: input.actionIntent,
    runtime_result: input.runtimeResult,
    evidence_refs: input.evidenceRefs,
    executed_tools: input.executedTools,
    tool_statuses: input.toolStatuses ?? [],
    verifier_status: input.verifierStatus,
    world_events: input.context.world_events,
    relationship_context: input.context.relationship_context,
    memory_packet: input.context.memory_packet,
    plan_bead_packet: input.context.plan_bead_packet ?? null,
    action_surface: input.context.action_surface,
    previous_cycle_judgments: input.context.previous_cycle_judgments,
    settlement_state: input.context.settlement_state,
    settlement_checklist: input.context.settlement_state.checklist
  } as JsonValue;

  const inputPath = await writeProviderInputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-input-snapshot/v1",
    snapshot_id: snapshotId,
    actor_id: input.actorId,
    turn_id: turnId,
    provider_id: input.providerId,
    model: input.openAi?.model ?? input.gemini?.model ?? "deterministic-social",
    created_at: new Date().toISOString(),
    input: providerInput
  });

  let judgmentBody: CycleJudgmentBody;
  let usageRecord: ProviderUsageRecord | undefined;
  let providerRawOutputText = "";
  let providerParsedPayload: JsonValue | undefined;

  if (input.providerId === "deterministic-social") {
    judgmentBody = {
      outcome: deterministicJudgmentOutcome({
        verifierStatus: input.verifierStatus,
        executedTools: input.executedTools,
        toolStatuses: input.toolStatuses
      }),
      what_happened: `Runtime ${input.verifierStatus} for ${input.actionIntent.kind}`,
      why_it_mattered_for_life_goal:
        "Baseline cycle records truthful runtime evidence against gatherer LifeGoal.",
      verifier_status: input.verifierStatus,
      memory_writes: [
        {
          layer: "episodic",
          summary: input.actionIntent.why_this_action,
          confidence: "observed"
        }
      ],
      relationship_event_proposals: [],
      next_goal_context: input.context.previous_cycle_judgments.length
        ? ["Consider prior judgment when choosing the next CycleGoal"]
        : ["Continue settlement contribution under LifeGoal"],
      bead_op_proposals: deterministicBeadOpProposals({
        actorId: input.actorId,
        cycleGoal: input.cycleGoal,
        context: input.context,
        evidenceRefs: input.evidenceRefs
      })
    };
  } else {
    const providerCall = {
      schemaName: "social_cycle_judgment",
      schema: judgmentSchema,
      system: `Write CycleJudgment from runtime evidence only. Treat observation as raw evidence; decide what mattered from ActorSoul, LifeGoal, role context, relationships, memory, blockers, PlanBead context, and runtime facts.
Do not claim verified_progress unless executed_tools include a meaningful gameplay primitive (for example collect_logs, mine_block, craft_item, consume_item) with supporting evidence_refs and, for action-skill bundles, passing postcondition_results.
Use partial_verified_progress only when runtime_result/tool_statuses show current-run world, inventory, movement, container, or block mutation but the final verifier or action-skill postcondition did not pass.
observe-only cycles are no_progress, not verified_progress. memory_writes are evidence-linked summaries or blocker/action-skill notes, not a diary of completed tasks.
plan_bead_packet is read-only continuity context. You may propose bead_op_proposals to create, defer, block, link, or update actor-owned work-state, but those proposals are not commands and runtime may reject invalid, stale, non-actor-relative, or authority-bearing operations. Use [] when no useful PlanBead update is justified. Use these operation shapes: create.patch={kind,title,description,acceptance_evidence_required,notes_next,priority}; update_notes.patch may include completed,in_progress,blockers,next,key_decisions string arrays; set_status.patch={status,close_kind?,close_reason?}; add_dependency.patch={bead_id,depends_on_bead_id,type,rationale,evidence_refs}. Every operation evidence_refs entry must cite current actor-workspace artifacts. A closed/satisfied PlanBead needs runtime evidence, guarded relationship evidence, or settlement evidence; provider prose, memory, judgment text, or plan_bead_packet alone cannot satisfy it.
ActorSoul, ActorLifeGoal, memory_packet, relationship_context, action_surface, and world_events must inform why_it_mattered_for_life_goal without inventing facts. JSON only.`,
      user: JSON.stringify(providerInput),
      usageContext: {
        runId: input.runId,
        actorId: input.actorId,
        turnId,
        stage: "cycle_judgment"
      }
    };
    const result = input.providerId === "gemini-api" ? await callGeminiJsonSchema<{
      cycle_judgment: ProviderCycleJudgmentPayload;
    }>({
      config: input.gemini!,
      ...providerCall
    }) : await callOpenAiJsonSchema<{
      cycle_judgment: ProviderCycleJudgmentPayload;
    }>({
      config: input.openAi!,
      ...providerCall
    });

    if (!result.ok) {
      const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
        schema: "provider-output-snapshot/v1",
        snapshot_id: `${snapshotId}-out`,
        actor_id: input.actorId,
        turn_id: turnId,
        provider_id: input.providerId,
        model: result.model,
        created_at: new Date().toISOString(),
        raw_output_text: result.rawText ?? "",
        parsed_output: {
          error: result.message,
          error_kind: result.errorKind,
          budget_decision: result.budgetDecision as unknown as JsonValue
        },
        proposal: { error: result.message },
        usage: result.usageRecord
      });
      return { ok: false, error: result.message, inputRef: inputPath, outputRef: outputPath };
    }

    const payload = normalizeOpenAiJsonPayload(result.parsed as Record<string, unknown>);
    usageRecord = result.usageRecord;
    providerRawOutputText = result.rawText;
    providerParsedPayload = payload as unknown as JsonValue;
    const raw = extractCycleJudgmentPayload(payload);
    judgmentBody = buildCycleJudgmentBodyFromPayload(raw, input.verifierStatus);
  }

  const judgment: CycleJudgment = clampCycleJudgmentOutcome({
    judgment: {
      schema: "cycle-judgment/v1",
      actor_id: input.actorId,
      cycle_id: input.cycleId,
      cycle_goal_id: input.cycleGoal.goal_id,
      evidence_refs: [...input.evidenceRefs],
      ...(input.runId ? { run_id: input.runId } : {}),
      ...judgmentBody
    },
    actionIntent: input.actionIntent,
    executedTools: input.executedTools,
    toolStatuses: input.toolStatuses
  });

  let validated = validateCycleJudgment(judgment);
  let providerInvalidErrors: string[] | undefined;
  let providerInvalidJudgment: CycleJudgment | undefined;

  if (!validated.ok && input.providerId !== "deterministic-social") {
    providerInvalidErrors = validated.errors;
    providerInvalidJudgment = judgment;
    const fallbackJudgment: CycleJudgment = clampCycleJudgmentOutcome({
      judgment: {
        schema: "cycle-judgment/v1",
        actor_id: input.actorId,
        cycle_id: input.cycleId,
        cycle_goal_id: input.cycleGoal.goal_id,
        evidence_refs: [...input.evidenceRefs],
        ...(input.runId ? { run_id: input.runId } : {}),
        ...buildRuntimeFallbackJudgmentBody({
          actionIntent: input.actionIntent,
          executedTools: input.executedTools,
          toolStatuses: input.toolStatuses,
          verifierStatus: input.verifierStatus,
          validationErrors: validated.errors
        })
      },
      actionIntent: input.actionIntent,
      executedTools: input.executedTools,
      toolStatuses: input.toolStatuses
    });
    validated = validateCycleJudgment(fallbackJudgment);
  }

  if (!validated.ok) {
    const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `${snapshotId}-out`,
      actor_id: input.actorId,
      turn_id: turnId,
      provider_id: input.providerId,
      model: input.openAi?.model ?? input.gemini?.model ?? "deterministic-social",
      created_at: new Date().toISOString(),
      raw_output_text: providerRawOutputText || JSON.stringify(judgment),
      parsed_output: {
        error: validated.errors.join("; "),
        invalid_judgment: judgment as unknown as JsonValue,
        provider_parsed_payload: providerParsedPayload ?? null
      } as unknown as JsonValue,
      proposal: { error: validated.errors.join("; ") },
      usage: usageRecord
    });

    return {
      ok: false,
      error: validated.errors.join("; "),
      inputRef: inputPath,
      outputRef: outputPath
    };
  }

  const { ref: judgmentRef } = await writeCycleJudgment(
    input.actorWorkspaceRootDir,
    input.actorId,
    validated.judgment,
    turnId
  );

  const outputPath = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-output-snapshot/v1",
    snapshot_id: `${snapshotId}-out`,
    actor_id: input.actorId,
    turn_id: turnId,
    provider_id: input.providerId,
    model: input.openAi?.model ?? input.gemini?.model ?? "deterministic-social",
    created_at: new Date().toISOString(),
    raw_output_text: providerRawOutputText || JSON.stringify(validated.judgment),
    parsed_output: providerInvalidErrors
      ? {
          provider_invalid_errors: providerInvalidErrors,
          provider_invalid_judgment: providerInvalidJudgment as unknown as JsonValue,
          provider_parsed_payload: providerParsedPayload ?? null,
          fallback_judgment: validated.judgment as unknown as JsonValue
        } as unknown as JsonValue
      : validated.judgment as unknown as JsonValue,
    proposal: {
      judgment_ref: judgmentRef,
      ...(providerInvalidErrors ? { runtime_fallback_judgment: true } : {})
    },
    usage: usageRecord
  });

  return {
    ok: true,
    judgment: validated.judgment,
    judgmentRef,
    inputRef: inputPath,
    outputRef: outputPath
  };
}
