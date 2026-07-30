import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runMineflayerCodegenProvider } from "../src/provider/socialActorTurnCodegenProvider.js";
import { runSocialActorTurnProvider } from "../src/provider/socialActorTurnProvider.js";
import { runSocialDeliberationProvider } from "../src/provider/socialDeliberationProvider.js";
import { runSocialCycleGoalProvider } from "../src/provider/socialGoalMindProvider.js";
import type { ProviderOutputSnapshot } from "../src/provider/providerOutputStore.js";
import type { ModelStudioApiProviderConfig } from "../src/provider/modelStudioApiProvider.js";
import type {
  ActionCardProjection,
  ActorTurnInput
} from "../src/runtime/goals/actorEpisode/index.js";
import { compileActorSoulFromProfile } from "../src/runtime/goals/actorSoulStore.js";
import { assembleSocialCycleContext } from "../src/runtime/goals/cycleContextAssembler.js";
import type { ActiveEpisode } from "../src/runtime/goals/actorEpisode/index.js";

const SENTINEL_REASONING = "model-studio-raw-sentinel-reasoning";

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
    selected_plan_bead_refs: [],
    related_plan_bead_refs: [],
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

function modelStudioConfig(input: {
  dir: string;
  ledgerPath: string;
  fetchImpl: typeof fetch;
}): ModelStudioApiProviderConfig {
  return {
    apiKey: "test-model-studio-key",
    workspaceId: "ws-evidence",
    model: "qwen3.8-max-preview",
    repoRoot: input.dir,
    usageLedgerPath: input.ledgerPath,
    fetchImpl: input.fetchImpl
  };
}

