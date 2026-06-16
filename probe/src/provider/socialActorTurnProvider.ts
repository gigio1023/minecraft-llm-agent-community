/**
 * Actor Turn provider orchestration.
 *
 * @remarks Tool contracts and parsers live in sibling modules. This file owns
 * provider calls, one guided repair, direct Actor Turn action resolution, and
 * artifacts.
 */
import { randomUUID } from "node:crypto";
import path from "node:path";

import type {
  ActorTurnInput,
  ActorTurnExecutionDraft,
  ActorTurnResolvedAction,
  JsonObject
} from "../runtime/goals/actorEpisode/index.js";
import {
  defaultExpectedOutcomeForActionSkill,
  defaultExpectedOutcomeForPrimitive,
  resolveActorTurnExecutionDraftToAction,
  type ActionCardProjection
} from "../runtime/goals/actorEpisode/index.js";
import type { SocialCycleProviderId } from "../runtime/goals/types.js";
import { writeActorGoalArtifact } from "../runtime/goals/goalJsonStore.js";
import type { GeminiJsonProviderConfig } from "./geminiApiJsonProvider.js";
import { callGeminiFunctionToolSelection } from "./geminiApiToolProvider.js";
import type { JsonValue } from "./inputSnapshot.js";
import type { OpenAiJsonProviderConfig } from "./openaiApiJsonProvider.js";
import { callOpenAiFunctionToolSelection } from "./openaiApiToolProvider.js";
import {
  callModelScopeFunctionToolSelection,
  type ModelScopeApiProviderConfig
} from "./modelscopeApiProvider.js";
import { writeProviderInputSnapshot } from "./providerInputStore.js";
import { writeProviderOutputSnapshot } from "./providerOutputStore.js";
import type {
  ProviderUsageBudgetDecision,
  ProviderUsageRecord
} from "./providerUsageTracker.js";
import {
  runMineflayerCodegenProvider,
  type MineflayerCodegenProviderResult
} from "./socialActorTurnCodegenProvider.js";
import { buildActorTurnToolSelectionPayload } from "./socialActorTurnToolContract.js";
import {
  parseActorTurnToolSelection,
  type ActorTurnToolSelection
} from "./socialActorTurnToolParser.js";

export {
  AUTHOR_MINEFLAYER_ACTION_TOOL_NAME,
  actorTurnToolNameForActionCard,
  buildActorTurnToolSelectionPayload
} from "./socialActorTurnToolContract.js";
export {
  parseActorTurnToolSelection,
  type ActorTurnToolSelection
} from "./socialActorTurnToolParser.js";
export {
  buildMineflayerCodegenRequest,
  buildMineflayerCodegenProviderPayload,
  type MineflayerCodegenOutput,
  type MineflayerCodegenRequest
} from "./socialActorTurnCodegenContract.js";
export { parseMineflayerCodegenProviderOutput } from "./socialActorTurnCodegenProvider.js";

export type ActorTurnProviderResult =
  | {
	      ok: true;
	      actorTurn: ActorTurnExecutionDraft;
	      action: ActorTurnResolvedAction;
	      actionRef: string;
      inputRef: string;
      outputRef: string;
      intermediateInputRefs?: string[];
      intermediateOutputRefs?: string[];
    }
  | {
      ok: false;
      failureKind?: "provider_contract_rejection";
      errorKind?: string;
      error: string;
      inputRef: string;
      outputRef: string;
      rawRejectedOutput?: JsonValue;
      budgetDecision?: ProviderUsageBudgetDecision;
      intermediateInputRefs?: string[];
      intermediateOutputRefs?: string[];
    };

type ActorTurnProviderAttempt =
  | {
      ok: true;
      actorTurn: ActorTurnExecutionDraft;
      inputRef: string;
      snapshotId: string;
      model: string;
      rawText: string;
      rawProviderOutput?: JsonValue;
      usageRecord?: ProviderUsageRecord;
      toolSelection?: ActorTurnToolSelection;
      toolSelectionRef?: string;
      codegen?: Extract<MineflayerCodegenProviderResult, { ok: true }>;
      intermediateInputRefs?: string[];
      intermediateOutputRefs?: string[];
    }
  | {
      ok: false;
      failureKind?: "provider_contract_rejection";
      errorKind?: string;
      error: string;
      inputRef: string;
      outputRef: string;
      rawRejectedOutput?: JsonValue;
      budgetDecision?: ProviderUsageBudgetDecision;
      intermediateInputRefs?: string[];
      intermediateOutputRefs?: string[];
    };

