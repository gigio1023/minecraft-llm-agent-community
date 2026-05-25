import { randomUUID } from "node:crypto";

import type { SocialCycleContextPacket } from "../runtime/goals/cycleContextAssembler.js";
import type { ActionIntent, ActorCycleGoal, CycleJudgment } from "../runtime/goals/types.js";
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
        next_goal_pressure: { type: "array", items: { type: "string" } }
      },
      required: [
        "outcome",
        "what_happened",
        "why_it_mattered_for_life_goal",
        "verifier_status",
        "memory_writes",
        "relationship_event_proposals",
        "next_goal_pressure"
      ]
    }
  },
  required: ["cycle_judgment"]
} as const;

export type CycleJudgmentProviderResult =
  | { ok: true; judgment: CycleJudgment; judgmentRef: string; inputRef: string; outputRef: string }
  | { ok: false; error: string; inputRef: string; outputRef: string };

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

  let judgmentBody: Omit<CycleJudgment, "schema" | "actor_id" | "cycle_id" | "cycle_goal_id" | "evidence_refs">;
  let usageRecord: ProviderUsageRecord | undefined;

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
      next_goal_pressure: input.context.previous_cycle_judgments.length
        ? ["Consider prior judgment when choosing the next CycleGoal"]
        : ["Continue settlement contribution under LifeGoal"]
    };
  } else {
    const providerCall = {
      schemaName: "social_cycle_judgment",
      schema: judgmentSchema,
      system: `Write CycleJudgment from runtime evidence only. Do not claim verified_progress unless executed_tools include a meaningful gameplay primitive (for example collect_logs, mine_block, craft_item) with supporting evidence_refs and, for action-skill bundles, passing postcondition_results.
Use partial_verified_progress only when runtime_result/tool_statuses show current-run world, inventory, movement, container, or block mutation but the final verifier or action-skill postcondition did not pass.
observe-only cycles are no_progress, not verified_progress. ActorSoul, ActorLifeGoal, memory_packet, relationship_context, action_surface, and world_events must inform why_it_mattered_for_life_goal without inventing facts. JSON only.`,
      user: JSON.stringify(providerInput),
      usageContext: {
        runId: input.runId,
        actorId: input.actorId,
        turnId,
        stage: "cycle_judgment"
      }
    };
    const result = input.providerId === "gemini-api" ? await callGeminiJsonSchema<{
      cycle_judgment: {
        outcome: CycleJudgment["outcome"];
        what_happened: string;
        why_it_mattered_for_life_goal: string;
        verifier_status: CycleJudgment["verifier_status"];
        memory_writes: CycleJudgment["memory_writes"];
        relationship_event_proposals: CycleJudgment["relationship_event_proposals"];
        next_goal_pressure: string[];
      };
    }>({
      config: input.gemini!,
      ...providerCall
    }) : await callOpenAiJsonSchema<{
      cycle_judgment: {
        outcome: CycleJudgment["outcome"];
        what_happened: string;
        why_it_mattered_for_life_goal: string;
        verifier_status: CycleJudgment["verifier_status"];
        memory_writes: CycleJudgment["memory_writes"];
        relationship_event_proposals: CycleJudgment["relationship_event_proposals"];
        next_goal_pressure: string[];
      };
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
    const raw = (payload.cycle_judgment ?? {}) as Record<string, unknown>;
    judgmentBody = {
      outcome: raw.outcome as CycleJudgment["outcome"],
      what_happened: String(raw.what_happened ?? ""),
      why_it_mattered_for_life_goal: String(raw.why_it_mattered_for_life_goal ?? ""),
      verifier_status: input.verifierStatus,
      memory_writes: Array.isArray(raw.memory_writes)
        ? (raw.memory_writes as CycleJudgment["memory_writes"])
        : [],
      relationship_event_proposals: Array.isArray(raw.relationship_event_proposals)
        ? (raw.relationship_event_proposals as CycleJudgment["relationship_event_proposals"])
        : [],
      next_goal_pressure: asStringArray(raw.next_goal_pressure)
    };
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

  const validated = validateCycleJudgment(judgment);
  if (!validated.ok) {
    return {
      ok: false,
      error: validated.errors.join("; "),
      inputRef: inputPath,
      outputRef: ""
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
    raw_output_text: JSON.stringify(validated.judgment),
    parsed_output: validated.judgment as unknown as JsonValue,
    proposal: { judgment_ref: judgmentRef },
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
