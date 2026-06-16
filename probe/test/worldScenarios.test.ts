/** Tests for named world-scenario fixtures used by live social-cycle runs. */
import assert from "node:assert/strict";
import test from "node:test";

import { buildServerEnv, loadProbeConfig } from "../src/config.js";
import {
  applyWorldScenarioToConfig,
  buildWorldScenarioCommands,
  createWorldScenarioManifest,
  getWorldScenario,
  parseWorldScenarioId,
  runWorldScenarioCommands
} from "../src/server/worldScenarios.js";
import {
  buildNaturalSpawnPlacementCommands,
  createNaturalSpawnValidation
} from "../src/server/naturalSpawnValidation.js";

test("parses and applies the roofless hut flat survival scenario", () => {
  const scenario = getWorldScenario(parseWorldScenarioId("roofless-hut-flat-survival-v1"));
  const config = applyWorldScenarioToConfig(loadProbeConfig(), scenario);
  const env = buildServerEnv(config);
  const manifest = createWorldScenarioManifest(scenario);

  assert.equal(scenario.lane, "fixture_probe");
  assert.equal(scenario.requiresFreshWorld, true);
  assert.equal(scenario.fixtureDependency, true);
  assert.equal(config.world.levelType, "FLAT");
  assert.equal(config.world.seed, "roofless-hut-flat-survival-v1");
  assert.equal(config.world.generateStructures, false);
  assert.equal(config.world.spawnAnimals, false);
  assert.equal(env.LEVEL_TYPE, "FLAT");
  assert.equal(env.GENERATOR_SETTINGS.includes("minecraft:grass_block"), true);
  assert.equal(env.GENERATE_STRUCTURES, "false");
  assert.equal(env.SPAWN_ANIMALS, "false");
  assert.equal(env.SPAWN_NPCS, "false");
  assert.equal(env.VIEW_DISTANCE, "6");
  assert.equal(manifest.resource_fixture?.credited_as_actor_progress, false);
  assert.equal(manifest.command_runs.length, 0);
});

test("generates setup commands with 1.21.11 namespaced gamerules", () => {
  const scenario = getWorldScenario("roofless-hut-flat-survival-v1");
  const commands = buildWorldScenarioCommands({
    scenario,
    phase: "pre_bot",
    serverVersion: "1.21.11"
  });

  assert.ok(commands.some((command) => command.args.join(" ") === "setworldspawn 0 64 0"));
  assert.ok(commands.some((command) => command.args.join(" ") === "forceload add -16 -16 16 16"));
  assert.ok(commands.some((command) => command.args.join(" ") === "gamerule minecraft:respawn_radius 0"));
  assert.ok(commands.some((command) => command.args.join(" ") === "gamerule minecraft:advance_time false"));
  assert.ok(commands.some((command) => command.args.join(" ") === "fill 8 64 -2 10 65 2 minecraft:oak_log replace"));
  assert.ok(commands.some((command) => command.required));
});

test("parses the wooden pickaxe flat benchmark scenario without crediting fixture progress", () => {
  const scenario = getWorldScenario(parseWorldScenarioId("wooden-pickaxe-flat-benchmark-v1"));
  const config = applyWorldScenarioToConfig(loadProbeConfig(), scenario);
  const manifest = createWorldScenarioManifest(scenario);
  const commands = buildWorldScenarioCommands({
    scenario,
    phase: "pre_bot",
    serverVersion: "1.21.11"
  });

  assert.equal(scenario.lane, "fixture_probe");
  assert.equal(scenario.requiresFreshWorld, true);
  assert.equal(scenario.fixtureDependency, true);
  assert.equal(config.world.levelType, "FLAT");
  assert.equal(config.world.seed, "wooden-pickaxe-flat-benchmark-v1");
  assert.equal(manifest.resource_fixture?.credited_as_actor_progress, false);
  assert.equal(manifest.world_event_summary?.includes("wooden_pickaxe"), true);
  assert.ok(commands.some((command) => command.args.join(" ") === "fill 8 64 -2 10 65 2 minecraft:oak_log replace"));
});

