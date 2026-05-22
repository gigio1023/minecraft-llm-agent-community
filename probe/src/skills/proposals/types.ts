import type { ActorActionSkillSourceKind } from "../../runtime/actorWorkspaceStore.js";

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
  legacy_generated_code?: string;
  legacy_generated_code_language?: "typescript";
  notes?: string;
};