function deterministicActorTurn(input: {
  actorTurnInput: ActorTurnInput;
  actionCardProjection: ActionCardProjection;
  defaultPrimitive?: string;
}): ActorTurnExecutionDraft {
  const preferredPrimitive = input.defaultPrimitive ?? "observe";
  const preferredMapping = input.actionCardProjection.runtime_mappings.find((mapping) =>
    mapping.kind === "use_primitive" && mapping.primitive_id === preferredPrimitive
  );
  const fallbackMapping =
    preferredMapping ??
    input.actionCardProjection.runtime_mappings.find((mapping) => mapping.kind === "use_primitive") ??
    input.actionCardProjection.runtime_mappings[0];
  const actionCardId =
    fallbackMapping?.action_card_id ?? input.actorTurnInput.action_cards[0]?.action_card_id ?? "missing-card";
  const parameters: JsonObject = preferredPrimitive === "wait"
    ? { ticks: 20 }
    : preferredPrimitive === "remember"
      ? { note: "actor turn deterministic baseline" }
      : preferredPrimitive === "move_to"
        ? { x: 1, y: 0, z: 0 }
      : {};

  return {
    schema: "actor-turn-execution-draft/v1",
    choice: "use_existing_action",
    action_card_id: actionCardId,
    parameters,
    expected_outcome: fallbackMapping?.kind === "use_action_skill"
      ? defaultExpectedOutcomeForActionSkill(fallbackMapping.action_skill_id)
      : defaultExpectedOutcomeForPrimitive(preferredPrimitive),
    why_this_action: "Deterministic Actor Turn baseline chooses one mapped Action Card.",
    expected_evidence: ["runtime evidence"],
    fallback_if_blocked: "choose another mapped Action Card"
  };
}

async function writeFailureOutput(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  turnId: string;
  providerId: SocialCycleProviderId;
  model: string;
  snapshotId: string;
  rawText?: string;
  rawOutput?: JsonValue;
  error: string;
  errorKind?: string;
  usageRecord?: ProviderUsageRecord;
  budgetDecision?: ProviderUsageBudgetDecision;
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
    parsed_output: {
      error: input.error,
      error_kind: input.errorKind ?? null,
      budget_decision: (input.budgetDecision as unknown as JsonValue | undefined) ?? null,
      raw_provider_output: input.rawOutput ?? null
    },
    proposal: {
      error: input.error,
      error_kind: input.errorKind ?? null,
      raw_provider_output: input.rawOutput ?? null
    },
    usage: input.usageRecord
  });
}

async function writeActorTurnAttemptSnapshot(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  actorTurnInput: ActorTurnInput;
  providerId: SocialCycleProviderId;
  model: string;
  snapshotId: string;
}) {
  return writeProviderInputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-input-snapshot/v1",
    snapshot_id: input.snapshotId,
    actor_id: input.actorId,
    turn_id: input.actorTurnInput.turn_id,
    provider_id: input.providerId,
    model: input.model,
    created_at: new Date().toISOString(),
    input: input.actorTurnInput as unknown as JsonValue
  });
}