test("records optional RCON command failures without blocking required fixture setup", async () => {
  const commandRun = await runWorldScenarioCommands({
    phase: "pre_bot",
    commands: [
      {
        phase: "pre_bot",
        args: ["gamerule", "minecraft:optional_rule", "false"],
        required: false,
        purpose: "optional compatibility command"
      },
      {
        phase: "pre_bot",
        args: ["time", "set", "noon"],
        required: true,
        purpose: "required setup command"
      }
    ],
    runRcon: async (args) => {
      if (args.includes("minecraft:optional_rule")) {
        throw new Error("Unknown game rule");
      }
      return "ok";
    }
  });

  assert.equal(commandRun.required_failure, false);
  assert.equal(commandRun.results[0]?.status, "failed");
  assert.equal(commandRun.results[1]?.status, "passed");
});

test("treats failure-like RCON output as setup failure evidence", async () => {
  const commandRun = await runWorldScenarioCommands({
    phase: "pre_bot",
    commands: [
      {
        phase: "pre_bot",
        args: ["gamerule", "minecraft:spawn_chunk_radius", "2"],
        required: false,
        purpose: "optional compatibility command"
      },
      {
        phase: "pre_bot",
        args: ["fill", "-10", "64", "-10", "10", "64", "10", "minecraft:grass_block", "replace"],
        required: true,
        purpose: "required setup command"
      },
      {
        phase: "pre_bot",
        args: ["time", "set", "noon"],
        required: true,
        purpose: "must not run after required setup failure"
      }
    ],
    runRcon: async (args) => {
      if (args.includes("minecraft:spawn_chunk_radius")) {
        return "Incorrect argument for command at position 9";
      }
      if (args.includes("fill")) {
        return "That position is not loaded";
      }
      return "ok";
    }
  });

  assert.equal(commandRun.required_failure, true);
  assert.equal(commandRun.results.length, 2);
  assert.equal(commandRun.results[0]?.status, "failed");
  assert.equal(commandRun.results[0]?.failure_reason, "incorrect_command_argument");
  assert.equal(commandRun.results[0]?.output, "Incorrect argument for command at position 9");
  assert.equal(commandRun.results[1]?.status, "failed");
  assert.equal(commandRun.results[1]?.failure_reason, "target_position_not_loaded");
  assert.equal(commandRun.results[1]?.output, "That position is not loaded");
});

test("parses and applies the natural safe spawn scenario without fixture mutation commands", () => {
  const scenario = getWorldScenario(parseWorldScenarioId("natural-safe-spawn-v1"));
  const config = applyWorldScenarioToConfig(loadProbeConfig(), scenario);
  const env = buildServerEnv(config);
  const manifest = createWorldScenarioManifest(scenario);
  const commands = [
    ...buildWorldScenarioCommands({ scenario, phase: "pre_bot", serverVersion: "1.21.11" }),
    ...buildWorldScenarioCommands({ scenario, phase: "post_bot", serverVersion: "1.21.11" })
  ];
  const commandText = commands.map((command) => command.args.join(" "));

  assert.equal(scenario.lane, "survival_social_run");
  assert.equal(scenario.fixtureDependency, false);
  assert.equal(scenario.requiresFreshWorld, true);
  assert.equal(config.world.levelType, "default");
  assert.equal(config.world.generatorSettings, undefined);
  assert.equal(env.LEVEL_TYPE, "default");
  assert.equal(env.GENERATOR_SETTINGS, "");
  assert.equal(manifest.natural_spawn_validation?.credited_as_actor_progress, false);
  assert.equal(manifest.resource_fixture, undefined);
  assert.equal(commandText.some((command) => command.startsWith("fill ")), false);
  assert.equal(commandText.some((command) => command.startsWith("setblock ")), false);
});

