import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

import * as mineflayer from "mineflayer";
import * as mc from "minecraft-protocol";
import type { Bot } from "mineflayer";

import { loadMutualProbeConfig } from "../config.js";
import { loadOpenAICodexAuth } from "./openaiCodexAuth.js";
import { actors, names } from "./skillVillage/actors.js";
import { addBudget, budgets, logBudgetSummary } from "./skillVillage/budget.js";
import { buildActorInput, rememberActorExchange, rememberActorFeedback, resetActorConversations } from "./skillVillage/conversation.js";
import { mineflayerAffordancePrompt, skillVillageInstructions } from "./skillVillage/mineflayerPrompt.js";
import {
  loadAgentMemories,
  remember,
  rememberPublicToolResult,
  rememberPublicUtterance
} from "./skillVillage/memory.js";
import { diffObservations, observeActor } from "./skillVillage/observation.js";
import { summarizeResult } from "./skillVillage/result.js";
import { flushTracing, startTracing, traceGeneration } from "./skillVillage/tracing.js";
import type { ActorId, BotRecord, CodexInputMessage, HelperEvent, SeedSkill, SkillContext, SkillProposal } from "./skillVillage/types.js";

const config = loadMutualProbeConfig();
const projectName = "skill-village-manual";
const composeFile = config.composeFile;
const composeDir = path.dirname(composeFile);
const dataDir = path.resolve(composeDir, "tmp/skill-village-server");
const skillDir = path.resolve(composeDir, "../build/generated-skills");
const memoryDir = path.resolve(composeDir, "../build/agent-memory");

function loadActiveActors() {
  const requested = process.env.NPC_ACTIVE_ACTORS?.split(",")
    .map((value) => value.trim())
    .filter((value): value is ActorId => actors.includes(value as ActorId));

  return requested?.length ? requested : actors;
}

const seedSkills: SeedSkill[] = [
  {
    name: "look_at_nearest_entity",
    description: "Look at the nearest visible entity to acknowledge nearby people or animals.",
    async run(ctx) {
      await ctx.lookAtNearestEntity();
      return { status: "looked" };
    }
  },
  {
    name: "step_forward_briefly",
    description: "Walk forward for a short bounded moment, then stop.",
    async run(ctx) {
      await ctx.moveForward(700);
      return { status: "moved_forward" };
    }
  },
  {
    name: "hop_in_place",
    description: "Jump once in place to create a visible non-verbal action.",
    async run(ctx) {
      ctx.bot.setControlState("jump", true);
      await ctx.wait(250);
      ctx.bot.setControlState("jump", false);
      return { status: "jumped" };
    }
  },
  {
    name: "inspect_inventory",
    description: "Check the bot inventory and report item names and counts.",
    async run(ctx) {
      return {
        status: "inspected_inventory",
        items: ctx.inspectInventory()
      };
    }
  },
  {
    name: "scan_nearby_entities",
    description: "List nearby players, animals, villagers, or dropped items with rough distances.",
    async run(ctx) {
      return {
        status: "scanned_entities",
        entities: ctx.scanNearbyEntities()
      };
    }
  },
  {
    name: "scan_nearby_blocks",
    description: "Sample nearby non-air blocks to understand local terrain and village resources.",
    async run(ctx) {
      return {
        status: "scanned_blocks",
        blocks: ctx.scanNearbyBlocks()
      };
    }
  },
  {
    name: "find_nearest_resource_block",
    description: "Find the closest useful nearby block such as grass, dirt, wood, hay, chest, bed, or crafting table.",
    async run(ctx) {
      return {
        status: "resource_block_checked",
        block: ctx.findNearestBlock([
          "oak_log",
          "birch_log",
          "spruce_log",
          "hay_block",
          "chest",
          "crafting_table",
          "furnace",
          "bed",
          "dirt",
          "grass_block"
        ])
      };
    }
  },
  {
    name: "dig_nearest_soft_block",
    description: "Dig one nearby soft block such as dirt or grass as a visible resource-gathering attempt.",
    async run(ctx) {
      return ctx.digNearestBlock(["dirt", "grass_block"]);
    }
  },
  {
    name: "approach_nearest_animal",
    description: "Approach a nearby passive animal or villager-like entity for survival scouting.",
    async run(ctx) {
      return ctx.approachNearestEntityByName("sheep", 1_200);
    }
  },
  {
    name: "collect_nearby_dropped_item",
    description: "Move toward the closest dropped item entity for a short bounded time.",
    async run(ctx) {
      return ctx.collectNearbyDroppedItem(1_200);
    }
  },
  {
    name: "approach_nearest_actor",
    description: "Face and briefly approach the nearest other NPC to coordinate or compete.",
    async run(ctx) {
      const other = (["npc_a", "npc_b", "npc_c"] as ActorId[])
        .filter((id) => id in ctx.bots && ctx.bots[id] !== ctx.bot)
        .sort((a, b) =>
          ctx.bot.entity.position.distanceTo(ctx.bots[a].entity.position) -
          ctx.bot.entity.position.distanceTo(ctx.bots[b].entity.position)
        )[0];
      if (!other) return { status: "no_actor" };
      await ctx.faceActor(other);
      await ctx.moveTowardActor(other, 700);
      return { status: "approached", actorId: other };
    }
  },
  {
    name: "turn_slowly",
    description: "Turn the bot's view a little to scan the flat area.",
    async run(ctx) {
      await ctx.bot.look(ctx.bot.entity.yaw + Math.PI / 3, ctx.bot.entity.pitch, true);
      return { status: "turned" };
    }
  }
];