export function buildRepairActorTurnInput(input: {
  actorTurnInput: ActorTurnInput;
  rejectedOutput: ActorTurnExecutionDraft;
  errors: string[];
  rawRejectedToolCall?: JsonValue;
}): ActorTurnInput {
  const target = input.rejectedOutput.choice === "use_existing_action"
    ? `Action Card ${input.rejectedOutput.action_card_id}`
    : `generated action skill ${input.rejectedOutput.proposed_action_skill_id}`;
  const rejectedGuidance = [
    `previous ${target} failed contract validation: ${input.errors.join("; ")}`,
    "you may choose the same visible tool only if you repair the structured parameters or rationale; otherwise choose another visible tool or author_mineflayer_action"
  ];
  return {
    ...input.actorTurnInput,
    decision_frame: {
      ...input.actorTurnInput.decision_frame,
      do_not_repeat: [
        ...rejectedGuidance,
        ...input.actorTurnInput.decision_frame.do_not_repeat
      ],
      next_action_guidance: [
        `previous ${target} failed contract validation: ${input.errors.join("; ")}`,
        ...(input.rawRejectedToolCall
          ? ["previous raw function_call is preserved in runtime_retry_constraints.args_normalized.raw_rejected_function_call; use it to avoid repeating the same schema mistake"]
          : []),
        "repair must choose a visible Action Card with schema-valid parameters or author a specific Mineflayer action; no Action Card is removed merely because the previous arguments were invalid",
        ...input.actorTurnInput.decision_frame.next_action_guidance
      ]
    },
    runtime_retry_constraints: [
      {
        constraint_id:
          `actor-turn-contract-rejection-${input.actorTurnInput.turn_id}-${input.actorTurnInput.runtime_retry_constraints.length + 1}`,
        target_summary: `${target} rejected before execution`,
        args_normalized: input.rawRejectedToolCall
          ? { raw_rejected_function_call: input.rawRejectedToolCall }
          : {},
        blocked_reason: input.errors.join("; "),
        repeat_count: 1,
        evidence_refs: []
      },
      ...input.actorTurnInput.runtime_retry_constraints
    ]
  };
}

function buildMalformedOutputRepairActorTurnInput(input: {
  actorTurnInput: ActorTurnInput;
  error: string;
  rawRejectedOutput?: JsonValue;
}): ActorTurnInput {
  return {
    ...input.actorTurnInput,
    runtime_retry_constraints: [
      {
        constraint_id:
          `actor-turn-malformed-output-${input.actorTurnInput.turn_id}-${input.actorTurnInput.runtime_retry_constraints.length + 1}`,
        target_summary: "provider output rejected before Actor Turn tool selection",
        args_normalized: input.rawRejectedOutput ?? {},
        blocked_reason:
          `${input.error}. Return exactly one Actor Turn tool call: one visible Action Card function or author_mineflayer_action with schema-valid arguments.`,
        repeat_count: 1,
        evidence_refs: []
      },
      ...input.actorTurnInput.runtime_retry_constraints
    ],
    decision_frame: {
      ...input.actorTurnInput.decision_frame,
      next_action_guidance: [
        "previous provider output was malformed; return one concrete tool selection with schema-valid parameters or detailed author_mineflayer_action rationale",
        ...input.actorTurnInput.decision_frame.next_action_guidance
      ]
    }
  };
}

function isRepairableActorTurnProviderError(error: string) {
  return /\bActorTurnExecutionDraft\b|Actor Turn provider output|Actor Turn provider must return exactly one function_call|Actor Turn tool selection|function_call|function call|tool call|parameters must be an object/i
    .test(error);
}

function projectionForActorTurnInput(
  projection: ActionCardProjection,
  actorTurnInput: ActorTurnInput
): ActionCardProjection {
  const visibleIds = new Set(actorTurnInput.action_cards.map((card) => card.action_card_id));
  return {
    ...projection,
    action_cards: projection.action_cards.filter((card) => visibleIds.has(card.action_card_id)),
    runtime_mappings: projection.runtime_mappings.filter((mapping) =>
      visibleIds.has(mapping.action_card_id)
    )
  };
}

function actorTurnOutputFromExistingToolSelection(
  selection: Extract<ActorTurnToolSelection, { selection_kind: "use_existing_action" }>
): ActorTurnExecutionDraft {
  return {
    schema: "actor-turn-execution-draft/v1",
    choice: "use_existing_action",
    action_card_id: selection.action_card_id,
    parameters: selection.args.parameters,
    expected_outcome: selection.args.expected_outcome,
    why_this_action: [
      selection.args.situation_assessment,
      selection.args.why_this_tool
    ].join("\n\n"),
    expected_evidence: [...selection.args.success_evidence],
    fallback_if_blocked: selection.args.failure_handling
  };
}

