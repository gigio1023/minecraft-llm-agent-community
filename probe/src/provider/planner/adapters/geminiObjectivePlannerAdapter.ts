/**
 * Adapter that routes direct objective planning through Gemini Live.
 *
 * @remarks This provider path is experimental and must remain isolated from the
 * default social-cycle action-selection contract.
 */
import { callGeminiLivePlanner } from "../../gemini/geminiLivePlanner.js";
import { stripGeneratedSourceFence } from "../stripGeneratedSource.js";
import type {
  DirectGeneratedSourcePlan,
  ObjectivePhasePlannerPort,
  ObjectivePhasePlannerRequest,
  ObjectivePlannerPathId
} from "../types.js";

export class GeminiObjectivePlannerAdapter implements ObjectivePhasePlannerPort {
  readonly plannerId = "gemini-planner" as const;

  constructor(private readonly forcePath?: ObjectivePlannerPathId) {}

  async planPhaseSource(request: ObjectivePhasePlannerRequest): Promise<DirectGeneratedSourcePlan> {
    const result = await callGeminiLivePlanner({
      actorId: request.actorId,
      turnId: request.turnId,
      actorWorkspaceRootDir: request.actorWorkspaceRootDir,
      prompt: request.prompt,
      repoRoot: request.repoRoot,
      forcePath: this.forcePath
    });

    if (result.errorKind || !result.text.trim()) {
      return {
        sourceKind: "llm-generated-ts",
        source: "",
        plannerId: this.plannerId,
        model: result.model,
        providerInputRef: result.inputRef,
        providerOutputRef: result.outputRef,
        selectedPath: result.selectedPath,
        attemptedPaths: result.attemptedPaths,
        fallbackReason: result.errorKind
          ? `gemini planner blocked: ${result.errorKind}`
          : "gemini planner returned empty source",
        errorKind: result.errorKind
      };
    }

    return {
      sourceKind: "llm-generated-ts",
      source: stripGeneratedSourceFence(result.text),
      plannerId: this.plannerId,
      model: result.model,
      providerInputRef: result.inputRef,
      providerOutputRef: result.outputRef,
      selectedPath: result.selectedPath,
      attemptedPaths: result.attemptedPaths,
      fallbackReason: result.fallbackReason
    };
  }
}