function env() {
  return {
    ...process.env,
    COMPOSE_PROJECT_NAME: projectName,
    MC_IMAGE: "itzg/minecraft-server:java21",
    MC_DATA_DIR: dataDir,
    EULA: "TRUE",
    VERSION: config.server.version,
    TYPE: "VANILLA",
    ONLINE_MODE: "FALSE",
    MODE: "survival",
    DIFFICULTY: "peaceful",
    LEVEL_TYPE: "FLAT",
    GENERATE_STRUCTURES: "true",
    SPAWN_NPCS: "true",
    SPAWN_ANIMALS: "true",
    SPAWN_MONSTERS: "false",
    VIEW_DISTANCE: "8",
    SIMULATION_DISTANCE: "8",
    ENABLE_COMMAND_BLOCK: "true"
  };
}

function run(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: composeDir,
      env: env(),
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error([stderr.trim(), stdout.trim()].filter(Boolean).join("\n")));
      }
    });
  });
}

async function startServer() {
  await mkdir(dataDir, { recursive: true });
  await run("docker", ["compose", "-f", composeFile, "down", "-v"]).catch(() => "");
  await run("docker", ["compose", "-f", composeFile, "up", "-d"]);
  const endpoint = await run("docker", ["compose", "-f", composeFile, "port", "mc", "25565"]);
  const [, rawPort] = endpoint.match(/:(\d+)$/) ?? [];
  const port = Number(rawPort);
  if (!Number.isInteger(port)) {
    throw new Error(`Unable to parse Minecraft port: ${endpoint}`);
  }

  const deadline = Date.now() + config.server.pingTimeoutMs;
  while (Date.now() < deadline) {
    try {
      await mc.ping({
        host: "127.0.0.1",
        port,
        version: config.server.version,
        closeTimeout: 5_000,
        noPongTimeout: 5_000
      });
      return { host: "127.0.0.1", port };
    } catch {
      await wait(1_000);
    }
  }

  throw new Error("Minecraft server was not ready before timeout");
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createBot(username: string, port: number) {
  return mineflayer.createBot({
    host: "127.0.0.1",
    port,
    username,
    auth: "offline",
    version: config.server.version,
    viewDistance: "tiny"
  });
}

function waitForSpawn(bot: Bot) {
  return new Promise<void>((resolve, reject) => {
    bot.once("spawn", () => resolve());
    bot.once("error", reject);
  });
}

async function createThreeBots(port: number): Promise<BotRecord> {
  const npcA = createBot("npc_a", port);
  await waitForSpawn(npcA);
  const npcB = createBot("npc_b", port);
  await waitForSpawn(npcB);
  const npcC = createBot("npc_c", port);
  await waitForSpawn(npcC);
  return { npc_a: npcA, npc_b: npcB, npc_c: npcC };
}

async function teleportBotsToRequestedSpawn(bots: BotRecord) {
  const x = Number(process.env.NPC_SPAWN_X);
  const y = Number(process.env.NPC_SPAWN_Y);
  const z = Number(process.env.NPC_SPAWN_Z);

  if (![x, y, z].every(Number.isFinite)) {
    return;
  }

  const offsets: Record<ActorId, [number, number, number]> = {
    npc_a: [0, 0, 0],
    npc_b: [1.4, 0, 0],
    npc_c: [-1.4, 0, -1.3]
  };

  await Promise.all(
    actors.map(async (actorId) => {
      const [dx, dy, dz] = offsets[actorId];
      await run("docker", [
        "exec",
        "skill-village-manual-mc-1",
        "rcon-cli",
        `tp ${bots[actorId].username} ${x + dx} ${y + dy} ${z + dz}`
      ]).catch((error: unknown) => {
        console.warn(`teleport skipped for ${actorId}: ${error instanceof Error ? error.message : String(error)}`);
      });
    })
  );
  await wait(1_000);
}

async function loadSkillMemory() {
  await mkdir(skillDir, { recursive: true });
  const files = await readdir(skillDir).catch(() => []);
  const generated = await Promise.all(
    files
      .filter((file) => file.endsWith(".ts"))
      .slice(-8)
      .map(async (file) => {
        const code = await readFile(path.join(skillDir, file), "utf8");
        const firstLines = code.split(/\r?\n/).slice(0, 10).join("\n");
        return { file, firstLines };
      })
  );

  return {
    seedSkills: seedSkills.map(({ name, description }) => ({ name, description })),
    recentGeneratedSkills: generated
  };
}

async function proposalPrompt(actorId: ActorId, bots: BotRecord) {
  return [
    JSON.stringify({
      kind: "npc_turn_update",
      actor: observeActor(actorId, bots),
      availableContextHelpers: [
        "ctx.wait(ms)",
        "ctx.moveForward(ms)",
        "ctx.stop()",
        "ctx.lookAtNearestEntity()",
        "ctx.faceActor(actorId)",
        "ctx.moveTowardActor(actorId, ms)",
        "ctx.inspectInventory()",
        "ctx.scanNearbyEntities()",
        "ctx.scanNearbyBlocks()",
        "ctx.findNearestBlock(names) returns a value synchronously",
        "ctx.digNearestBlock(names)",
        "ctx.approachNearestEntityByName(name, ms)",
        "ctx.collectNearbyDroppedItem(ms)",
        "ctx.runSkill(name)",
        "ctx.say(text)"
      ],
      mineflayerAffordancePrompt,
      skillMemory: await loadSkillMemory()
    })
  ].join("\n");
}

function toLangfuseChat(instructions: string, input: CodexInputMessage[]) {
  return [
    { role: "system", content: instructions },
    ...input.map((message) => ({
      role: message.role,
      content: message.content.map((part) => part.text).join("\n\n")
    }))
  ];
}

async function requestProposal(actorId: ActorId, bots: BotRecord): Promise<SkillProposal> {
  const auth = await loadOpenAICodexAuth(config.liveDialogue.authStorePath);
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["actorId", "utterance", "skillName", "skillDescription", "skillCode"],
    properties: {
      actorId: { type: "string", enum: actors },
      utterance: { type: "string" },
      skillName: { type: "string" },
      skillDescription: { type: "string" },
      skillCode: { type: "string" }
    }
  };

  const promptText = await proposalPrompt(actorId, bots);
  const instructions = skillVillageInstructions;
  const input = buildActorInput(actorId, promptText);
  const requestBody = {
    model: "gpt-5.4-mini",
    instructions,
    input,
    text: { format: { type: "json_schema", name: "minecraft_ts_skill", schema, strict: true } },
    reasoning: { effort: "low" },
    stream: true,
    store: false
  };
  const outputText = await traceGeneration(
    "openai-codex-skill-proposal",
    toLangfuseChat(instructions, input),
    { actorId, provider: "openai-codex", responseFormat: "minecraft_ts_skill" },
    async () => {
      const response = await fetch("https://chatgpt.com/backend-api/codex/responses", {
        method: "POST",
        headers: {
          authorization: `Bearer ${auth.accessToken}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Codex skill proposal failed ${response.status}: ${(await response.text()).slice(0, 500)}`);
      }

      return readStreamText(await response.text());
    }
  );
  addBudget(actorId, JSON.stringify({ instructions, input }), outputText);
  const proposal = JSON.parse(outputText) as SkillProposal;
  rememberActorExchange(actorId, promptText, JSON.stringify({
    actorId: proposal.actorId,
    utterance: proposal.utterance,
    skillName: proposal.skillName,
    skillDescription: proposal.skillDescription
  }));
  return proposal;
}

function readStreamText(payload: string) {
  let text = "";
  for (const rawLine of payload.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) continue;
    const data = line.slice("data:".length).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const event = JSON.parse(data) as {
        delta?: string;
        item?: { content?: { text?: string } };
        content?: { text?: string };
        response?: { output?: Array<{ content?: Array<{ text?: string }> }> };
      };
      if (typeof event.delta === "string") text += event.delta;
      const contentText = event.item?.content?.text ?? event.content?.text;
      if (!text && contentText) text = contentText;
      const completedText = event.response?.output
        ?.flatMap((item) => item.content ?? [])
        .map((content) => content.text ?? "")
        .join("");
      if (!text && completedText) text = completedText;
    } catch {
      // Ignore non-JSON stream lines.
    }
  }
  if (!text.trim()) throw new Error("Codex stream response missing output text");
  return text.trim();
}

