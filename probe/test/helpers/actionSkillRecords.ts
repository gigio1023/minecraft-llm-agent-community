import type { ActorActionSkillRecord } from "../../src/runtime/actorWorkspaceStore.js";

export function testActionSkillRecord(
  skillId: string,
  primitives: string[],
  ownerActorId = "npc_a"
): ActorActionSkillRecord {
  return {
    schema: "actor-action-skill/v1",
    skill_id: skillId,
    owner_actor_id: ownerActorId,
    source_kind: "seed",
    status: "active",
    created_at: "2026-05-20T00:00:00.000Z",
    updated_at: "2026-05-20T00:00:00.000Z",
    required_primitives: primitives,
    preconditions: [],
    success_verifier: `runtime verifier for ${skillId}`,
    known_failure_modes: [],
    evidence_refs: [],
    review_refs: []
  };
}

export function runtimeControlActionSkill(ownerActorId = "npc_a") {
  return testActionSkillRecord(
    "runtimeObserveAndRemember",
    ["observe", "wait", "remember"],
    ownerActorId
  );
}
