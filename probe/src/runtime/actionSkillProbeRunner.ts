import type { SeedActionSkillId } from "../gameplay/seedSkills/registry.js";
import { getSeedActionSkill } from "../gameplay/seedSkills/registry.js";
import {
  getActionSkillVerificationContract,
  type ActionSkillVerificationContract
} from "../gameplay/seedSkills/verificationContracts.js";
import type { ActorActionSkillRecord } from "./actorWorkspaceStore.js";
import type { AllowedTool } from "../tools/index.js";
import { validateProposal } from "../tools/index.js";
import type { RoleId } from "../npc/roles/contracts.js";
import type { ProbeConfig } from "../config.js";
import { loadProbeConfig } from "../config.js";
import { createDeterministicProvider } from "../provider/deterministicProvider.js";
import { createOpenAICodexGameplayProvider } from "../provider/openaiCodexGameplayProvider.js";
import { loadOpenAICodexAuth } from "../mutual/openaiCodexAuth.js";
import { createBots, closeBots, type ProbeBots } from "./createBots.js";
import { createDialogueState } from "./dialogueState.js";
import { createMemory } from "./memory.js";
import { createTranscript } from "./transcript.js";
import { runAgentLoop } from "./agentLoop.js";
import { withActionWrapper } from "../mutual/tools/wrapper.js";
import { moveTo } from "../tools/moveTo.js";
import { observe } from "../tools/observe.js";
import { remember } from "../tools/remember.js";
import { say } from "../tools/say.js";
import { wait } from "../tools/wait.js";
import { collectLogs } from "../tools/collectLogs.js";
import { craftItem } from "../tools/craftItem.js";
import { getRoleContract } from "../npc/roles/contracts.js";
import { createSharedStorageLedger } from "../gameplay/storage/sharedStorageLedger.js";
import { createTeamBulletin } from "../npc/social/teamBulletin.js";
import { createSharedSettlementState } from "../memory/shared/sharedSettlementState.js";
import {
  depositToSharedChest,
  inspectChest,
  withdrawFromSharedChest
} from "../tools/sharedChest.js";
import { createMineflayerSharedChestAccessor } from "../tools/liveSharedChest.js";
import {
  buildLiveSmokeServerContext,
  ensureLiveSmokeServer
} from "../server/liveSmokeServer.js";

export type ActionSkillProbeConfig = {
  actorId: string;
  skillId: SeedActionSkillId;
  roleId: RoleId;
  maxActions: number;
};

export type ActionSkillProbeResult = {
  status: "passed" | "failed" | "error";
  skillId: SeedActionSkillId;
  actorId: string;
  contract: ActionSkillVerificationContract;
  /** Primitives allowed through the narrowed gate. */
  allowedPrimitives: AllowedTool[];
  transcriptPath?: string;
  finalWhy?: string;
  /** Non-zero only when status is "error". */
  errorMessage?: string;
};

type ServerEndpoint = {
  host: string;
  port: number;
  stop(): Promise<void>;
};

type ObserveActor = Parameters<typeof observe>[0]["actor"];

const probeCompletedTaskHints: Partial<Record<SeedActionSkillId, string[]>> = {
  craftPlanksAndSticks: ["collect_4_logs"],
  craftCraftingTable: ["collect_4_logs", "craft_planks_and_sticks"]
};

function asObserveActor(bot: import("mineflayer").Bot): ObserveActor {
  return bot as unknown as ObserveActor;
}

function readStringArg(args: Record<string, unknown>, name: string) {
  const value = args[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected non-empty string arg: ${name}`);
  }

  return value;
}

function readTicksArg(args: Record<string, unknown>) {
  const value = args.ticks;

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("Expected non-negative integer arg: ticks");
  }

  return value;
}

function readOptionalPositiveIntegerArg(args: Record<string, unknown>, name: string) {
  const value = args[name];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Expected positive integer arg: ${name}`);
  }

  return value;
}