function toJsonObject(value: unknown): JsonObject {
  return JSON.parse(JSON.stringify(value)) as JsonObject;
}

function actorTurnOutputFromCodegenSelection(input: {
  selection: Extract<ActorTurnToolSelection, { selection_kind: "author_mineflayer_action" }>;
  codegen: Extract<MineflayerCodegenProviderResult, { ok: true }>;
}): ActorTurnExecutionDraft {
  return {
    schema: "actor-turn-execution-draft/v1",
    choice: "author_mineflayer_action",
    proposed_action_skill_id: input.codegen.output.candidate.proposed_skill_id,
    purpose: input.codegen.output.candidate.purpose,
    input_schema: toJsonObject(input.codegen.output.candidate.input_schema),
    parameters: input.codegen.output.runtime_parameters,
    source_language: input.codegen.output.candidate.source_language,
    source: input.codegen.output.candidate.source,
    helper_api_version: input.codegen.output.candidate.helper_api_version,
    helper_allowlist: [...input.codegen.output.candidate.helper_allowlist],
    timeout_ms: input.codegen.output.candidate.timeout_ms,
    verifier: toJsonObject(input.codegen.output.candidate.verifier),
    known_failure_modes: [...input.codegen.output.candidate.known_failure_modes],
    promotion_policy: input.codegen.output.candidate.promotion_policy,
    expected_outcome: input.selection.args.expected_outcome,
    why_this_action: [
      input.selection.args.situation_assessment,
      input.selection.args.why_codegen_is_needed,
      input.selection.args.desired_minecraft_behavior,
      input.codegen.output.codegen_rationale
    ].join("\n\n"),
    expected_evidence: [...input.selection.args.success_evidence],
    fallback_if_blocked: input.selection.args.failure_handling
  };
}

function actorTurnArtifactOutput(output: ActorTurnExecutionDraft): JsonValue {
  if (output.choice !== "author_mineflayer_action") {
    return output as unknown as JsonValue;
  }
  const { source: _source, ...sourceFree } = output;
  return {
    ...sourceFree,
    source_omitted: true,
    source_boundary:
      "Generated TypeScript source is stored only in mineflayer-codegen artifacts and actor-owned action-skill candidate evidence."
  } as unknown as JsonValue;
}

function providerParsedOutputForAttempt(attempt: Extract<ActorTurnProviderAttempt, { ok: true }>): JsonValue {
  if (!attempt.toolSelection) {
    return attempt.actorTurn as unknown as JsonValue;
  }
  return {
    schema: "actor-turn-tool-selection-result/v1",
    actor_turn_tool_selection: attempt.toolSelection as unknown as JsonValue,
    actor_turn_tool_selection_ref: attempt.toolSelectionRef ?? null,
    raw_provider_output: attempt.rawProviderOutput ?? null,
    actor_turn_output: actorTurnArtifactOutput(attempt.actorTurn),
    ...(attempt.codegen
      ? {
          mineflayer_codegen_request_ref: attempt.codegen.requestRef,
          mineflayer_codegen_output_ref: attempt.codegen.outputRef
        }
      : {})
  } as unknown as JsonValue;
}

async function writeToolSelectionArtifact(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  turnId: string;
  selection: ActorTurnToolSelection;
}) {
  const { ref } = await writeActorGoalArtifact(
    input.actorWorkspaceRootDir,
    input.actorId,
    path.join("goals", "cycle", "tool-selections"),
    `${input.turnId}-tool-selection`,
    input.selection
  );
  return ref;
}

