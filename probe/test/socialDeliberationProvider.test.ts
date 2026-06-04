/** Regression coverage for non-executable Deliberation provider behavior. */
import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  parseDeliberationProviderOutput,
  runSocialDeliberationProvider
} from "../src/provider/socialDeliberationProvider.js";
import { compileActorSoulFromProfile } from "../src/runtime/goals/actorSoulStore.js";
import { assembleSocialCycleContext } from "../src/runtime/goals/cycleContextAssembler.js";
import { readJsonIfExists } from "../src/runtime/goals/goalJsonStore.js";
import type {
  ActiveEpisode,
  DeliberationOutput
} from "../src/runtime/goals/actorEpisode/index.js";
import { validatePlanBeadOperation } from "../src/runtime/goals/planBeads/index.js";
import type { CycleJudgment } from "../src/runtime/goals/types.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, "test-artifacts", `social-deliberation-${process.pid}-${Date.now()}`);

function lifeGoal() {
  const soul = compileActorSoulFromProfile("npc_b");
  return {
    schema: "actor-life-goal/v1" as const,
    actor_id: "npc_b",
    goal_id: "life-1",
    objective: soul.life_goal,
    status: "active" as const,
    source: "actor_soul" as const,
    created_at: "2026-06-03T00:00:00.000Z",
    updated_at: "2026-06-03T00:00:00.000Z",
    cycle_count: 0,
    action_count: 0,
    evidence_refs: [],
    memory_refs: [],
    relationship_refs: []
  };
}

function activeEpisode(): ActiveEpisode {
  return {
    schema: "active-episode/v1",
    episode_id: "episode-cycle-0001",
    actor_id: "npc_b",
    actors_visible_or_relevant: [],
    life_goal_ref: "goals/life/active.json",
    purpose: "Make visible progress without losing the current blocker.",
    current_focus: "Recover from repeated crafting-table placement blocker.",
    selected_plan_bead_refs: ["plan-beads/beads/bead-table-access.json"],
    related_plan_bead_refs: ["bead-table-access"],
    success_signals: [{ kind: "runtime_artifact", description: "runtime evidence" }],
    pivot_triggers: [{ trigger: "same blocker repeats", evidence_refs: [] }],
    mistake_budget: {
      allow_exploration_turns: 2,
      observe_repeat_limit: 1,
      exact_blocker_repeat_limit: 2
    },
    social_pressure: [],
    opened_from_refs: ["provider-inputs/goal-mind-cycle-0001.json"],
    started_at_turn_ref: "cycle-0001-action-01",
    status: "active"
  };
}

