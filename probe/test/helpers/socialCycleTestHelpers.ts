/** Shared test fixtures for social-cycle context and actor workspace setup. */
import type { ActorActionSkillRecord } from "../../src/runtime/actorWorkspaceStore.js";

export function buildNpcBActionSkillRecord(): ActorActionSkillRecord {
  return {
    schema: "actor-action-skill/v1",
    skill_id: "collectLogs",
    owner_actor_id: "npc_b",
    source_kind: "seed",
    status: "active",
    created_at: "2026-05-23T00:00:00.000Z",
    updated_at: "2026-05-23T00:00:00.000Z",
    required_primitives: ["collect_logs", "observe", "wait", "remember"],
    preconditions: [],
    success_verifier: "inventory logs increased",
    known_failure_modes: [],
    evidence_refs: [],
    review_refs: []
  };
}