function assertTarget(targetId: string, expectedTargetId: string) {
  if (targetId !== expectedTargetId) {
    throw new Error(`Unsupported target: ${targetId}`);
  }
}

function needsSeparateTarget(skillId: SeedActionSkillId) {
  const skill = getSeedActionSkill(skillId);
  return skill.primitiveIds.some((primitive) => primitive === "move_to" || primitive === "say");
}

function buildProbeConfig(input: ActionSkillProbeConfig, baseConfig = loadProbeConfig()): ProbeConfig {
  const targetActorId = needsSeparateTarget(input.skillId) ? `${input.actorId}_target` : input.actorId;
  const bots =
    targetActorId === input.actorId
      ? [input.actorId]
      : [input.actorId, targetActorId];

  return {
    ...baseConfig,
    probeId: `action_skill_probe_${input.skillId}`,
    bots
  };
}

async function ensureProbeServer(config: ProbeConfig): Promise<{
  server: ServerEndpoint;
  rconContext?: ReturnType<typeof buildLiveSmokeServerContext>;
}> {
  if (process.env.MC_PORT && process.env.MC_PORT.trim().length > 0) {
    const port = Number(process.env.MC_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
      throw new Error(`MC_PORT must be an integer between 1 and 65535, got: ${process.env.MC_PORT}`);
    }

    return {
      server: {
        host: "127.0.0.1",
        port,
        stop: async () => {}
      }
    };
  }

  const liveSmokeServer = await ensureLiveSmokeServer(config);
  if (!liveSmokeServer.host || !liveSmokeServer.port) {
    throw new Error("Live smoke server did not return a joinable endpoint");
  }

  return {
    server: {
      host: liveSmokeServer.host,
      port: liveSmokeServer.port,
      stop: async () => {}
    },
    rconContext: buildLiveSmokeServerContext(config)
  };
}

async function teleportProbeBotsToSpawn(
  bots: ProbeBots,
  spawnConfig: { x: number; y: number; z: number },
  skillId: SeedActionSkillId,
  rcon?: ReturnType<typeof buildLiveSmokeServerContext>
) {
  if (!rcon) {
    return;
  }

  const { execFile } = await import("node:child_process");
  const util = await import("node:util");
  const execFileAsync = util.promisify(execFile);
  const runRcon = async (args: string[]) => {
    await execFileAsync(
      "docker",
      ["compose", "-f", rcon.composeFile, "exec", "-T", "mc", "rcon-cli", "--", ...args],
      {
        cwd: rcon.composeDir,
        env: rcon.env
      }
    );
  };

  const offsets = [
    [0, 0, 0],
    [2, 0, 0]
  ];
  const actorIds = Object.keys(bots);

  await Promise.allSettled([
    runRcon([
      "setworldspawn",
      String(Math.floor(spawnConfig.x)),
      String(Math.floor(spawnConfig.y)),
      String(Math.floor(spawnConfig.z))
    ]),
    ...actorIds.map((actorId, index) => {
      const [dx, dy, dz] = offsets[index] ?? [0, 0, 0];
      return runRcon([
        "tp",
        bots[actorId].username,
        String(spawnConfig.x + dx),
        String(spawnConfig.y + dy),
        String(spawnConfig.z + dz)
      ]);
    })
  ]);

  await Promise.allSettled(
    actorIds.map((actorId) => runRcon(["clear", bots[actorId].username]))
  );

  if (skillId === "collectLogs") {
    const baseX = Math.floor(spawnConfig.x) + 3;
    const y = Math.floor(spawnConfig.y);
    const z = Math.floor(spawnConfig.z) - 3;

    // The collectLogs live probe owns a tiny repeatable tree fixture. Relying
    // on natural spawn trees makes repeated probes deplete the world and turns
    // later failures into setup noise instead of action-skill evidence.
    await Promise.allSettled(
      Array.from({ length: 4 }, (_, index) =>
        runRcon(["setblock", String(baseX + index), String(y), String(z), "oak_log"])
      )
    );
  }

  await new Promise((resolve) => setTimeout(resolve, skillId === "collectLogs" ? 3000 : 1500));
}

