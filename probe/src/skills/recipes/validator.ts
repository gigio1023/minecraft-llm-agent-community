import { runtimePrimitiveIds } from "../../gameplay/primitives/registry.js";
import { canRoleUseTool } from "../../npc/roles/contracts.js";
import type {
  ActionSkillRecipe,
  ActionSkillRecipeValidationContext,
  ActionSkillRecipeValidationResult
} from "./types.js";

const verifierEvidenceKinds = new Set([
  "inventory_delta",
  "block_delta",
  "position_delta",
  "container_delta"
]);

function hasPositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function validateActionSkillRecipe(
  recipe: ActionSkillRecipe,
  context: ActionSkillRecipeValidationContext
): ActionSkillRecipeValidationResult {
  const errors: string[] = [];
  const knownPrimitives = new Set<string>(runtimePrimitiveIds);

  if (!recipe.recipe_id) {
    errors.push("recipe_id is required");
  }

  if (!recipe.skill_id) {
    errors.push("skill_id is required");
  }

  if (!recipe.owner_actor_id) {
    errors.push("owner_actor_id is required");
  }

  if (!hasPositiveInteger(recipe.max_duration_ms)) {
    errors.push("max_duration_ms must be a positive integer");
  }

  if (
    context.activeSkillIds.includes(recipe.skill_id) &&
    !recipe.supersession_note
  ) {
    errors.push(
      `recipe ${recipe.recipe_id} duplicates active action skill ${recipe.skill_id} without a supersession note`
    );
  }

  recipe.steps.forEach((step, index) => {
    if (!knownPrimitives.has(step.primitive)) {
      errors.push(`Unknown runtime primitive: ${step.primitive}`);
      return;
    }

    if (!canRoleUseTool(context.actorRole, step.primitive)) {
      errors.push(`Role ${context.actorRole} cannot use primitive ${step.primitive}`);
    }

    if (!hasPositiveInteger(step.timeout_ms)) {
      errors.push(`step ${index} must include a positive timeout_ms`);
    }

    if (!Array.isArray(step.expected_evidence) || step.expected_evidence.length === 0) {
      errors.push(`step ${index} must name expected runtime evidence`);
    }
  });

  const totalStepBudget = recipe.steps.reduce((sum, step) => sum + Math.max(step.timeout_ms, 0), 0);
  if (hasPositiveInteger(recipe.max_duration_ms) && totalStepBudget > recipe.max_duration_ms) {
    errors.push(
      `step timeout budget ${totalStepBudget} exceeds max_duration_ms ${recipe.max_duration_ms}`
    );
  }

  const verifierKind = recipe.verifier?.kind as string | undefined;
  if (!verifierKind) {
    errors.push("verifier is required");
  } else if (!verifierEvidenceKinds.has(verifierKind)) {
    errors.push(`verifier kind ${verifierKind} cannot prove Minecraft progress`);
  }

  if (!recipe.verifier?.target) {
    errors.push("verifier target is required");
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
