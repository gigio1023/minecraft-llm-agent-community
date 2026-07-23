import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
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
const OUTER_SENTINEL = "model-studio-outer-routing-sentinel";
const CODEGEN_SENTINEL = "model-studio-codegen-routing-sentinel";
const WORKSPACE_ID = "ws-routing";
const EXPECTED_URL =
  `https://${WORKSPACE_ID}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/chat/completions`;
const PROVIDER_ID = "alibaba-model-studio-api";
const MODEL = "qwen3.8-max-preview";

type FetchCall = { url: string; init?: RequestInit };

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
    apiKey: "test-model-studio-routing-key",
    workspaceId: WORKSPACE_ID,
    model: MODEL,
    repoRoot: input.dir,
    usageLedgerPath: input.ledgerPath,
    fetchImpl: input.fetchImpl
  };
}

function chatJsonResponse(content: unknown, reasoning = SENTINEL_REASONING) {
  return new Response(
    JSON.stringify({
      model: MODEL,
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
      model: MODEL,
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

function assertOmittedThinkingAndTokenCaps(body: Record<string, unknown>) {
  assert.equal("chat_template_kwargs" in body, false);
  assert.equal("enable_thinking" in body, false);
  assert.equal("reasoning_effort" in body, false);
  assert.equal("max_tokens" in body, false);
  assert.equal("max_completion_tokens" in body, false);
}

function assertModelStudioRequest(call: FetchCall) {
  assert.equal(call.url, EXPECTED_URL);
  const body = JSON.parse(String(call.init?.body)) as Record<string, unknown>;
  assert.equal(body.model, MODEL);
  assertOmittedThinkingAndTokenCaps(body);
  return body;
}

async function ledgerRows(ledgerPath: string) {
  try {
    await access(ledgerPath);
  } catch {
    return [] as Array<Record<string, unknown>>;
  }
  const text = (await readFile(ledgerPath, "utf8")).trim();
  if (!text) {
    return [];
  }
  return text.split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
}

function assertUsageAttribution(
  row: Record<string, unknown> | undefined,
  stage: string
) {
  assert.equal(row?.provider_id, PROVIDER_ID);
  assert.equal(row?.model, MODEL);
  assert.equal(row?.stage, stage);
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
    turn_id: "turn-routing-1",
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

async function assembleRoutingContext(dir: string) {
  const soul = compileActorSoulFromProfile("npc_b");
  return assembleSocialCycleContext({
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
}

function trackingFetch(input: {
  calls: FetchCall[];
  respond: (callIndex: number, url: string, init?: RequestInit) => Response | Promise<Response>;
}): typeof fetch {
  return async (url, init) => {
    const callIndex = input.calls.length;
    input.calls.push({ url: String(url), init });
    return input.respond(callIndex, String(url), init);
  };
}

test("Model Studio goal stage routes to Singapore workspace URL with exact attribution", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-routing-goal-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  const calls: FetchCall[] = [];
  try {
    const context = await assembleRoutingContext(dir);
    const goal = await runSocialCycleGoalProvider({
      providerId: PROVIDER_ID,
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-routing-goal",
      context,
      allowedActionSkillIds: [],
      allowedPrimitiveIds: ["observe", "wait", "remember"],
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: trackingFetch({
          calls,
          respond: async () =>
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
        })
      }),
      runId: "run-routing-goal"
    });

    assert.equal(goal.ok, true);
    assert.equal(calls.length, 1);
    assertModelStudioRequest(calls[0]!);

    const ledger = await ledgerRows(ledgerPath);
    assert.equal(ledger.length, 1);
    assertUsageAttribution(ledger[0], "goal_mind");

    const snapshot = await readSnapshot(goal.ok ? goal.outputRef : "");
    assert.equal(rawReasoning(snapshot), SENTINEL_REASONING);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio deliberation stage routes to Singapore workspace URL with exact attribution", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-routing-deliberation-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  const calls: FetchCall[] = [];
  try {
    const context = await assembleRoutingContext(dir);
    const deliberation = await runSocialDeliberationProvider({
      providerId: PROVIDER_ID,
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-routing-deliberation",
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
        fetchImpl: trackingFetch({
          calls,
          respond: async () =>
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
        })
      }),
      runId: "run-routing-deliberation"
    });

    assert.equal(deliberation.ok, true);
    assert.equal(calls.length, 1);
    assertModelStudioRequest(calls[0]!);

    const ledger = await ledgerRows(ledgerPath);
    assert.equal(ledger.length, 1);
    assertUsageAttribution(ledger[0], "deliberation");

    const snapshot = await readSnapshot(deliberation.ok ? deliberation.outputRef : "");
    assert.equal(rawReasoning(snapshot), SENTINEL_REASONING);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio Actor Turn use_existing_action routes without fallback network", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-routing-existing-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  const calls: FetchCall[] = [];
  try {
    const { actorTurnInput, actionCardProjection } = observeActorTurnFixtures();
    const actorTurn = await runSocialActorTurnProvider({
      providerId: PROVIDER_ID,
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-routing-existing",
      cycleGoalId: "cycle-goal-1",
      actorTurnInput,
      actionCardProjection,
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: trackingFetch({
          calls,
          respond: async () =>
            chatToolResponse({
              name: "action_card_001_observe",
              args: observeToolArgs()
            })
        })
      }),
      runId: "run-routing-existing"
    });

    assert.equal(actorTurn.ok, true);
    assert.equal(calls.length, 1);
    assertModelStudioRequest(calls[0]!);

    const ledger = await ledgerRows(ledgerPath);
    assert.equal(ledger.length, 1);
    assertUsageAttribution(ledger[0], "actor_turn_tool_selection");

    const snapshot = await readSnapshot(actorTurn.ok ? actorTurn.outputRef : "");
    assert.equal(rawReasoning(snapshot), SENTINEL_REASONING);
    assert.equal(
      (
        snapshot.parsed_output as {
          raw_provider_output?: {
            response?: { choices?: Array<{ message?: { reasoning_content?: string } }> };
          };
        }
      ).raw_provider_output?.response?.choices?.[0]?.message?.reasoning_content,
      SENTINEL_REASONING
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio author_mineflayer_action to codegen uses two mocks and preserves both sentinels", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-routing-author-codegen-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  const calls: FetchCall[] = [];
  try {
    const { actorTurnInput, actionCardProjection } = observeActorTurnFixtures();
    const actorTurn = await runSocialActorTurnProvider({
      providerId: PROVIDER_ID,
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      cycleId: "cycle-routing-author",
      cycleGoalId: "cycle-goal-1",
      actorTurnInput: {
        ...actorTurnInput,
        turn_id: "turn-routing-author"
      },
      actionCardProjection,
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: trackingFetch({
          calls,
          respond: async (callIndex) => {
            if (callIndex === 0) {
              return chatToolResponse({
                name: "author_mineflayer_action",
                args: authorToolArgs(),
                reasoning: OUTER_SENTINEL
              });
            }
            return chatJsonResponse(validCodegenBody(), CODEGEN_SENTINEL);
          }
        })
      }),
      runId: "run-routing-author"
    });

    assert.equal(actorTurn.ok, true);
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assertModelStudioRequest(call);
    }

    const ledger = await ledgerRows(ledgerPath);
    assert.equal(ledger.length, 2);
    assertUsageAttribution(ledger[0], "actor_turn_tool_selection");
    assertUsageAttribution(ledger[1], "mineflayer_codegen");

    const outerSnapshot = await readSnapshot(actorTurn.ok ? actorTurn.outputRef : "");
    assert.equal(rawReasoning(outerSnapshot), OUTER_SENTINEL);
    assert.equal(
      (
        outerSnapshot.parsed_output as {
          raw_provider_output?: {
            response?: { choices?: Array<{ message?: { reasoning_content?: string } }> };
          };
        }
      ).raw_provider_output?.response?.choices?.[0]?.message?.reasoning_content,
      OUTER_SENTINEL
    );

    assert.ok(actorTurn.ok);
    const codegenOutputRefs = actorTurn.intermediateOutputRefs ?? [];
    assert.equal(codegenOutputRefs.length, 1);
    const codegenSnapshot = await readSnapshot(codegenOutputRefs[0]!);
    assert.equal(rawReasoning(codegenSnapshot), CODEGEN_SENTINEL);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Model Studio mineflayer codegen stage export routes with exact attribution", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "model-studio-routing-codegen-"));
  const ledgerPath = path.join(dir, "ledger.jsonl");
  const calls: FetchCall[] = [];
  try {
    const { actorTurnInput } = observeActorTurnFixtures();
    const codegen = await runMineflayerCodegenProvider({
      providerId: PROVIDER_ID,
      actorWorkspaceRootDir: dir,
      actorId: "npc_b",
      actorTurnInput: {
        ...actorTurnInput,
        turn_id: "turn-routing-codegen"
      },
      rawOuterToolCall: {
        type: "function_call",
        name: "author_mineflayer_action",
        call_id: "call-author-codegen",
        arguments: JSON.stringify(authorToolArgs())
      },
      parsedAuthorToolArgs: authorToolArgs(),
      modelStudio: modelStudioConfig({
        dir,
        ledgerPath,
        fetchImpl: trackingFetch({
          calls,
          respond: async () => chatJsonResponse(validCodegenBody(), CODEGEN_SENTINEL)
        })
      }),
      runId: "run-routing-codegen",
      snapshotId: "codegen-routing"
    });

    assert.equal(codegen.ok, true);
    assert.equal(calls.length, 1);
    assertModelStudioRequest(calls[0]!);

    const ledger = await ledgerRows(ledgerPath);
    assert.equal(ledger.length, 1);
    assertUsageAttribution(ledger[0], "mineflayer_codegen");

    const snapshot = await readSnapshot(codegen.ok ? codegen.outputRef : "");
    assert.equal(rawReasoning(snapshot), CODEGEN_SENTINEL);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
