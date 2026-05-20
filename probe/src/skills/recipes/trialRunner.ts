import type { ToolResult } from "../../mutual/types.js";
import { runAction } from "../../runtime/actions/actionRunner.js";
import type { ActionSkillProposalRecord } from "../proposals/types.js";
import type { ActionSkillRecipe, ActionSkillRecipeStep } from "./types.js";
import {
  recordActionSkillTrial,
  type ActionSkillTrialResult
} from "../lifecycle/promotion.js";

export type RecipeTrialStepResult = {
  primitive: string;
  status: "completed" | "timeout" | "failed";
  result: ToolResult;
};

export type RunBoundedActionSkillRecipeTrialInput = {
  actorWorkspaceRootDir: string;
  proposal: ActionSkillProposalRecord;
  recipe: ActionSkillRecipe;
  executePrimitive: (
    step: ActionSkillRecipeStep,
    signal: AbortSignal
  ) => Promise<ToolResult> | ToolResult;
  verifyTrial: (steps: readonly RecipeTrialStepResult[]) => ActionSkillTrialResult;
  created_at?: string;
};

function failedToolResult(step: ActionSkillRecipeStep, message: string): ToolResult {
  return {
    tool: step.primitive,
    ok: false,
    status: "failed",
    message
  };
}

export async function runBoundedActionSkillRecipeTrial(
  input: RunBoundedActionSkillRecipeTrialInput
) {
  const stepResults: RecipeTrialStepResult[] = [];

  for (const step of input.recipe.steps) {
    const actionResult = await runAction({
      tool: step.primitive,
      timeoutMs: step.timeout_ms,
      action: (signal) => input.executePrimitive(step, signal)
    });
    const result =
      actionResult.value && typeof actionResult.value === "object"
        ? (actionResult.value as ToolResult)
        : failedToolResult(step, actionResult.message ?? "recipe step returned no result");
    const status =
      actionResult.status === "completed"
        ? "completed"
        : actionResult.status === "timeout"
          ? "timeout"
          : "failed";

    stepResults.push({
      primitive: step.primitive,
      status,
      result
    });

    if (status !== "completed" || result.ok === false) {
      break;
    }
  }

  const trial = input.verifyTrial(stepResults);
  const trialEvidencePath = await recordActionSkillTrial({
    actorWorkspaceRootDir: input.actorWorkspaceRootDir,
    proposal: input.proposal,
    recipe: input.recipe,
    trial,
    created_at: input.created_at
  });

  return {
    status: trial.status,
    stepResults,
    trialEvidencePath
  };
}