async function requestLlmActorTurnToolSelection(input: {
  providerId: Extract<SocialCycleProviderId, "openai-api" | "gemini-api" | "modelscope-api">;
  actorWorkspaceRootDir: string;
  actorId: string;
  actorTurnInput: ActorTurnInput;
  actionCardProjection: ActionCardProjection;
  openAi?: OpenAiJsonProviderConfig;
  gemini?: GeminiJsonProviderConfig;
  modelScope?: ModelScopeApiProviderConfig;
  runId?: string;
  snapshotId: string;
  inputRef: string;
}): Promise<ActorTurnProviderAttempt> {
  const payload = buildActorTurnToolSelectionPayload({
    actorTurnInput: input.actorTurnInput,
    actionCardProjection: input.actionCardProjection,
    runId: input.runId
  });
  const result = input.providerId === "openai-api"
    ? await callOpenAiFunctionToolSelection({
        config: input.openAi!,
        system: payload.system,
        user: payload.user,
        tools: payload.tools,
        usageContext: payload.usageContext
      })
    : input.providerId === "modelscope-api"
      ? await callModelScopeFunctionToolSelection({
          config: input.modelScope!,
          system: payload.system,
          user: payload.user,
          tools: payload.tools,
          usageContext: payload.usageContext
        })
    : await callGeminiFunctionToolSelection({
        config: input.gemini!,
        system: payload.system,
        user: payload.user,
        tools: payload.tools,
        usageContext: payload.usageContext
      });
  const rawText = result.rawText ?? "";
  if (!result.ok) {
    const outputRef = await writeFailureOutput({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      turnId: input.actorTurnInput.turn_id,
      providerId: input.providerId,
      model: result.model,
      snapshotId: input.snapshotId,
      rawText,
      error: result.message,
      errorKind: result.errorKind,
      usageRecord: result.usageRecord,
      rawOutput: result.rawOutput,
      budgetDecision: result.budgetDecision
    });
    return {
      ok: false,
      errorKind: result.errorKind,
      error: result.message,
      inputRef: input.inputRef,
      outputRef,
      rawRejectedOutput: result.rawOutput,
      budgetDecision: result.budgetDecision
    };
  }

  const parsed = parseActorTurnToolSelection({
    functionCalls: result.functionCalls,
    actionCardToolMappings: payload.actionCardToolMappings
  });
  if (!parsed.ok) {
    const error = parsed.errors.join("; ");
    const outputRef = await writeFailureOutput({
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      turnId: input.actorTurnInput.turn_id,
      providerId: input.providerId,
      model: result.model,
      snapshotId: input.snapshotId,
      rawText,
      error,
      errorKind: "tool_selection_parse_error",
      usageRecord: result.usageRecord,
      rawOutput: result.rawOutput,
      budgetDecision: result.budgetDecision
    });
    return {
      ok: false,
      errorKind: "tool_selection_parse_error",
      error,
      inputRef: input.inputRef,
      outputRef,
      rawRejectedOutput: result.rawOutput,
      budgetDecision: result.budgetDecision
    };
  }

  const toolSelectionRef = await writeToolSelectionArtifact({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    turnId: input.actorTurnInput.turn_id,
    selection: parsed.selection
  });

  if (parsed.selection.selection_kind === "use_existing_action") {
    return {
      ok: true,
      actorTurn: actorTurnOutputFromExistingToolSelection(parsed.selection),
      inputRef: input.inputRef,
      snapshotId: input.snapshotId,
      model: result.model,
      rawText,
      rawProviderOutput: result.rawOutput,
      usageRecord: result.usageRecord,
      toolSelection: parsed.selection,
      toolSelectionRef
    };
  }

  const codegen = await runMineflayerCodegenProvider({
    providerId: input.providerId,
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    actorTurnInput: input.actorTurnInput,
    rawOuterToolCall: parsed.selection.raw_tool_call,
    parsedAuthorToolArgs: parsed.selection.args,
    openAi: input.openAi,
    gemini: input.gemini,
    modelScope: input.modelScope,
    runId: input.runId,
    snapshotId: `${input.snapshotId}-mineflayer-codegen`
  });
  if (!codegen.ok) {
    const outerOutputRef = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `${input.snapshotId}-outer-tool-selection-out`,
      actor_id: input.actorId,
      turn_id: input.actorTurnInput.turn_id,
      provider_id: input.providerId,
      model: result.model,
      created_at: new Date().toISOString(),
      raw_output_text: rawText,
      parsed_output: {
        schema: "actor-turn-tool-selection-result/v1",
        actor_turn_tool_selection: parsed.selection as unknown as JsonValue,
        actor_turn_tool_selection_ref: toolSelectionRef,
        raw_provider_output: result.rawOutput ?? null,
        mineflayer_codegen_failed: true,
        mineflayer_codegen_output_ref: codegen.outputRef
      },
	      proposal: {
	        actor_turn_tool_selection: parsed.selection as unknown as JsonValue,
	        actor_turn_tool_selection_ref: toolSelectionRef,
	        mineflayer_codegen_failed: true,
	        mineflayer_codegen_output_ref: codegen.outputRef
	      },
      usage: result.usageRecord
    });
    return {
      ok: false,
      failureKind: "provider_contract_rejection",
      errorKind: "mineflayer_codegen_contract_rejection",
      error: codegen.error,
      inputRef: input.inputRef,
      outputRef: codegen.outputRef,
      intermediateInputRefs: [
        ...(codegen.intermediateInputRefs ?? []),
        codegen.inputRef
      ],
      intermediateOutputRefs: [
        outerOutputRef,
        ...(codegen.intermediateOutputRefs ?? []),
        codegen.outputRef
      ]
    };
  }
  return {
    ok: true,
    actorTurn: actorTurnOutputFromCodegenSelection({
      selection: parsed.selection,
      codegen
    }),
    inputRef: input.inputRef,
    snapshotId: input.snapshotId,
    model: result.model,
    rawText,
    rawProviderOutput: result.rawOutput,
    usageRecord: result.usageRecord,
    toolSelection: parsed.selection,
    toolSelectionRef,
    codegen,
    intermediateInputRefs: [
      ...(codegen.intermediateInputRefs ?? []),
      codegen.inputRef
    ],
    intermediateOutputRefs: [
      ...(codegen.intermediateOutputRefs ?? []),
      codegen.outputRef
    ]
  };
}

