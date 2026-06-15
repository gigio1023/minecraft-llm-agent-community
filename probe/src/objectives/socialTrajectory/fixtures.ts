import type { GroundedSocialTrajectoryInput } from "./types.js";

export const GROUNDED_SOCIAL_STICKS_SCENARIO_ID =
  "grounded_social_sticks_from_deposited_logs_v1";

export function buildGroundedSocialSticksFixture(
  createdAt = new Date().toISOString()
): GroundedSocialTrajectoryInput {
  return {
    schema: "grounded-social-trajectory-input/v1",
    run_id: `grounded-social-trajectory-smoke-${createdAt.replaceAll(/[:.]/g, "-")}`,
    created_at: createdAt,
    scenario_id: GROUNDED_SOCIAL_STICKS_SCENARIO_ID,
    provider: {
      id: "deterministic",
      model: "provider-free-fixture",
      live_provider_calls: 0
    },
    environment: {
      world_seed: "not-started-provider-free-smoke",
      world_scenario_id: "provider-free-social-ledger-smoke",
      live_minecraft_server: false,
      notes:
        "Provider-free smoke for the social event ledger and scorer. No Minecraft server or LLM provider was started."
    },
    actors: [
      {
        actor_id: "npc_a",
        role: "quartermaster",
        life_goal: "Keep shared settlement value visible and evidence-backed."
      },
      {
        actor_id: "npc_b",
        role: "gatherer",
        life_goal: "Contribute useful materials to shared settlement work."
      },
      {
        actor_id: "npc_c",
        role: "crafter",
        life_goal: "Use shared resources to create useful intermediate tools or materials."
      }
    ],
    events: [
      {
        event_id: "evt-001-request-wood",
        cycle: 1,
        actor_id: "npc_c",
        target_actor_id: "npc_b",
        type: "request",
        item_id: "oak_log",
        count: 1,
        evidence_refs: ["transcript:cycle-001-npc-c-request-oak-log"],
        notes: "Crafter requests wood input for shared stick crafting."
      },
      {
        event_id: "evt-002-promise-wood",
        cycle: 1,
        actor_id: "npc_b",
        target_actor_id: "npc_c",
        type: "promise",
        item_id: "oak_log",
        count: 1,
        evidence_refs: ["transcript:cycle-001-npc-b-promises-oak-log", "event:evt-001-request-wood"],
        notes: "Gatherer accepts responsibility for contributing wood."
      },
      {
        event_id: "evt-003-shared-deposit-oak-log",
        cycle: 2,
        actor_id: "npc_b",
        type: "shared_deposit",
        item_id: "oak_log",
        count: 1,
        container_id: "shared_chest_spawn",
        evidence_refs: [
          "inventory:npc-b-minus-oak-log-1",
          "container:shared-chest-plus-oak-log-1",
          "event:evt-002-promise-wood"
        ],
        notes: "Gatherer deposits one oak log into shared storage."
      },
      {
        event_id: "evt-004-shared-inspect-oak-log",
        cycle: 3,
        actor_id: "npc_c",
        type: "shared_inspect",
        item_id: "oak_log",
        count: 1,
        container_id: "shared_chest_spawn",
        evidence_refs: [
          "container:shared-chest-snapshot-oak-log-1",
          "event:evt-003-shared-deposit-oak-log"
        ],
        notes: "Crafter observes the deposited shared resource."
      },
      {
        event_id: "evt-005-shared-withdraw-oak-log",
        cycle: 3,
        actor_id: "npc_c",
        type: "shared_withdraw",
        item_id: "oak_log",
        count: 1,
        container_id: "shared_chest_spawn",
        evidence_refs: [
          "inventory:npc-c-plus-oak-log-1",
          "container:shared-chest-minus-oak-log-1",
          "event:evt-003-shared-deposit-oak-log",
          "event:evt-004-shared-inspect-oak-log"
        ],
        notes: "Crafter withdraws the shared oak log after inspection."
      },
      {
        event_id: "evt-006-craft-sticks",
        cycle: 4,
        actor_id: "npc_c",
        type: "craft",
        item_id: "stick",
        count: 4,
        evidence_refs: [
          "inventory:npc-c-plus-stick-4",
          "recipe:oak-log-to-planks-to-sticks",
          "event:evt-005-shared-withdraw-oak-log"
        ],
        notes: "Crafter converts the shared wood contribution into sticks."
      },
      {
        event_id: "evt-007-relationship-update",
        cycle: 5,
        actor_id: "npc_a",
        target_actor_id: "npc_b",
        type: "relationship_update",
        evidence_refs: [
          "relationship:npc-a-notes-npc-b-contribution",
          "event:evt-003-shared-deposit-oak-log",
          "event:evt-006-craft-sticks"
        ],
        notes: "Quartermaster records that npc_b's contribution enabled npc_c's craft."
      },
      {
        event_id: "evt-008-memory-write",
        cycle: 5,
        actor_id: "npc_c",
        type: "memory_write",
        evidence_refs: [
          "memory:npc-c-shared-wood-enabled-sticks",
          "event:evt-003-shared-deposit-oak-log",
          "event:evt-006-craft-sticks"
        ],
        notes: "Crafter records that shared wood can support future tool work."
      }
    ]
  };
}