test("applies explicit seed override to natural safe spawn scenarios and manifest", () => {
  const scenario = getWorldScenario(parseWorldScenarioId("natural-safe-spawn-v1"));
  const config = applyWorldScenarioToConfig(loadProbeConfig(), scenario, {
    worldSeed: "candidate-natural-seed"
  });
  const manifest = createWorldScenarioManifest(scenario, { world: config.world });

  assert.equal(scenario.lane, "survival_social_run");
  assert.equal(config.world.seed, "candidate-natural-seed");
  assert.equal(manifest.server.seed, "candidate-natural-seed");
  assert.equal(config.world.levelType, "default");
  assert.equal(manifest.server.level_type, "default");
});

test("validates natural safe spawn evidence without actor progress credit", () => {
  const blocks = new Map<string, { name: string; boundingBox?: string }>();
  const key = (x: number, y: number, z: number) => `${x}:${y}:${z}`;
  blocks.set(key(0, 63, 0), { name: "grass_block", boundingBox: "block" });
  blocks.set(key(0, 64, 0), { name: "air", boundingBox: "empty" });
  blocks.set(key(0, 65, 0), { name: "air", boundingBox: "empty" });
  blocks.set(key(6, 64, 0), { name: "oak_log", boundingBox: "block" });

  const validation = createNaturalSpawnValidation({
    actorId: "npc_b",
    seed: "natural-safe-spawn-v1",
    createdAt: "2026-06-12T00:00:00.000Z",
    bot: {
      username: "npc_b",
      entity: { position: { x: 0.5, y: 64, z: 0.5 } },
      game: { dimension: "overworld" },
      blockAt(position) {
        const floored = {
          x: Math.floor(position.x),
          y: Math.floor(position.y),
          z: Math.floor(position.z)
        };
        const block = blocks.get(key(floored.x, floored.y, floored.z)) ?? {
          name: "air",
          boundingBox: "empty"
        };
        return { ...block, position: floored };
      },
      findBlocks() {
        return [{ x: 6, y: 64, z: 0 }];
      }
    }
  });

  assert.equal(validation.schema, "natural-spawn-validation/v1");
  assert.equal(validation.status, "passed");
  assert.equal(validation.credited_as_actor_progress, false);
  assert.equal(validation.world_state_scan.schema, "world-state-scan/v1");
  assert.deepEqual(validation.selected_coordinate, { x: 0, y: 64, z: 0 });
  assert.equal(validation.nearest_logs[0]?.name, "oak_log");
});

test("builds natural safe spawn placement commands without terrain mutation", () => {
  const commands = buildNaturalSpawnPlacementCommands({
    username: "npc_b",
    selectedPlayerPosition: { x: 0.5, y: 64, z: -3.5 }
  });
  const commandText = commands.map((command) => command.args.join(" "));

  assert.deepEqual(commandText, [
    "setworldspawn 0 64 -4",
    "spawnpoint npc_b 0 64 -4",
    "tp npc_b 0.5 64 -3.5"
  ]);
  assert.equal(commandText.some((command) => command.startsWith("fill ")), false);
  assert.equal(commandText.some((command) => command.startsWith("setblock ")), false);
});

test("fails natural safe spawn validation when the loaded start is unsafe", () => {
  const validation = createNaturalSpawnValidation({
    actorId: "npc_b",
    seed: "natural-safe-spawn-v1",
    bot: {
      entity: { position: { x: 0, y: 64, z: 0 } },
      blockAt(position) {
        const floored = {
          x: Math.floor(position.x),
          y: Math.floor(position.y),
          z: Math.floor(position.z)
        };
        return {
          name: floored.y === 63 ? "oak_leaves" : "air",
          boundingBox: floored.y === 63 ? "block" : "empty",
          position: floored
        };
      },
      findBlocks() {
        return [];
      }
    }
  });

  assert.equal(validation.status, "failed");
  assert.equal(validation.credited_as_actor_progress, false);
  assert.ok(validation.failure_reasons.includes("no_loaded_log_within_scan_radius"));
});