async function requestActorTurn(input: {
  providerId: SocialCycleProviderId;
  actorWorkspaceRootDir: string;
  actorId: string;
  actorTurnInput: ActorTurnInput;
  actionCardProjection: ActionCardProjection;
  openAi?: OpenAiJsonProviderConfig;
  gemini?: GeminiJsonProviderConfig;
  modelScope?: ModelScopeApiProviderConfig;
  defaultPrimitive?: string;
  runId?: string;
  snapshotId: string;
  model: string;
}): Promise<ActorTurnProviderAttempt> {
  const inputPath = await writeActorTurnAttemptSnapshot({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    actorId: input.actorId,
    actorTurnInput: input.actorTurnInput,
    providerId: input.providerId,
    model: input.model,
    snapshotId: input.snapshotId
  });

  if (input.providerId === "deterministic-social") {
    const actorTurn = deterministicActorTurn({
      actorTurnInput: input.actorTurnInput,
      actionCardProjection: input.actionCardProjection,
      defaultPrimitive: input.defaultPrimitive
    });
    return {
      ok: true,
      actorTurn,
      inputRef: inputPath,
      snapshotId: input.snapshotId,
      model: input.model,
      rawText: JSON.stringify({ actor_turn: actorTurn })
    };
  }

  if (
    input.providerId === "openai-api" ||
    input.providerId === "gemini-api" ||
    input.providerId === "modelscope-api"
  ) {
    return requestLlmActorTurnToolSelection({
      providerId: input.providerId,
      actorWorkspaceRootDir: input.actorWorkspaceRootDir,
      actorId: input.actorId,
      actorTurnInput: input.actorTurnInput,
      actionCardProjection: input.actionCardProjection,
      openAi: input.openAi,
      gemini: input.gemini,
      modelScope: input.modelScope,
      runId: input.runId,
      snapshotId: input.snapshotId,
      inputRef: inputPath
    });
  }

  const unsupportedProvider: never = input.providerId;
  throw new Error(`Unsupported Actor Turn provider: ${unsupportedProvider}`);
}