test("deterministic Deliberation provider reframes Active Episode without action authority", async () => {
  const soul = compileActorSoulFromProfile("npc_b");
  const judgment: CycleJudgment = {
    schema: "cycle-judgment/v1",
    actor_id: "npc_b",
    cycle_id: "cycle-0001",
    cycle_goal_id: "cycle-goal-1",
    outcome: "blocked",
    what_happened: "The same placement target was blocked twice.",
    why_it_mattered_for_life_goal: "The actor must pivot without forgetting table access.",
    verifier_status: "failed",
    evidence_refs: ["evidence/place-table-blocked.json"],
    memory_writes: [],
    relationship_event_proposals: [],
    next_goal_context: ["branch to Deliberation"]
  };
  const context = await assembleSocialCycleContext({
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    soul,
    lifeGoal: lifeGoal(),
    strategicGoals: [],
    worldEvents: [],
    previousJudgments: [{ ref: "judgments/cycle-0001-action-02-judgment.json", judgment }],
    activeActionSkills: [],
    observation: {
      status: "ok",
      observerId: "npc_b",
      inventory: [{ name: "crafting_table", count: 1 }],
      nearbyBlocks: [{ name: "grass_block", position: { x: 0, y: 63, z: 1 } }]
    },
    allowedPrimitiveIds: ["observe", "place_block", "remember"],
    maxActionsPerCycle: 2,
    cycleIndex: 1
  });
  const branch = {
    schema: "deliberation-branch/v1" as const,
    branch_id: "branch-cycle-0001-retry",
    reason: "repeated_exact_blocker" as const,
    evidence_refs: ["evidence/place-table-blocked.json"],
    current_episode_ref: "goals/episodes/episode-cycle-0001.json"
  };

  const result = await runSocialDeliberationProvider({
    providerId: "deterministic-social",
    actorWorkspaceRootDir: rootDir,
    actorId: "npc_b",
    cycleId: "cycle-0002",
    branch,
    currentEpisode: activeEpisode(),
    currentEpisodeRef: branch.current_episode_ref,
    context,
    runId: "run-1"
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.deliberation.schema, "deliberation-output/v1");
  assert.equal(result.ok && result.deliberation.plan_bead_op_proposals.length, 0);
  assert.equal(result.ok && result.episode.opened_from_refs.includes(branch.current_episode_ref), true);
  assert.equal(result.ok && result.inputRef.includes("provider-inputs/deliberation-"), true);
  assert.equal(result.ok && result.outputRef.includes("provider-outputs/deliberation-"), true);

  const output = result.ok
    ? await readJsonIfExists<{ parsed_output?: DeliberationOutput }>(result.outputRef)
    : null;
  assert.equal(output?.parsed_output?.schema, "deliberation-output/v1");
  assert.equal((output?.parsed_output as Record<string, unknown>)?.primitive_id, undefined);
  assert.equal((output?.parsed_output as Record<string, unknown>)?.action_skill_id, undefined);
  assert.equal((output?.parsed_output as Record<string, unknown>)?.parameters, undefined);
});

test("Deliberation parser carries current Active Episode fields and normalizes concrete PlanBead creates", () => {
  const currentEpisode = activeEpisode();
  const result = parseDeliberationProviderOutput(
    {
      deliberation: {
        rationale: "Low-cost model only writes the fields it wants to change.",
        next_episode: {
          episode_id: "episode-cycle-0002",
          actor_id: "npc_b",
          purpose: "Verify practical crafting table access before making tools.",
          current_focus: "Use current state to confirm the station is reachable.",
          opened_from_refs: ["provider-outputs/deliberation.json"],
          pivot_triggers: [
            { trigger: "Crafting table is usable; craft the next item." },
            "Ingredients are insufficient; gather or deposit safe surplus first."
          ],
          status: "proposed"
        },
        plan_bead_op_proposals: [
          {
            plan_bead_op_type: "open",
            bead_id: "pb-station-access",
            description: "Keep table access visible because the last branch observed a reachable crafting table.",
            notes_next: ["Confirm the actor can use the observed crafting table before tool crafting."],
            priority: "high"
          }
        ]
      }
    },
    {
      branchId: "branch-cycle-0001-station-access",
      currentEpisodeRef: "goals/episodes/episode-cycle-0001.json",
      currentEpisode,
      branchEvidenceRefs: ["evidence/crafting-table-observed.json"]
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.output.branch_id, "branch-cycle-0001-station-access");
  assert.equal(result.ok && result.output.current_episode_ref, "goals/episodes/episode-cycle-0001.json");
  assert.equal(result.ok && result.output.next_episode.life_goal_ref, currentEpisode.life_goal_ref);
  assert.equal(result.ok && result.output.next_episode.status, "active");
  assert.deepEqual(
    result.ok && result.output.next_episode.selected_plan_bead_refs,
    currentEpisode.selected_plan_bead_refs
  );
  assert.deepEqual(
    result.ok && result.output.next_episode.related_plan_bead_refs,
    currentEpisode.related_plan_bead_refs
  );
  assert.equal(
    result.ok &&
      result.output.next_episode.opened_from_refs.includes("evidence/crafting-table-observed.json"),
    true
  );
  assert.deepEqual(result.ok && result.output.next_episode.pivot_triggers, [
    { trigger: "Crafting table is usable; craft the next item.", evidence_refs: [] },
    {
      trigger: "Ingredients are insufficient; gather or deposit safe surplus first.",
      evidence_refs: []
    }
  ]);
  assert.equal(result.ok && result.output.plan_bead_op_proposals.length, 1);
  const operation = result.ok ? result.output.plan_bead_op_proposals[0] : undefined;
  assert.equal(
    typeof operation === "object" && operation !== null && (operation as Record<string, unknown>).schema,
    "plan-bead-operation/v1"
  );
  assert.equal(
    typeof operation === "object" && operation !== null && (operation as Record<string, unknown>).op,
    "create"
  );
  assert.equal(
    typeof operation === "object" &&
      operation !== null &&
      ((operation as { patch?: { title?: string } }).patch?.title),
    "pb-station-access"
  );
  assert.equal(
    typeof operation === "object" &&
      operation !== null &&
      ((operation as { patch?: { priority?: number } }).patch?.priority),
    0
  );
  assert.equal(validatePlanBeadOperation(operation).ok, true);
});

test("Deliberation parser suppresses stale shared-storage work after contribution evidence", () => {
  const currentEpisode = {
    ...activeEpisode(),
    purpose: "Resolve the block on depositing an oak_log to shared storage.",
    current_focus: "Check whether the shared chest container UI opens before depositing oak_log.",
    selected_plan_bead_refs: ["bead-stale-shared-storage"],
    related_plan_bead_refs: ["bead-stale-shared-storage"]
  };
  const result = parseDeliberationProviderOutput(
    {
      deliberation: {
        rationale: "Try the shared chest again.",
        next_episode: {
          episode_id: "episode-stale-shared-storage",
          purpose: "Validate shared chest openability for oak_log deposit.",
          current_focus: "Probe the shared chest container UI and then deposit oak_log."
        },
        plan_bead_op_proposals: [
          {
            title: "Record exact chest-interaction failure mode",
            description: "The actor still needs to verify shared chest reachability for oak_log deposit.",
            acceptance_evidence_required: ["chest/container UI opens for deposit"],
            notes_next: ["Retry only an adjacent shared chest interaction tile."],
            priority: 2
          }
        ]
      }
    },
    {
      branchId: "branch-cycle-0030-shared-storage",
      currentEpisodeRef: "goals/episodes/episode-stale-shared-storage.json",
      currentEpisode,
      branchEvidenceRefs: ["evidence/cycle-0030-action-01-wait.json"],
      currentState: {
        schema: "actor-turn-current-state/v1",
        observer_id: "npc_b",
        inventory_counts: { dark_oak_log: 2 },
        visible_actors: [],
        nearby_block_hints: [],
        shared_storage: {
          status: "contributed",
          chest_id: "shared-chest-1",
          items: [{ name: "oak_log", count: 1 }],
          evidence_refs: ["evidence/cycle-0001-action-01-deposit_shared.json"]
        },
        deposit_candidates: [
          {
            itemName: "dark_oak_log",
            inventoryCount: 2,
            suggestedCount: 1,
            maxDepositableCount: 2,
            socially_requested: false,
            requested_by_actor_ids: [],
            request_summaries: [],
            evidence_refs: []
          }
        ],
        settlement_progress: {
          inventory_counts: { dark_oak_log: 2 },
          shared_storage_status: "contributed",
          known_position_summaries: ["shared_chest=contributed"],
          checklist: [],
          recent_blockers: []
        }
      }
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.output.plan_bead_op_proposals.length, 0);
  assert.equal(result.ok && result.output.next_episode.selected_plan_bead_refs.length, 0);
  assert.match(
    result.ok ? result.output.next_episode.current_focus : "",
    /different useful Minecraft or social step/
  );
  assert.ok(
    result.ok &&
      result.output.next_episode.social_pressure.some((pressure) =>
        pressure.kind === "shared_storage" &&
          pressure.evidence_refs.includes("evidence/cycle-0001-action-01-deposit_shared.json")
      )
  );
});

test("Deliberation parser normalizes sparse success signal strings", () => {
  const currentEpisode = activeEpisode();
  const result = parseDeliberationProviderOutput(
    {
      deliberation: {
        rationale: "Low-cost model emits compact success signals.",
        next_episode: {
          current_focus: "Recover from the branch with concrete runtime evidence.",
          success_signals: [
            "shared storage contribution evidence",
            { kind: "inventory_delta", summary: "inventory changes after a useful craft" }
          ]
        },
        plan_bead_op_proposals: []
      }
    },
    {
      branchId: "branch-cycle-0006-success-signals",
      currentEpisodeRef: "goals/episodes/episode-cycle-0006.json",
      currentEpisode,
      branchEvidenceRefs: ["evidence/cycle-0006-action-01.json"]
    }
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.ok && result.output.next_episode.success_signals, [
    {
      kind: "runtime_artifact",
      description: "shared storage contribution evidence"
    },
    {
      kind: "inventory_delta",
      description: "inventory changes after a useful craft"
    }
  ]);
});

test("Deliberation parser drops generic branch-only PlanBead create proposals", () => {
  const currentEpisode = activeEpisode();
  const branchId = "branch-cycle-0001-station-access";
  const result = parseDeliberationProviderOutput(
    {
      deliberation: {
        rationale: "The branch does not add a concrete durable concern.",
        next_episode: {
          episode_id: "episode-cycle-0002",
          actor_id: "npc_b",
          purpose: "Continue from the current evidence without adding branch-only work.",
          current_focus: "Use current state to pick a concrete next action.",
          status: "active"
        },
        plan_bead_op_proposals: [
          {
            plan_bead_op_type: "open"
          },
          {
            title: `Branch concern ${branchId}`,
            description: `Track branch-time concern from ${branchId}.`,
            priority: "high"
          },
          {
            schema: "plan-bead-operation/v1",
            op: "create",
            patch: {
              kind: "concern",
              title: `Branch concern ${branchId}`,
              description: `Track branch-time concern from ${branchId}.`,
              acceptance_evidence_required: ["runtime evidence matching this PlanBead's concern"],
              notes_next: ["runtime evidence matching this PlanBead's concern"],
              priority: 2
            }
          }
        ]
      }
    },
    {
      branchId,
      currentEpisodeRef: "goals/episodes/episode-cycle-0001.json",
      currentEpisode,
      branchEvidenceRefs: ["evidence/crafting-table-observed.json"]
    }
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.ok && result.output.plan_bead_op_proposals, []);
});

test("Deliberation parser normalizes unsupported Active Episode status to active", () => {
  const currentEpisode = activeEpisode();
  const result = parseDeliberationProviderOutput(
    {
      deliberation: {
        rationale: "Only the next episode status needs normalization.",
        next_episode: {
          episode_id: "episode-cycle-0002",
          actor_id: "npc_b",
          purpose: "Keep the episode usable after provider status drift.",
          current_focus: "Continue the current blocker recovery with concrete evidence.",
          status: "proposed"
        },
        plan_bead_op_proposals: []
      }
    },
    {
      branchId: "branch-cycle-0001-status",
      currentEpisodeRef: "goals/episodes/episode-cycle-0001.json",
      currentEpisode,
      branchEvidenceRefs: ["evidence/status-branch.json"]
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.output.next_episode.status, "active");
});

test("Deliberation parser repairs social pressure entries missing evidence refs", () => {
  const currentEpisode = activeEpisode();
  const result = parseDeliberationProviderOutput(
    {
      deliberation: {
        rationale: "The provider carried social pressure but omitted evidence refs.",
        next_episode: {
          episode_id: "episode-cycle-0002",
          actor_id: "npc_b",
          purpose: "Continue shared-storage verification under npc_a pressure.",
          current_focus: "Use current state to decide whether deposit evidence is still missing.",
          social_pressure: [
            {
              kind: "world_event",
              summary: "npc_a requests deposit verification before trusting npc_b's next progress claim."
            }
          ],
          status: "active"
        },
        plan_bead_op_proposals: []
      }
    },
    {
      branchId: "branch-cycle-0001-social-pressure",
      currentEpisodeRef: "goals/episodes/episode-cycle-0001.json",
      currentEpisode,
      branchEvidenceRefs: ["evidence/inspect-shared-chest.json"]
    }
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.ok && result.output.next_episode.social_pressure, [
    {
      kind: "world_event",
      summary: "npc_a requests deposit verification before trusting npc_b's next progress claim.",
      evidence_refs: []
    }
  ]);
});
