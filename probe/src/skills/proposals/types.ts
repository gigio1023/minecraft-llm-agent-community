/**
 * Data contracts for proposed actor-owned action skills.
 *
 * @remarks These records preserve why a behavior was proposed, but source and
 * parameters still need schema validation, bounded trial, and promotion.
 */
import type { ActorActionSkillSourceKind } from "../../runtime/actorWorkspaceStore.js";
import type { GeneratedActionSkillCandidate } from "../../runtime/goals/types.js";
import type { GeneratedActionSkillLifecycleStatus } from "../generated/authoringSchemas.js";

export type ActionSkillProposalRecord = {
  schema: "action-skill-proposal/v1";
  proposal_id: string;
  skill_id: string;
  owner_actor_id: string;
  source_kind: ActorActionSkillSourceKind;
  status: "draft";
  task_intent: string;
  evidence_refs: string[];
  preconditions: string[];
  required_primitives: string[];
  proposed_recipe_id: string;
  success_verifier: string;
  known_failure_modes: string[];
  created_at: string;
  updated_at: string;
  generated_source?: string;
  generated_source_language?: "typescript";
  generated_candidate?: GeneratedActionSkillCandidate;
  generated_parameters?: Record<string, unknown>;
  generated_lifecycle_status?: GeneratedActionSkillLifecycleStatus;
  generated_trial?: {
    schema: "generated-action-skill-trial/v1";
    status: GeneratedActionSkillLifecycleStatus;
    verifier_status: "passed" | "failed" | "not_applicable";
    evidence_refs: string[];
    source_ref?: string;
    helper_events?: unknown[];
    verifier_output?: unknown;
    reason: string;
  };
  notes?: string;
};