export async function runSocialActorTurnProvider(input: {
  providerId: SocialCycleProviderId;
  actorWorkspaceRootDir: string;
  actorId: string;
  cycleId: string;
  cycleGoalId: string;
  actorTurnInput: ActorTurnInput;
  actionCardProjection: ActionCardProjection;
  openAi?: OpenAiJsonProviderConfig;
  gemini?: GeminiJsonProviderConfig;
  modelScope?: ModelScopeApiProviderConfig;
  defaultPrimitive?: string;
  runId?: string;
}): Promise<ActorTurnProviderResult> {
  const snapshotId = `actor-turn-${input.actorTurnInput.turn_id}-${randomUUID()}`;
  const model = input.openAi?.model ?? input.gemini?.model ?? input.modelScope?.model ?? "deterministic-social";
  let actorTurnInput = input.actorTurnInput;
  let actionCardProjection = projectionForActorTurnInput(input.actionCardProjection, actorTurnInput);
  const intermediateInputRefs: string[] = [];
  const intermediateOutputRefs: string[] = [];
  let attempt = await requestActorTurn({
    ...input,
    actorTurnInput,
    actionCardProjection,
    snapshotId,
    model
  });
  if (!attempt.ok) {
    if (!isRepairableActorTurnProviderError(attempt.error)) {
      return attempt;
    }
    intermediateInputRefs.push(attempt.inputRef, ...(attempt.intermediateInputRefs ?? []));
    intermediateOutputRefs.push(attempt.outputRef, ...(attempt.intermediateOutputRefs ?? []));
    actorTurnInput = buildMalformedOutputRepairActorTurnInput({
      actorTurnInput,
      error: attempt.error,
      rawRejectedOutput: attempt.rawRejectedOutput
    });
    actionCardProjection = projectionForActorTurnInput(input.actionCardProjection, actorTurnInput);
    attempt = await requestActorTurn({
      ...input,
      actorTurnInput,
      actionCardProjection,
      snapshotId: `${snapshotId}-malformed-repair-1`,
      model
    });
    if (!attempt.ok) {
      return {
        ...attempt,
        intermediateInputRefs: [
          ...intermediateInputRefs,
          ...(attempt.intermediateInputRefs ?? [])
        ],
        intermediateOutputRefs: [
          ...intermediateOutputRefs,
          ...(attempt.intermediateOutputRefs ?? [])
        ]
      };
    }
  }

  let resolution = resolveActorTurnExecutionDraftToAction({
    actorId: input.actorId,
    cycleId: input.cycleId,
    cycleGoalId: input.cycleGoalId,
    output: attempt.actorTurn,
    actionCardProjection,
    currentState: actorTurnInput.current_state
  });
  if (!resolution.ok) {
    const rejectionRef = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
      schema: "provider-output-snapshot/v1",
      snapshot_id: `${attempt.snapshotId}-out`,
      actor_id: input.actorId,
      turn_id: actorTurnInput.turn_id,
      provider_id: input.providerId,
      model: attempt.model,
      created_at: new Date().toISOString(),
      raw_output_text: attempt.rawText,
      parsed_output: providerParsedOutputForAttempt(attempt),
      proposal: {
        actor_turn_output: actorTurnArtifactOutput(attempt.actorTurn),
        ...(attempt.toolSelection
	          ? {
	              actor_turn_tool_selection: attempt.toolSelection as unknown as JsonValue,
	              actor_turn_tool_selection_ref: attempt.toolSelectionRef ?? null
	            }
          : {}),
        ...(attempt.codegen
          ? {
              mineflayer_codegen_request_ref: attempt.codegen.requestRef,
              mineflayer_codegen_output_ref: attempt.codegen.outputRef
            }
          : {}),
        action_ref: null,
        resolution_errors: resolution.errors,
        repair_requested: true
      },
      usage: attempt.usageRecord
    });
    intermediateOutputRefs.push(rejectionRef);
    actorTurnInput = buildRepairActorTurnInput({
      actorTurnInput,
      rejectedOutput: attempt.actorTurn,
      errors: resolution.errors,
      rawRejectedToolCall: attempt.toolSelection?.raw_tool_call
    });
    actionCardProjection = projectionForActorTurnInput(input.actionCardProjection, actorTurnInput);
    attempt = await requestActorTurn({
      ...input,
      actorTurnInput,
      actionCardProjection,
      snapshotId: `${snapshotId}-repair-1`,
      model
    });
    if (!attempt.ok) {
      return {
        ...attempt,
        intermediateInputRefs: [
          ...intermediateInputRefs,
          ...(attempt.intermediateInputRefs ?? [])
        ],
        intermediateOutputRefs: [
          ...intermediateOutputRefs,
          ...(attempt.intermediateOutputRefs ?? [])
        ]
      };
    }
    resolution = resolveActorTurnExecutionDraftToAction({
      actorId: input.actorId,
      cycleId: input.cycleId,
      cycleGoalId: input.cycleGoalId,
      output: attempt.actorTurn,
      actionCardProjection,
      currentState: actorTurnInput.current_state
    });
    if (!resolution.ok) {
      const error = resolution.errors.join("; ");
      const outputRef = await writeFailureOutput({
        actorWorkspaceRootDir: input.actorWorkspaceRootDir,
        actorId: input.actorId,
        turnId: actorTurnInput.turn_id,
        providerId: input.providerId,
        model: attempt.model,
        snapshotId: attempt.snapshotId,
        rawText: attempt.rawText,
        error: `${error}; previous_contract_rejection_ref=${rejectionRef}`,
        errorKind: "actor_turn_resolution_error",
        usageRecord: attempt.usageRecord,
        rawOutput: attempt.rawProviderOutput
      });
      return {
        ok: false,
        failureKind: "provider_contract_rejection",
        errorKind: "actor_turn_resolution_error",
        error,
        inputRef: attempt.inputRef,
        outputRef,
        rawRejectedOutput: attempt.actorTurn as unknown as JsonValue,
        intermediateInputRefs: [
          ...intermediateInputRefs,
          ...(attempt.intermediateInputRefs ?? [])
        ],
        intermediateOutputRefs: [
          ...intermediateOutputRefs,
          ...(attempt.intermediateOutputRefs ?? [])
        ]
      };
    }
  }

  const actionArtifact = attempt.toolSelection
    ? {
        ...resolution.action,
        actor_turn_tool_selection_ref: attempt.toolSelectionRef,
        ...(attempt.codegen
          ? {
              mineflayer_codegen_request_ref: attempt.codegen.requestRef,
              mineflayer_codegen_output_ref: attempt.codegen.outputRef
            }
          : {})
      }
    : resolution.action;
  const { ref: actionRef } = await writeActorGoalArtifact(
    input.actorWorkspaceRootDir,
    input.actorId,
	    path.join("goals", "cycle", "actions"),
	    `${actorTurnInput.turn_id}-action`,
	    actionArtifact
	  );

  const outputRef = await writeProviderOutputSnapshot(input.actorWorkspaceRootDir, {
    schema: "provider-output-snapshot/v1",
    snapshot_id: `${attempt.snapshotId}-out`,
    actor_id: input.actorId,
    turn_id: actorTurnInput.turn_id,
    provider_id: input.providerId,
    model: attempt.model,
    created_at: new Date().toISOString(),
    raw_output_text: attempt.rawText,
    parsed_output: providerParsedOutputForAttempt(attempt),
    proposal: {
      actor_turn_output: actorTurnArtifactOutput(attempt.actorTurn),
      ...(attempt.toolSelection
	          ? {
	            actor_turn_tool_selection: attempt.toolSelection as unknown as JsonValue,
	            actor_turn_tool_selection_ref: attempt.toolSelectionRef ?? null
	          }
        : {}),
      ...(attempt.codegen
        ? {
            mineflayer_codegen_request_ref: attempt.codegen.requestRef,
            mineflayer_codegen_output_ref: attempt.codegen.outputRef
          }
        : {}),
      action_ref: actionRef
    },
    usage: attempt.usageRecord
  });

  return {
    ok: true,
    actorTurn: attempt.actorTurn,
    action: resolution.action,
    actionRef,
    inputRef: attempt.inputRef,
    outputRef,
    intermediateInputRefs: [
      ...intermediateInputRefs,
      ...(attempt.intermediateInputRefs ?? [])
    ],
    intermediateOutputRefs: [
      ...intermediateOutputRefs,
      ...(attempt.intermediateOutputRefs ?? [])
    ]
  };
}
