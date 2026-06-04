import {
  validateGeneratedActionSkillCandidate,
  validateJsonObjectAgainstSimpleSchema
} from "../../../skills/generated/authoringSchemas.js";
import { validatePrimitiveActionParameters } from "../actionParameterContracts.js";
import {
  resolveActionCardMapping,
  type ActionCardProjection,
  type ActionCardRuntimeMapping
} from "./actionCards.js";
import type {
  ActorTurnCurrentStateProjection,
  ActorTurnExecutionDraft,
  ActorTurnResolvedAction,
  GeneratedActionSkillCandidate,
  JsonObject
} from "./types.js";
import { validateActorTurnExecutionDraft } from "./validators.js";

export type ActorTurnResolutionInput = {
  actorId: string;
  cycleId: string;
  cycleGoalId: string;
  output: ActorTurnExecutionDraft;
  actionCardProjection: ActionCardProjection;
  currentState?: ActorTurnCurrentStateProjection;
};

export type ActorTurnResolutionResult =
  | {
      ok: true;
      action: ActorTurnResolvedAction;
    }
  | {
      ok: false;
      errors: string[];
    };

function generatedCandidateFromOutput(
  output: Extract<ActorTurnExecutionDraft, { choice: "author_mineflayer_action" }>
): GeneratedActionSkillCandidate {
  return {
    schema: "generated-action-skill-candidate/v1",
    proposed_skill_id: output.proposed_action_skill_id,
    purpose: output.purpose,
    source_language: output.source_language,
    source: output.source,
    input_schema: output.input_schema,
    helper_api_version: output.helper_api_version,
    helper_allowlist: [...output.helper_allowlist],
    timeout_ms: output.timeout_ms,
    verifier: output.verifier,
    promotion_policy: output.promotion_policy,
    known_failure_modes: [...output.known_failure_modes]
  };
}

function actionSkillParameterSchemaErrors(input: {
  mapping: ActionCardRuntimeMapping;
  parameters: JsonObject;
}) {
  if (input.mapping.kind !== "use_action_skill" || !input.mapping.input_schema) {
    return [];
  }
  const result = validateJsonObjectAgainstSimpleSchema({
    schema: input.mapping.input_schema,
    parameters: input.parameters
  });
  return result.ok ? [] : result.errors;
}

function validateResolvedActorTurnAction(action: ActorTurnResolvedAction): ActorTurnResolutionResult {
  if (action.kind === "use_primitive") {
    const primitiveArgs = validatePrimitiveActionParameters({
      primitiveId: action.primitive_id,
      args: action.parameters
    });
    if (!primitiveArgs.ok) {
      return { ok: false, errors: [primitiveArgs.error] };
    }
  }

  if (action.kind === "author_mineflayer_action") {
    const candidateResult = validateGeneratedActionSkillCandidate(action.candidate);
    if (!candidateResult.ok) {
      return { ok: false, errors: candidateResult.errors };
    }
    const schemaResult = validateJsonObjectAgainstSimpleSchema({
      schema: candidateResult.candidate.input_schema,
      parameters: action.parameters
    });
    if (!schemaResult.ok) {
      return { ok: false, errors: schemaResult.errors };
    }
  }

  return { ok: true, action };
}

/**
 * Resolves one Actor Turn provider output into executable runtime authority.
 *
 * @remarks This resolver is intentionally not a Minecraft planner. It does not
 * parse Action Card prose, inspect `current_state_requirements`, hide available
 * tools, infer recipe feasibility, or inject coordinates. Those patterns erase
 * the LLM's decision context behind ad hoc string logic. Executable authority
 * comes from the selected function tool, explicit structured parameters, and
 * schema/primitive/generated-source validation.
 */
export function resolveActorTurnExecutionDraftToAction(
  input: ActorTurnResolutionInput
): ActorTurnResolutionResult {
  const outputValidation = validateActorTurnExecutionDraft(input.output);
  if (!outputValidation.ok) {
    return { ok: false, errors: outputValidation.errors };
  }
  const output = outputValidation.output;

  if (output.choice === "use_existing_action") {
    const mapping = resolveActionCardMapping(input.actionCardProjection, output.action_card_id);
    if (!mapping) {
      return {
        ok: false,
        errors: [`No runtime mapping found for Action Card ${output.action_card_id}`]
      };
    }

    const card = input.actionCardProjection.action_cards.find((entry) =>
      entry.action_card_id === output.action_card_id
    );
    if (!card) {
      return {
        ok: false,
        errors: [`No Action Card found for ${output.action_card_id}`]
      };
    }

    const actionSkillSchemaErrors = actionSkillParameterSchemaErrors({
      mapping,
      parameters: output.parameters
    });
    if (actionSkillSchemaErrors.length > 0) {
      return { ok: false, errors: actionSkillSchemaErrors };
    }

    const action: ActorTurnResolvedAction = mapping.kind === "use_primitive"
      ? {
          schema: "actor-turn-resolved-action/v1",
          actor_id: input.actorId,
          cycle_id: input.cycleId,
          cycle_goal_id: input.cycleGoalId,
          kind: "use_primitive",
          action_card_id: output.action_card_id,
          primitive_id: mapping.primitive_id,
          parameters: output.parameters,
          why_this_action: output.why_this_action,
          expected_evidence: [...output.expected_evidence],
          fallback_if_blocked: output.fallback_if_blocked
        }
      : {
          schema: "actor-turn-resolved-action/v1",
          actor_id: input.actorId,
          cycle_id: input.cycleId,
          cycle_goal_id: input.cycleGoalId,
          kind: "use_action_skill",
          action_card_id: output.action_card_id,
          action_skill_id: mapping.action_skill_id,
          parameters: output.parameters,
          why_this_action: output.why_this_action,
          expected_evidence: [...output.expected_evidence],
          fallback_if_blocked: output.fallback_if_blocked
        };
    return validateResolvedActorTurnAction(action);
  }

  if (output.promotion_policy !== "promote_after_passed_trial") {
    return {
      ok: false,
      errors: [
        "author_mineflayer_action must use promotion_policy promote_after_passed_trial to become an executable Actor Turn action"
      ]
    };
  }

  const action: ActorTurnResolvedAction = {
    schema: "actor-turn-resolved-action/v1",
    actor_id: input.actorId,
    cycle_id: input.cycleId,
    cycle_goal_id: input.cycleGoalId,
    kind: "author_mineflayer_action",
    parameters: output.parameters,
    candidate: generatedCandidateFromOutput(output),
    why_this_action: output.why_this_action,
    expected_evidence: [...output.expected_evidence],
    fallback_if_blocked: output.fallback_if_blocked
  };
  return validateResolvedActorTurnAction(action);
}