/**
 * Builds a minimal set of active action skill records that restricts the
 * runtime gate to only the primitives required by the target skill.
 *
 * The runner creates a synthetic active record so the existing agentLoop gate
 * can be reused without modification. This keeps the probe narrow: the actor
 * can only use primitives declared by the skill under test.
 */
export function buildSkillProbeActionSkillRecords(
  config: ActionSkillProbeConfig
): ActorActionSkillRecord[] {
  const skill = getSeedActionSkill(config.skillId);

  if (skill.runtimeStatus !== "implemented") {
    throw new Error(
      `Cannot probe skill ${config.skillId}: runtime status is "${skill.runtimeStatus}", not "implemented"`
    );
  }

  if (!skill.validRoles.includes(config.roleId)) {
    throw new Error(
      `Skill ${config.skillId} is not valid for role "${config.roleId}". Valid roles: ${skill.validRoles.join(", ")}`
    );
  }

  const now = new Date().toISOString();

  return [
    {
      schema: "actor-action-skill/v1",
      skill_id: config.skillId,
      owner_actor_id: config.actorId,
      source_kind: "seed",
      status: "active",
      created_at: now,
      updated_at: now,
      required_primitives: [...skill.primitiveIds],
      preconditions: [...skill.preconditions],
      success_verifier: `runtime verifier for ${config.skillId}`,
      known_failure_modes: [],
      evidence_refs: [],
      review_refs: [],
      notes: `Skill probe synthetic record for ${config.skillId}`
    },
    // Always include the runtimeObserveAndRemember skill so the agent can
    // terminate the loop with remember and observe state.
    ...(config.skillId !== "runtimeObserveAndRemember"
      ? [
          {
            schema: "actor-action-skill/v1" as const,
            skill_id: "runtimeObserveAndRemember",
            owner_actor_id: config.actorId,
            source_kind: "seed" as const,
            status: "active" as const,
            created_at: now,
            updated_at: now,
            required_primitives: ["observe", "wait", "remember"],
            preconditions: [],
            success_verifier: "runtime verifier for runtimeObserveAndRemember",
            known_failure_modes: [],
            evidence_refs: [],
            review_refs: [],
            notes: "Baseline control bundle for skill probe"
          }
        ]
      : [])
  ];
}

/**
 * Loads the verification contract for the skill and returns the allowed
 * primitive set. Use this to validate probe results after execution.
 */
export function loadSkillProbeContract(skillId: SeedActionSkillId): {
  contract: ActionSkillVerificationContract;
  allowedPrimitives: AllowedTool[];
} {
  const contract = getActionSkillVerificationContract(skillId);
  const allowedPrimitives = [...contract.primitiveIds] as AllowedTool[];

  // Ensure observe, wait, remember are always available.
  for (const baseline of ["observe", "wait", "remember"] as AllowedTool[]) {
    if (!allowedPrimitives.includes(baseline)) {
      allowedPrimitives.push(baseline);
    }
  }

  return { contract, allowedPrimitives };
}

/**
 * Validates the probe config before execution. Throws for invalid or
 * unimplemented skill requests.
 */
export function validateSkillProbeConfig(config: ActionSkillProbeConfig): void {
  if (!config.actorId || config.actorId.trim().length === 0) {
    throw new Error("--actor is required");
  }

  if (!config.skillId || config.skillId.trim().length === 0) {
    throw new Error("--skill is required");
  }

  // getSeedActionSkill throws for unknown skills
  const skill = getSeedActionSkill(config.skillId);

  if (skill.runtimeStatus !== "implemented") {
    throw new Error(
      `Skill "${config.skillId}" is planned but not implemented. ` +
      `Missing primitives: ${skill.missingPrimitives?.join(", ") ?? "unknown"}`
    );
  }

  if (config.maxActions < 1) {
    throw new Error("--max-actions must be at least 1");
  }
}