function assertSkillCodeSafe(code: string) {
  const blocked = /\b(import|require|process|Bun|Deno|eval|Function|while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)|child_process|fs|net|http)\b/;
  if (blocked.test(code)) {
    throw new Error("Generated skill contains a blocked API or unbounded loop");
  }
  if (!code.includes("export async function run")) {
    throw new Error("Generated skill must export async function run(ctx)");
  }
}

async function executeSkill(actorId: ActorId, bots: BotRecord, proposal: SkillProposal) {
  assertSkillCodeSafe(proposal.skillCode);
  await mkdir(skillDir, { recursive: true });
  const filePath = path.join(skillDir, `${Date.now()}-${actorId}-${proposal.skillName.replace(/[^a-zA-Z0-9_-]/g, "_")}.ts`);
  await writeFile(filePath, proposal.skillCode);

  const moduleUrl = `${pathToFileURL(filePath).href}?t=${Date.now()}`;
  const skill = (await import(moduleUrl)) as { run(ctx: unknown): Promise<unknown> };
  const bot = bots[actorId];
  const preObservation = observeActor(actorId, bots);
  const helperEvents: HelperEvent[] = [];
  let ctx: SkillContext;
  const runSeedSkill = async (name: string): Promise<unknown> => {
    const seed = seedSkills.find((skill) => skill.name === name);
    if (!seed) {
      throw new Error(`Unknown seed skill: ${name}`);
    }

    return seed.run(ctx);
  };

  ctx = withHelperLogging({
    bot,
    bots,
    say(text: string) {
      bot.chat(text);
    },
    wait,
    async moveForward(ms = 800) {
      bot.setControlState("forward", true);
      await wait(Math.min(Math.max(ms, 100), 6_000));
      bot.setControlState("forward", false);
    },
    stop() {
      bot.clearControlStates();
    },
    async lookAtNearestEntity() {
      const nearest = bot.nearestEntity((entity) => entity !== bot.entity);
      if (nearest) await bot.lookAt(nearest.position.offset(0, 1, 0));
    },
    async faceActor(targetActorId: ActorId) {
      const target = bots[targetActorId];
      if (!target) return;
      await bot.lookAt(target.entity.position.offset(0, 1, 0));
    },
    async moveTowardActor(targetActorId: ActorId, ms = 800) {
      await this.faceActor(targetActorId);
      await this.moveForward(ms);
    },
    inspectInventory() {
      return bot.inventory.items().map((item) => ({
        name: item.name,
        count: item.count
      }));
    },
    scanNearbyEntities() {
      return Object.values(bot.entities)
        .filter((entity) => entity !== bot.entity)
        .map((entity) => ({
          name: entity.name ?? "unknown",
          ...(entity.username ? { username: entity.username } : {}),
          type: entity.type,
          distance: Number(bot.entity.position.distanceTo(entity.position).toFixed(1))
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 12);
    },
    scanNearbyBlocks() {
      const blocks = bot.findBlocks({
        matching: (block) => block.name !== "air" && block.name !== "void_air",
        maxDistance: 16,
        count: 24
      });
      return blocks
        .map((position) => {
          const block = bot.blockAt(position);
          return {
            name: block?.name ?? "unknown",
            distance: Number(bot.entity.position.distanceTo(position).toFixed(1))
          };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 12);
    },
    findNearestBlock(names: string[]) {
      const block = bot.findBlock({
        matching: (candidate) => names.includes(candidate.name),
        maxDistance: 24
      });

      if (!block) {
        return null;
      }

      return {
        name: block.name,
        distance: Number(bot.entity.position.distanceTo(block.position).toFixed(1))
      };
    },
    async digNearestBlock(names: string[]) {
      const block = bot.findBlock({
        matching: (candidate) => names.includes(candidate.name),
        maxDistance: 5
      });

      if (!block) {
        return { status: "no_block", names };
      }

      await bot.dig(block);
      return { status: "dug", block: block.name };
    },
    async approachNearestEntityByName(name: string, ms = 1_200) {
      const entity = bot.nearestEntity((candidate) => candidate.name === name);
      if (!entity) {
        return { status: "no_entity", name };
      }

      await bot.lookAt(entity.position.offset(0, 1, 0));
      await this.moveForward(ms);
      return { status: "approached_entity", name };
    },
    async collectNearbyDroppedItem(ms = 1_200) {
      const entity = bot.nearestEntity((candidate) => candidate.name === "item");
      if (!entity) {
        return { status: "no_dropped_item" };
      }

      await bot.lookAt(entity.position.offset(0, 0.5, 0));
      await this.moveForward(ms);
      return { status: "approached_dropped_item" };
    },
    async runSkill(name: string) {
      return runSeedSkill(name);
    }
  }, helperEvents);

  const result = await runGeneratedSkillSafely(skill, ctx);
  bot.clearControlStates();
  const postObservation = observeActor(actorId, bots);
  return {
    filePath,
    result,
    helperEvents,
    preObservation,
    postObservation,
    diff: diffObservations(preObservation, postObservation)
  };
}

function withHelperLogging(ctx: SkillContext, helperEvents: HelperEvent[]): SkillContext {
  return new Proxy(ctx, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof property !== "string" || typeof value !== "function" || property === "constructor") {
        return value;
      }

      return (...args: unknown[]) => {
        try {
          const result = value.apply(target, args);
          if (result && typeof (result as Promise<unknown>).then === "function") {
            return (result as Promise<unknown>).then(
              (resolved) => {
                helperEvents.push({ name: property, args, result: resolved });
                return resolved;
              },
              (error) => {
                const message = error instanceof Error ? error.message : String(error);
                helperEvents.push({ name: property, args, error: message });
                throw error;
              }
            );
          }

          helperEvents.push({ name: property, args, result });
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          helperEvents.push({ name: property, args, error: message });
          throw error;
        }
      };
    }
  });
}

