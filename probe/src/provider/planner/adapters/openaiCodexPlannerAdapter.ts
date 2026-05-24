import path from "node:path";

import type { ProbeConfig } from "../../../config.js";
import { loadOpenAICodexAuth } from "../../../mutual/openaiCodexAuth.js";
import { getActorWorkspacePaths, sanitizeWorkspaceFileId } from "../../../runtime/actorWorkspacePaths.js";
import { writeJson } from "../../../runtime/actorWorkspaceStore.js";
import { writeProviderInputSnapshot } from "../../providerInputStore.js";
import { writeProviderOutputSnapshot } from "../../providerOutputStore.js";
import type { JsonValue } from "../../inputSnapshot.js";
import { stripGeneratedSourceFence } from "../stripGeneratedSource.js";
import type {
  DirectGeneratedSourcePlan,
  ObjectivePhasePlannerPort,
  ObjectivePhasePlannerRequest
} from "../types.js";

const sourceEndpoint = "https://chatgpt.com/backend-api/codex/responses";

function readStreamText(payload: string) {
  let text = "";
  for (const rawLine of payload.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) {
      continue;
    }

    const data = line.slice("data:".length).trim();
    if (!data || data === "[DONE]") {
      continue;
    }

    try {
      const event = JSON.parse(data) as {
        delta?: string;
        response?: { output?: Array<{ content?: Array<{ text?: string }> }> };
      };
      if (typeof event.delta === "string") {
        text += event.delta;
      }
      const completedText = event.response?.output
        ?.flatMap((item) => item.content ?? [])
        .map((content) => content.text ?? "")
        .join("");
      if (!text && completedText) {
        text = completedText;
      }
    } catch {
      // Ignore non-JSON stream lines.
    }
  }

  return text.trim();
}

function extractOutputText(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return "";
  }

  const record = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: unknown }> }>;
  };
  if (typeof record.output_text === "string") {
    return record.output_text;
  }

  return record.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => (typeof content.text === "string" ? content.text : ""))
    .join("")
    .trim() ?? "";
}

export class OpenAICodexPlannerAdapter implements ObjectivePhasePlannerPort {
  readonly plannerId = "openai-codex-planner" as const;

  constructor(private readonly config: ProbeConfig) {}

  async planPhaseSource(request: ObjectivePhasePlannerRequest): Promise<DirectGeneratedSourcePlan> {
    const inputRef = await writeProviderInputSnapshot(request.actorWorkspaceRootDir, {
      schema: "provider-input-snapshot/v1",
      snapshot_id: `planner-input-${request.turnId}`,
      actor_id: request.actorId,
      turn_id: request.turnId,
      provider_id: this.plannerId,
      model: this.config.gameplayProvider.model,
      created_at: new Date().toISOString(),
      input: {
        phase_id: request.phaseId,
        objective_id: request.objectiveId,
        prompt: request.prompt,
        memory: request.memoryContext ?? null
      } as JsonValue
    });

    try {
      const auth = await loadOpenAICodexAuth(this.config.liveDialogue.authStorePath);
      const response = await fetch(sourceEndpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${auth.accessToken}`
        },
        body: JSON.stringify({
          model: this.config.gameplayProvider.model,
          instructions: "Generate concise TypeScript for a Minecraft direct action skill.",
          reasoning: { effort: this.config.gameplayProvider.reasoning },
          stream: true,
          store: false,
          input: [{ role: "user", content: [{ type: "input_text", text: request.prompt }] }]
        })
      });

      const raw = await response.text();
      if (!response.ok) {
        const suffix = raw.trim().length > 0 ? `: ${raw.trim().slice(0, 300)}` : "";
        throw new Error(`openai codex planner failed: ${response.status}${suffix}`);
      }

      const text = raw.trim().startsWith("{")
        ? extractOutputText(JSON.parse(raw))
        : readStreamText(raw);
      const source = stripGeneratedSourceFence(text);
      const outputRef = await writeProviderOutputSnapshot(request.actorWorkspaceRootDir, {
        schema: "provider-output-snapshot/v1",
        snapshot_id: `planner-output-${request.turnId}`,
        actor_id: request.actorId,
        turn_id: request.turnId,
        provider_id: this.plannerId,
        model: this.config.gameplayProvider.model,
        created_at: new Date().toISOString(),
        raw_output_text: text,
        parsed_output: { source },
        proposal: { source_kind: "direct_generated_ts" }
      });

      return {
        sourceKind: "llm-generated-ts",
        source,
        plannerId: this.plannerId,
        model: this.config.gameplayProvider.model,
        providerInputRef: inputRef,
        providerOutputRef: outputRef
      };
    } catch (error) {
      const paths = getActorWorkspacePaths(request.actorWorkspaceRootDir, request.actorId);
      const outputRef = path.join(
        paths.providerOutputsDir,
        `planner-output-${sanitizeWorkspaceFileId(request.turnId)}-error.json`
      );
      await writeJson(outputRef, {
        schema: "provider-output-snapshot/v1",
        snapshot_id: `planner-output-${request.turnId}-error`,
        actor_id: request.actorId,
        turn_id: request.turnId,
        provider_id: this.plannerId,
        model: this.config.gameplayProvider.model,
        created_at: new Date().toISOString(),
        raw_output_text: "",
        parsed_output: {
          error: error instanceof Error ? error.message : String(error)
        },
        proposal: { source_kind: "planner_error" }
      });

      return {
        sourceKind: "llm-generated-ts",
        source: "",
        plannerId: this.plannerId,
        model: this.config.gameplayProvider.model,
        providerInputRef: inputRef,
        providerOutputRef: outputRef,
        fallbackReason: error instanceof Error ? error.message : String(error),
        errorKind: "planner_request_failed"
      };
    }
  }
}