/**
 * Runs one action skill through the real Mineflayer agent loop with a narrowed
 * active-action-skill gate. This is the live harness from the handoff: it
 * creates evidence from actual bot state and fails when the loop cannot reach a
 * runtime-verifiable terminal result within the configured action budget.
 */
export async function runLiveActionSkillProbe(
  input: ActionSkillProbeConfig
): Promise<ActionSkillProbeResult> {
  validateSkillProbeConfig(input);

  const { contract, allowedPrimitives } = loadSkillProbeContract(input.skillId);
  const activeActionSkills = buildSkillProbeActionSkillRecords(input);
  const config = buildProbeConfig(input);
  const gameplayAuth =
    config.gameplayProvider.providerId === "openai-codex"
      ? await loadOpenAICodexAuth(config.liveDialogue.authStorePath)
      : null;
  let server: ServerEndpoint | null = null;
  let bots: ProbeBots | null = null;

  try {
    const serverContext = await ensureProbeServer(config);
    server = serverContext.server;
    console.log(`minecraft_direct_connect=${server.host}:${server.port}`);

    bots = await createBots(config, {
      host: server.host,
      port: server.port
    });
    await teleportProbeBotsToSpawn(bots, config.spawn, input.skillId, serverContext.rconContext);

    const actor = bots[input.actorId];
    const target = bots[Object.keys(bots).find((actorId) => actorId !== input.actorId) ?? input.actorId];
    if (!actor || !target) {
      throw new Error(`Probe bot roster did not contain actor ${input.actorId}`);
    }

    const memory = createMemory(config.memoryLimit);
    const dialogueState = createDialogueState({
      busyRepliesBeforeAvailable: config.dialogue.busyRepliesBeforeAvailable
    });
    const provider =
      config.gameplayProvider.providerId === "openai-codex"
        ? createOpenAICodexGameplayProvider({
            accessToken: gameplayAuth?.accessToken ?? "",
            model: config.gameplayProvider.model,
            reasoning: config.gameplayProvider.reasoning,
            maxRetries: config.gameplayProvider.maxRetries
          })
        : createDeterministicProvider();
    const sharedStorageLedger = createSharedStorageLedger();
    const teamBulletin = createTeamBulletin();
    const sharedSettlementState = createSharedSettlementState();
    const sharedChest = createMineflayerSharedChestAccessor(actor);
    const transcript = createTranscript({
      evidenceDir: config.evidenceDir,
      probeId: config.probeId,
      bots: Object.keys(bots),
      metadata: {
        action_skill_probe: {
          actor_id: input.actorId,
          skill_id: input.skillId,
          role_id: input.roleId,
          max_actions: input.maxActions,
          allowed_primitives: allowedPrimitives,
          verification_contract: contract
        }
      }
    });

    function readActorInventory() {
      return actor.inventory?.items().map((item) => ({
        name: item.name,
        count: item.count
      })) ?? [];
    }

    const final = await runAgentLoop({
      bots: { actor, target },
      roleId: input.roleId,
      provider,
      maxActions: input.maxActions,
      initialCompletedTaskIds: probeCompletedTaskHints[input.skillId] ?? [],
      activeActionSkills,
      artifacts: {
        actorWorkspaceRootDir: config.actorWorkspace.rootDir,
        providerInputSnapshots: {
          provider_id: config.gameplayProvider.providerId,
          model: config.gameplayProvider.model
        },
        providerOutputSnapshots: {
          provider_id: config.gameplayProvider.providerId,
          model: config.gameplayProvider.model
        }
      },
      transcript,
      tools: {
        validateProposal,
        observe: ({ actor, target }) =>
          observe({
            actor: asObserveActor(actor),
            target: asObserveActor(target),
            dialogueState,
            memory,
            sharedChest
          }),
        move_to: ({ actor, target, args }) =>
          withActionWrapper(
            () => {
              const targetId = readStringArg(args, "target");
              assertTarget(targetId, target.username);
              return moveTo({ actor, target, targetId });
            },
            { tool: "move_to" }
          ),
        collect_logs: ({ actor, args }) =>
          withActionWrapper(
            (signal) =>
              collectLogs({
                bot: actor,
                signal,
                targetCount: readOptionalPositiveIntegerArg(args, "targetCount")
              }),
            { tool: "collect_logs" }
          ),
        craft_item: ({ actor, args }) =>
          withActionWrapper(
            () => craftItem({ bot: actor, itemName: readStringArg(args, "itemName") }),
            { tool: "craft_item" }
          ),
        inspect_chest: () =>
          withActionWrapper(
            async () => {
              const result = await inspectChest({
                actorId: actor.username,
                roleId: input.roleId,
                chest: sharedChest,
                ledger: sharedStorageLedger,
                bulletin: teamBulletin,
                currentTask: getRoleContract(input.roleId).priorityList[0]
              });

              if (result.status === "inspected") {
                sharedSettlementState.rememberSharedChest(result.chestId, result.items ?? []);
              }

              return result;
            },
            { tool: "inspect_chest" }
          ),
        deposit_shared: ({ args }) =>
          withActionWrapper(
            async () => {
              const result = await depositToSharedChest({
                actorId: actor.username,
                roleId: input.roleId,
                chest: sharedChest,
                inventory: {
                  items: readActorInventory
                },
                ledger: sharedStorageLedger,
                bulletin: teamBulletin,
                itemName: readStringArg(args, "itemName"),
                count: typeof args.count === "number" ? args.count : 1,
                currentTask: "deposit_shared_materials"
              });

              sharedSettlementState.rememberSharedChest(
                result.chestId,
                sharedStorageLedger.latestChest(result.chestId) ?? []
              );

              return result;
            },
            { tool: "deposit_shared" }
          ),
        withdraw_shared: ({ args }) =>
          withActionWrapper(
            async () => {
              const result = await withdrawFromSharedChest({
                actorId: actor.username,
                roleId: input.roleId,
                chest: sharedChest,
                inventory: {
                  items: readActorInventory
                },
                ledger: sharedStorageLedger,
                bulletin: teamBulletin,
                itemName: readStringArg(args, "itemName"),
                count: typeof args.count === "number" ? args.count : 1,
                reason:
                  typeof args.reason === "string" && args.reason.length > 0
                    ? args.reason
                    : "action skill probe withdrawal",
                currentTask: getRoleContract(input.roleId).priorityList[0]
              });

              sharedSettlementState.rememberSharedChest(
                result.chestId,
                sharedStorageLedger.latestChest(result.chestId) ?? []
              );

              return result;
            },
            { tool: "withdraw_shared" }
          ),
        say: ({ actor, target, args }) =>
          withActionWrapper(
            () => {
              const targetId = readStringArg(args, "target");
              const text = readStringArg(args, "text");
              assertTarget(targetId, target.username);
              return say({ actor, target, dialogueState, text });
            },
            { tool: "say" }
          ),
        wait: ({ args }) =>
          withActionWrapper(
            () => wait({ ticks: readTicksArg(args) }),
            { tool: "wait" }
          ),
        remember: ({ args }) =>
          withActionWrapper(
            () => remember({ memory, note: readStringArg(args, "note") }),
            { tool: "remember" }
          )
      }
    });

    const transcriptPath = await transcript.write({
      status: final.status,
      why: final.why,
      action_skill_probe: {
        actor_id: input.actorId,
        skill_id: input.skillId,
        role_id: input.roleId,
        allowed_primitives: allowedPrimitives,
        verification_contract: contract
      }
    });

    return {
      status: final.status === "success" ? "passed" : "failed",
      skillId: input.skillId,
      actorId: input.actorId,
      contract,
      allowedPrimitives,
      transcriptPath,
      finalWhy: final.why
    };
  } catch (error) {
    return {
      status: "error",
      skillId: input.skillId,
      actorId: input.actorId,
      contract,
      allowedPrimitives,
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (bots) {
      await closeBots(bots);
    }
    if (server) {
      await server.stop();
    }
  }
}