function chatJsonResponse(content: unknown, reasoning = SENTINEL_REASONING) {
  return new Response(
    JSON.stringify({
      model: "qwen3.8-max-preview",
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: typeof content === "string" ? content : JSON.stringify(content),
            reasoning_content: reasoning
          }
        }
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 8,
        total_tokens: 18,
        completion_tokens_details: { reasoning_tokens: 3 }
      }
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

function chatToolResponse(input: {
  name: string;
  args: Record<string, unknown>;
  reasoning?: string;
}) {
  return new Response(
    JSON.stringify({
      model: "qwen3.8-max-preview",
      choices: [
        {
          finish_reason: "tool_calls",
          message: {
            content: "",
            reasoning_content: input.reasoning ?? SENTINEL_REASONING,
            tool_calls: [
              {
                id: "call-1",
                type: "function",
                function: {
                  name: input.name,
                  arguments: JSON.stringify(input.args)
                }
              }
            ]
          }
        }
      ],
      usage: {
        prompt_tokens: 12,
        completion_tokens: 9,
        total_tokens: 21,
        completion_tokens_details: { reasoning_tokens: 4 }
      }
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

function hangUntilAbort(signal: AbortSignal | null | undefined): Promise<never> {
  return new Promise((_, reject) => {
    if (!signal) {
      reject(new Error("missing abort signal"));
      return;
    }
    if (signal.aborted) {
      reject(new DOMException("The operation was aborted.", "AbortError"));
      return;
    }
    signal.addEventListener(
      "abort",
      () => reject(new DOMException("The operation was aborted.", "AbortError")),
      { once: true }
    );
  });
}

async function readSnapshot(outputRef: string): Promise<ProviderOutputSnapshot> {
  return JSON.parse(await readFile(outputRef, "utf8")) as ProviderOutputSnapshot;
}

function rawReasoning(snapshot: ProviderOutputSnapshot): string | undefined {
  return (
    snapshot.raw_provider_output as {
      response?: { choices?: Array<{ message?: { reasoning_content?: string } }> };
    } | undefined
  )?.response?.choices?.[0]?.message?.reasoning_content;
}

function observeActorTurnFixtures() {
  const card = {
    schema: "action-card/v1" as const,
    action_card_id: "card-observe",
    title: "Observe",
    description: "Observe nearby Minecraft state.",
    parameters_schema_ref: "runtime-parameters/actor-turn-action-parameters/v1/observe.json",
    parameter_hints: ["{}"],
    current_state_requirements: [],
    expected_evidence: ["runtime evidence"],
    likely_blockers: [],
    readiness: "ready" as const,
    runtime_mapping_ref: "action-card-mappings/card-observe.json"
  };
  const actionCardProjection: ActionCardProjection = {
    schema: "action-card-projection/v1",
    actor_id: "npc_b",
    action_cards: [card],
    runtime_mappings: [
      {
        kind: "use_primitive",
        action_card_id: "card-observe",
        primitive_id: "observe"
      }
    ],
    deferred_counts: { primitives: 0, action_skills: 0 },
    missing_affordances: []
  };
  const actorTurnInput = {
    schema: "actor-turn-input/v1",
    turn_id: "turn-evidence-1",
    active_episode: {
      actor_id: "npc_b",
      episode_id: "episode-1",
      purpose: "Gather evidence.",
      current_focus: "Observe nearby state."
    },
    current_state: {
      inventory_counts: {},
      visible_actors: [],
      nearby_block_observations: []
    },
    action_cards: [card],
    decision_frame: {
      do_not_repeat: [],
      prefer: [],
      notes: [],
      next_action_guidance: []
    },
    runtime_retry_constraints: [],
    source_evidence_bundle: {
      observation: {
        nearby_blocks: []
      }
    },
    relationship_context: {
      relationship_refs: [],
      visible_actor_ids: [],
      relationship_cards: []
    },
    minecraft_basic_guide: {
      schema: "minecraft-basic-guide/v1",
      item_flows: [],
      station_requirements: [],
      blocker_recovery_guides: [],
      observe_stop_guides: []
    }
  } as unknown as ActorTurnInput;
  return { actionCardProjection, actorTurnInput };
}

function observeToolArgs() {
  return {
    parameters: {},
    expected_outcome: "diagnostic_unlock",
    situation_assessment: "Need a fresh observe before acting.",
    why_this_tool: "Observe is the lowest-cost evidence gatherer.",
    success_evidence: ["updated observation"],
    failure_handling: "wait briefly and observe again"
  };
}

function validCodegenBody() {
  return {
    mineflayer_codegen: {
      schema: "mineflayer-codegen-output/v1",
      runtime_parameters: { text: "Need logs in shared storage." },
      candidate: {
        schema: "generated-action-skill-candidate/v1",
        proposed_skill_id: "saySharedChestNeed",
        purpose: "Say a concrete shared-storage need with helper evidence.",
        source_language: "typescript",
        source:
          "export async function run(ctx, params) { await ctx.say(params.text); return { status: 'ok' }; }",
        input_schema: {
          type: "object",
          required: ["text"],
          additionalProperties: false,
          properties: { text: { type: "string" } }
        },
        helper_api_version: "mineflayer-action-skill-helper/v1",
        helper_allowlist: ["say"],
        timeout_ms: 5000,
        verifier: { kind: "helper_result_status", helper: "say", status: "delivered" },
        known_failure_modes: ["chat helper unavailable"],
        promotion_policy: "promote_after_passed_trial"
      },
      codegen_rationale: "Use the full actor turn context and generate a bounded say helper."
    }
  };
}

function authorToolArgs() {
  return {
    situation_assessment: "Visible Action Cards cannot place at an unknown cell.",
    why_codegen_is_needed: "Need a bounded search-and-place helper.",
    desired_minecraft_behavior: "Find a support cell and place a crafting table.",
    expected_outcome: "world_block_delta" as const,
    existing_tools_considered: [
      {
        action_card_id: "card-observe",
        title: "Observe",
        why_not_enough: "Observation alone cannot place the table."
      }
    ],
    success_evidence: ["nearby crafting_table block evidence"],
    failure_handling: "Return explicit blocker evidence."
  };
}

test("Model Studio goal/deliberation/actor-turn/codegen success snapshots keep top-level raw reasoning", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-evidence-success-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    const soul = compileActorSoulFromProfile("npc_b");
    const context = await assembleSocialCycleContext({
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      soul,
      lifeGoal: lifeGoal(),
      strategicGoals: [],
      worldEvents: [],
      previousJudgments: [],
      activeActionSkills: [],
      observation: {
        status: "ok",
        observerId: "npc_b",
        inventory: [],
        nearbyBlocks: []
      },
      allowedPrimitiveIds: ["observe", "wait", "remember"],
      maxActionsPerCycle: 2,
      cycleIndex: 1
    });

    const goal = await runSocialCycleGoalProvider({
      providerId: "alibaba-model-studio-api",
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-0001",
      context,
      allowedActionSkillIds: [],
      allowedPrimitiveIds: ["observe", "wait", "remember"],
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: async () =>
          chatJsonResponse({
            strategic_goal_updates: [
              {
                summary: "Stay evidence-first under the LifeGoal.",
                rationale: "Need continuity without inventing authority.",
                success_direction: "Collect usable evidence before acting.",
                current_blockers: []
              }
            ],
            cycle_goal: {
              summary: "Observe nearby state before choosing a physical step.",
              rationale: "Fresh observation reduces wasted retries.",
              success_verifier: "runtime_primitive_or_evidence",
              evidence_required: ["observation"],
              stop_conditions: ["observation refreshed"],
              allowed_action_skill_ids: [],
              allowed_primitive_ids: ["observe", "wait", "remember"]
            }
          })
      }),
      runId: "run-evidence"
    });
    assert.equal(goal.ok, true);
    const goalSnapshot = await readSnapshot(goal.ok ? goal.outputRef : "");
    assert.equal(rawReasoning(goalSnapshot), SENTINEL_REASONING);

    const deliberation = await runSocialDeliberationProvider({
      providerId: "alibaba-model-studio-api",
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-0002",
      branch: {
        schema: "deliberation-branch/v1",
        branch_id: "branch-cycle-0001-retry",
        reason: "repeated_exact_blocker",
        evidence_refs: ["evidence/place-table-blocked.json"],
        current_episode_ref: "goals/episodes/episode-cycle-0001.json"
      },
      currentEpisode: activeEpisode(),
      currentEpisodeRef: "goals/episodes/episode-cycle-0001.json",
      context,
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: async () =>
          chatJsonResponse({
            deliberation: {
              rationale: "Reframe after the repeated blocker.",
              next_episode: {
                episode_id: "episode-cycle-0002",
                actor_id: "npc_b",
                purpose: "Verify practical crafting table access before making tools.",
                current_focus: "Confirm the station is reachable.",
                opened_from_refs: ["provider-outputs/deliberation.json"],
                pivot_triggers: [{ trigger: "Crafting table is usable." }],
                status: "proposed"
              },
              plan_bead_op_proposals: []
            }
          })
      }),
      runId: "run-evidence"
    });
    assert.equal(deliberation.ok, true);
    const deliberationSnapshot = await readSnapshot(
      deliberation.ok ? deliberation.outputRef : ""
    );
    assert.equal(rawReasoning(deliberationSnapshot), SENTINEL_REASONING);

    const { actorTurnInput, actionCardProjection } = observeActorTurnFixtures();
    const actorTurn = await runSocialActorTurnProvider({
      providerId: "alibaba-model-studio-api",
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-0003",
      cycleGoalId: "cycle-goal-1",
      actorTurnInput,
      actionCardProjection,
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: async () =>
          chatToolResponse({
            name: "action_card_001_observe",
            args: observeToolArgs()
          })
      }),
      runId: "run-evidence"
    });
    assert.equal(actorTurn.ok, true);
    const actorTurnSnapshot = await readSnapshot(actorTurn.ok ? actorTurn.outputRef : "");
    assert.equal(rawReasoning(actorTurnSnapshot), SENTINEL_REASONING);
    assert.equal(
      (
        actorTurnSnapshot.parsed_output as {
          raw_provider_output?: { response?: { choices?: Array<{ message?: { reasoning_content?: string } }> } };
        }
      ).raw_provider_output?.response?.choices?.[0]?.message?.reasoning_content,
      SENTINEL_REASONING
    );

    const codegen = await runMineflayerCodegenProvider({
      providerId: "alibaba-model-studio-api",
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      actorTurnInput,
      rawOuterToolCall: {
        type: "function_call",
        name: "author_mineflayer_action",
        call_id: "call-author",
        arguments: JSON.stringify(authorToolArgs())
      },
      parsedAuthorToolArgs: authorToolArgs(),
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: async () => chatJsonResponse(validCodegenBody())
      }),
      runId: "run-evidence",
      snapshotId: "codegen-success"
    });
    assert.equal(codegen.ok, true);
    const codegenSnapshot = await readSnapshot(codegen.ok ? codegen.outputRef : "");
    assert.equal(rawReasoning(codegenSnapshot), SENTINEL_REASONING);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio provider-returned and validation failures preserve top-level raw output", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-evidence-fail-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    const soul = compileActorSoulFromProfile("npc_b");
    const context = await assembleSocialCycleContext({
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      soul,
      lifeGoal: lifeGoal(),
      strategicGoals: [],
      worldEvents: [],
      previousJudgments: [],
      activeActionSkills: [],
      observation: {
        status: "ok",
        observerId: "npc_b",
        inventory: [],
        nearbyBlocks: []
      },
      allowedPrimitiveIds: ["observe"],
      maxActionsPerCycle: 1,
      cycleIndex: 1
    });

    const providerFailure = await runSocialCycleGoalProvider({
      providerId: "alibaba-model-studio-api",
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-fail-http",
      context,
      allowedActionSkillIds: [],
      allowedPrimitiveIds: ["observe"],
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: async () =>
          new Response(JSON.stringify({ error: { message: "upstream rejected" } }), {
            status: 400,
            headers: { "content-type": "application/json" }
          })
      })
    });
    assert.equal(providerFailure.ok, false);
    const providerFailureSnapshot = await readSnapshot(
      providerFailure.ok ? "" : providerFailure.outputRef
    );
    assert.notEqual(providerFailureSnapshot.raw_provider_output, undefined);
    assert.equal("raw_provider_output" in providerFailureSnapshot, true);

    const validationFailure = await runSocialCycleGoalProvider({
      providerId: "alibaba-model-studio-api",
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-fail-validation",
      context,
      allowedActionSkillIds: [],
      allowedPrimitiveIds: ["observe"],
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: async () =>
          chatJsonResponse({
            strategic_goal_updates: [],
            not_a_cycle_goal: true
          })
      })
    });
    assert.equal(validationFailure.ok, false);
    const validationSnapshot = await readSnapshot(
      validationFailure.ok ? "" : validationFailure.outputRef
    );
    assert.equal(rawReasoning(validationSnapshot), SENTINEL_REASONING);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio no-response failures omit optional top-level raw_provider_output", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-evidence-no-raw-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    const soul = compileActorSoulFromProfile("npc_b");
    const context = await assembleSocialCycleContext({
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      soul,
      lifeGoal: lifeGoal(),
      strategicGoals: [],
      worldEvents: [],
      previousJudgments: [],
      activeActionSkills: [],
      observation: {
        status: "ok",
        observerId: "npc_b",
        inventory: [],
        nearbyBlocks: []
      },
      allowedPrimitiveIds: ["observe"],
      maxActionsPerCycle: 1,
      cycleIndex: 1
    });
    const controller = new AbortController();
    controller.abort();
    const result = await runSocialCycleGoalProvider({
      providerId: "alibaba-model-studio-api",
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-aborted",
      context,
      allowedActionSkillIds: [],
      allowedPrimitiveIds: ["observe"],
      signal: controller.signal,
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: async () => new Response()
      })
    });
    assert.equal(result.ok, false);
    const snapshot = await readSnapshot(result.ok ? "" : result.outputRef);
    assert.equal("raw_provider_output" in snapshot, false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Actor Turn and codegen skip repair after abort, and still repair once when live", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-evidence-repair-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  try {
    const { actorTurnInput, actionCardProjection } = observeActorTurnFixtures();

    const malformedMultiToolResponse = () =>
      new Response(
        JSON.stringify({
          model: "qwen3.8-max-preview",
          choices: [
            {
              finish_reason: "tool_calls",
              message: {
                content: "",
                reasoning_content: SENTINEL_REASONING,
                tool_calls: [
                  {
                    id: "call-a",
                    type: "function",
                    function: {
                      name: "action_card_001_observe",
                      arguments: JSON.stringify(observeToolArgs())
                    }
                  },
                  {
                    id: "call-b",
                    type: "function",
                    function: {
                      name: "action_card_001_observe",
                      arguments: JSON.stringify(observeToolArgs())
                    }
                  }
                ]
              }
            }
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );

    let abortedActorFetches = 0;
    const abortedController = new AbortController();
    const abortedActorTurn = await runSocialActorTurnProvider({
      providerId: "alibaba-model-studio-api",
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-abort-repair",
      cycleGoalId: "cycle-goal-1",
      actorTurnInput,
      actionCardProjection,
      signal: abortedController.signal,
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: async () => {
          abortedActorFetches += 1;
          abortedController.abort();
          return malformedMultiToolResponse();
        }
      }),
      runId: "run-abort-repair"
    });
    assert.equal(abortedActorTurn.ok, false);
    assert.equal(abortedActorFetches, 1);

    let liveActorFetches = 0;
    const liveActorTurn = await runSocialActorTurnProvider({
      providerId: "alibaba-model-studio-api",
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-live-repair",
      cycleGoalId: "cycle-goal-1",
      actorTurnInput,
      actionCardProjection,
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: async () => {
          liveActorFetches += 1;
          if (liveActorFetches === 1) {
            return malformedMultiToolResponse();
          }
          return chatToolResponse({
            name: "action_card_001_observe",
            args: observeToolArgs()
          });
        }
      }),
      runId: "run-live-repair"
    });
    assert.equal(liveActorTurn.ok, true);
    assert.equal(liveActorFetches, 2);

    let abortedCodegenFetches = 0;
    const codegenAbort = new AbortController();
    const abortedCodegen = await runMineflayerCodegenProvider({
      providerId: "alibaba-model-studio-api",
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      actorTurnInput,
      rawOuterToolCall: {
        type: "function_call",
        name: "author_mineflayer_action",
        call_id: "call-author-abort",
        arguments: JSON.stringify(authorToolArgs())
      },
      parsedAuthorToolArgs: authorToolArgs(),
      signal: codegenAbort.signal,
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: async () => {
          abortedCodegenFetches += 1;
          codegenAbort.abort();
          return chatJsonResponse({ mineflayer_codegen: { schema: "bad" } });
        }
      }),
      runId: "run-codegen-abort",
      snapshotId: "codegen-abort"
    });
    assert.equal(abortedCodegen.ok, false);
    assert.equal(abortedCodegenFetches, 1);

    let liveCodegenFetches = 0;
    const liveCodegen = await runMineflayerCodegenProvider({
      providerId: "alibaba-model-studio-api",
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      actorTurnInput,
      rawOuterToolCall: {
        type: "function_call",
        name: "author_mineflayer_action",
        call_id: "call-author-live",
        arguments: JSON.stringify(authorToolArgs())
      },
      parsedAuthorToolArgs: authorToolArgs(),
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: async () => {
          liveCodegenFetches += 1;
          if (liveCodegenFetches === 1) {
            return chatJsonResponse({ mineflayer_codegen: { schema: "bad" } });
          }
          return chatJsonResponse(validCodegenBody());
        }
      }),
      runId: "run-codegen-live",
      snapshotId: "codegen-live"
    });
    assert.equal(liveCodegen.ok, true);
    assert.equal(liveCodegenFetches, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Actor Turn preserves case-abort attribution when author codegen is cancelled", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-actor-codegen-abort-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  const controller = new AbortController();
  let fetchCalls = 0;
  try {
    const { actorTurnInput, actionCardProjection } = observeActorTurnFixtures();
    const result = await runSocialActorTurnProvider({
      providerId: "alibaba-model-studio-api",
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-author-codegen-abort",
      cycleGoalId: "cycle-goal-1",
      actorTurnInput,
      actionCardProjection,
      signal: controller.signal,
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: async (_url, init) => {
          fetchCalls += 1;
          if (fetchCalls === 1) {
            return chatToolResponse({
              name: "author_mineflayer_action",
              args: authorToolArgs()
            });
          }
          queueMicrotask(() => controller.abort());
          return hangUntilAbort(init?.signal);
        }
      }),
      runId: "run-author-codegen-abort"
    });

    assert.equal(result.ok, false);
    assert.equal(fetchCalls, 2);
    assert.equal(!result.ok && result.errorKind, "aborted");
    assert.equal(!result.ok && result.failureKind, undefined);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
