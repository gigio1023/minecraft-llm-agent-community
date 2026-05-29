import path from "node:path";

import {
  writeActorMemoryRecords,
  type ActorMemoryRecord
} from "../../memory/actorMemory.js";
import { getActorWorkspacePaths } from "../../runtime/actorWorkspacePaths.js";
import { writeJson } from "../../runtime/actorWorkspaceStore.js";
import type { LongObjectivePhaseReport } from "./types.js";

export async function writeLongObjectivePhaseMemory(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  runId: string;
  objectiveId: string;
  phase: LongObjectivePhaseReport;
  artifactDir: string;
}) {
  const now = new Date().toISOString();
  const artifactRef = path.relative(
    getActorWorkspacePaths(input.actorWorkspaceRootDir, input.actorId).actorDir,
    path.join(input.artifactDir, input.phase.phaseId)
  );

  const record: ActorMemoryRecord = {
    schema: "actor-memory-record/v1",
    memory_id: `long-phase-${input.runId}-${input.phase.phaseId}`,
    actor_id: input.actorId,
    kind: "long_objective_phase",
    layer: "episodic",
    status: "active",
    confidence: "observed",
    scope: { kind: "actor_private", actor_id: input.actorId },
    created_at: now,
    updated_at: now,
    summary: `${input.actorId} long phase ${input.phase.phaseId}: ${input.phase.verifierReason}`,
    evidence_refs: [artifactRef],
    tags: [
      "long-objective",
      input.objectiveId,
      input.phase.phaseId,
      input.phase.status,
      input.phase.evidence.itemName
    ],
    index: {
      objective_ids: [input.objectiveId, input.phase.phaseId],
      objective_categories: ["long"],
      item_names: [input.phase.evidence.itemName],
      block_names: (input.phase.evidence.blockObservations ?? []).map((block) => block.name),
      tool_names: [],
      action_skill_ids: [],
      diagnoses: [input.phase.status === "passed" ? "phase_passed" : "phase_failed"],
      verifier_statuses: [input.phase.verifierStatus],
      causal_refs: [artifactRef]
    },
    content: {
      kind: "long_objective_phase_episode",
      run_id: input.runId,
      objective_id: input.objectiveId,
      phase_id: input.phase.phaseId,
      provider_id: input.phase.generated.providerId,
      model: input.phase.generated.model,
      execution_status: input.phase.generated.execution.status,
      verifier_status: input.phase.verifierStatus,
      verifier_reason: input.phase.verifierReason,
      stop_helper_events: input.phase.helperEvents.length
    }
  };

  return writeActorMemoryRecords(input.actorWorkspaceRootDir, [record]);
}

export async function writeLongObjectiveMemoryIndex(input: {
  actorWorkspaceRootDir: string;
  actorId: string;
  objectiveId: string;
  memoryPaths: string[];
}) {
  const actorPaths = getActorWorkspacePaths(input.actorWorkspaceRootDir, input.actorId);
  await writeJson(path.join(actorPaths.memory.indexDir, "latest-long-objective-memory.json"), {
    schema: "actor-memory-index/v1",
    actor_id: input.actorId,
    updated_at: new Date().toISOString(),
    latest_objective_id: input.objectiveId,
    memory_refs: input.memoryPaths.map((filePath) =>
      path.relative(actorPaths.actorDir, filePath)
    )
  });
}