async function runGeneratedSkillSafely(skill: { run(ctx: unknown): Promise<unknown> }, ctx: SkillContext) {
  try {
    return await Promise.race([
      skill.run(ctx),
      wait(14_000).then(() => ({ status: "timeout" }))
    ]);
  } catch (error) {
    return {
      status: "skill_error",
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

async function main() {
  startTracing();
  resetActorConversations();
  await loadAgentMemories(memoryDir);
  const existingPort = Number(process.env.MINECRAFT_SERVER_PORT);
  const server = Number.isInteger(existingPort) && existingPort > 0
    ? { host: "127.0.0.1", port: existingPort }
    : await startServer();
  console.log(`server ${server.host}:${server.port}`);
  const bots = await createThreeBots(server.port);
  const recent: string[] = [];

  try {
    await teleportBotsToRequestedSpawn(bots);
    const activeActors = loadActiveActors();
    console.log(`bots joined: ${actors.map((id) => bots[id].username).join(", ")}`);
    console.log(`active bots: ${activeActors.map((id) => bots[id].username).join(", ")}`);
    await Promise.all(activeActors.map((actorId) => runActorLoop(actorId, bots, recent)));
  } finally {
    for (const bot of Object.values(bots)) {
      bot.quit();
    }
  }
}

async function runActorLoop(actorId: ActorId, bots: BotRecord, recent: string[]) {
  const requestedTurns = Number(process.env.NPC_TURNS);
  const turns = Number.isInteger(requestedTurns) && requestedTurns > 0
    ? Math.min(requestedTurns, 20)
    : 3;
  const initialStaggerMs = {
    npc_a: 0,
    npc_b: 900,
    npc_c: 1_800
  } satisfies Record<ActorId, number>;

  await wait(initialStaggerMs[actorId]);

  for (let turn = 0; turn < turns; turn += 1) {
    const proposal = await requestProposal(actorId, bots);
    bots[actorId].chat(proposal.utterance);
    recent.push(`${names[actorId]}: ${proposal.utterance}`);
    await rememberPublicUtterance(memoryDir, actorId, proposal.utterance);
    const execution = await executeSkill(actorId, bots, proposal);
    rememberActorFeedback(actorId, JSON.stringify({
      kind: "post_action_feedback",
      skillName: proposal.skillName,
      skillDescription: proposal.skillDescription,
      helperEvents: execution.helperEvents.slice(-12),
      skillReturn: execution.result,
      observationDiff: execution.diff,
      postObservation: execution.postObservation
    }));
    await rememberPublicToolResult(memoryDir, actorId, proposal, execution.result);
    await remember(
      memoryDir,
      actorId,
      `I ran skill ${proposal.skillName}: ${proposal.skillDescription}. Result: ${summarizeResult(execution.result)}`
    );
    console.log(`${names[actorId]} loop=${turn + 1}: ${proposal.utterance}`);
    console.log(`  selected=${proposal.skillName}: ${proposal.skillDescription}`);
    console.log(`  skill=${proposal.skillName} file=${execution.filePath}`);
    console.log(`  result=${summarizeResult(execution.result)}`);
    console.log(
      `  budget calls=${budgets[actorId].calls} inputTok~${budgets[actorId].estimatedInputTokens} outputTok~${budgets[actorId].estimatedOutputTokens} cost~$${budgets[actorId].estimatedCostUsd.toFixed(5)}`
    );
    await wait(500 + Math.floor(Math.random() * 700));
  }
}

try {
  await main();
} finally {
  logBudgetSummary();
  await flushTracing();
}
