/**
 * Recipe contract for bounded action skill trials.
 *
 * @remarks A recipe describes guarded primitive steps and verifier expectations;
 * it is not active actor-owned authority until lifecycle promotion writes an
 * active record.
 */
import type { RoleId } from "../../npc/roles/contracts.js";
import type { RuntimePrimitiveId } from "../../gameplay/primitives/registry.js";

export type ActionSkillRecipeVerifierKind =
  | "inventory_delta"
  | "block_delta"
  | "position_delta"
  | "container_delta";

export type ActionSkillRecipeStep = {
  primitive: RuntimePrimitiveId;
  args: Record<string, unknown>;
  guard?: string;
  timeout_ms: number;
  expected_evidence: string[];
};

export type ActionSkillRecipe = {
  recipe_id: string;
  skill_id: string;
  owner_actor_id: string;
  max_duration_ms: number;
  steps: ActionSkillRecipeStep[];
  verifier: {
    kind: ActionSkillRecipeVerifierKind;
    target: string;
    minimum_delta?: number;
  };
  supersession_note?: string;
};

export type ActionSkillRecipeValidationContext = {
  actorRole: RoleId;
  activeSkillIds: readonly string[];
};

export type ActionSkillRecipeValidationResult = {
  ok: boolean;
  errors: string[];
};
