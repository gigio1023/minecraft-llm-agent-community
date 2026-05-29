import type { ProbeConfig } from "../../config.js";
import { BuiltinPhasePlannerAdapter } from "./adapters/builtinPhasePlannerAdapter.js";
import { GeminiObjectivePlannerAdapter } from "./adapters/geminiObjectivePlannerAdapter.js";
import { OpenAICodexPlannerAdapter } from "./adapters/openaiCodexPlannerAdapter.js";
import { normalizeObjectivePhasePlannerId } from "./normalizeObjectivePhasePlannerId.js";
import type {
  ObjectivePhasePlannerPort,
  ObjectivePlannerPathId
} from "./types.js";

export { normalizeObjectivePhasePlannerId } from "./normalizeObjectivePhasePlannerId.js";

export function createObjectivePhasePlanner(input: {
  plannerId?: string;
  config: ProbeConfig;
  forceGeminiPath?: ObjectivePlannerPathId;
}): ObjectivePhasePlannerPort {
  const plannerId = normalizeObjectivePhasePlannerId(input.plannerId);

  switch (plannerId) {
    case "builtin-planner":
      return new BuiltinPhasePlannerAdapter();
    case "openai-codex-planner":
      return new OpenAICodexPlannerAdapter(input.config);
    case "gemini-planner":
      return new GeminiObjectivePlannerAdapter(input.forceGeminiPath);
  }
}
