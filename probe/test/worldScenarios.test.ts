/** Tests for named world-scenario fixtures used by live social-cycle runs. */
import assert from "node:assert/strict";
import test from "node:test";

import { buildServerEnv, loadProbeConfig } from "../src/config.js";
import {
  applyWorldScenarioToConfig,
  buildNaturalSpawnPinningCommands,
  buildWorldScenarioCommands,
  createWorldScenarioManifest,
  getWorldScenario,
  parseWorldScenarioId,
  runWorldScenarioCommands
} from "../src/server/worldScenarios.js";

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
  assert.equal(manifest.validation_refs.length, 0);
});

test("parses and applies the natural safe spawn scenario without fixture mutation", () => {
  const scenario = getWorldScenario(parseWorldScenarioId("natural-safe-spawn-v1"));
  const baseConfig = loadProbeConfig();
  const config = applyWorldScenarioToConfig(
    {
      ...baseConfig,
      world: {
        ...baseConfig.world,
        generatorSettings: "minecraft:legacy_fixture_settings"
      }
    },
    scenario
  );
  const env = buildServerEnv(config);
  const manifest = createWorldScenarioManifest(scenario);
  const commands = [
    ...buildWorldScenarioCommands({
      scenario,
      phase: "pre_bot",
      serverVersion: "1.21.11"
    }),
    ...buildWorldScenarioCommands({
      scenario,
      phase: "post_bot",
      serverVersion: "1.21.11"
    })
  ];

  assert.equal(scenario.lane, "survival_social_run");
  assert.equal(scenario.requiresFreshWorld, true);
  assert.equal(scenario.fixtureDependency, false);
  assert.equal(config.world.levelType, "default");
  assert.equal(config.world.seed, "natural-safe-spawn-v1");
  assert.equal(config.world.generatorSettings, undefined);
  assert.equal(env.LEVEL_TYPE, "default");
  assert.equal(env.GENERATOR_SETTINGS, "");
  assert.equal(manifest.fixture_dependency, false);
  assert.equal(manifest.requires_fresh_world, true);
  assert.equal("generator_settings" in manifest.server, false);
  assert.equal(manifest.resource_fixture, undefined);
  assert.equal(manifest.build_area, undefined);
  assert.equal(manifest.validation_refs.length, 0);
  assert.equal(commands.length, 0);
  assert.equal(commands.some((command) => ["fill", "setblock"].includes(command.args[0] ?? "")), false);
});

test("builds version-aware natural spawn pinning commands", () => {
  const commands = buildNaturalSpawnPinningCommands({
    username: "npc_b",
    position: { x: 12.8, y: 64, z: -3.2 },
    serverVersion: "1.21.11"
  });

  assert.deepEqual(commands.map((command) => command.args), [
    ["setworldspawn", "12", "64", "-4", "0"],
    ["gamerule", "minecraft:respawn_radius", "0"],
    ["spawnpoint", "npc_b", "12", "64", "-4", "0"],
    ["tp", "npc_b", "12.5", "64", "-3.5", "0", "0"]
  ]);
  assert.equal(commands.every((command) => command.phase === "post_bot"), true);
  assert.equal(commands.every((command) => command.required), true);
});

test("builds legacy respawn radius command for older server versions", () => {
  const commands = buildNaturalSpawnPinningCommands({
    username: "npc_b",
    position: { x: 0, y: 64, z: 0 },
    serverVersion: "1.21.10"
  });

  assert.deepEqual(commands[1]?.args, ["gamerule", "spawnRadius", "0"]);
});

test("generates setup commands with 1.21.11 namespaced gamerules", () => {
  const scenario = getWorldScenario("roofless-hut-flat-survival-v1");
  const commands = buildWorldScenarioCommands({
    scenario,
    phase: "pre_bot",
    serverVersion: "1.21.11"
  });

  assert.ok(commands.some((command) => command.args.join(" ") === "gamerule minecraft:respawn_radius 0"));
  assert.ok(commands.some((command) => command.args.join(" ") === "gamerule minecraft:advance_time false"));
  assert.ok(commands.some((command) => command.args.join(" ") === "fill 8 64 -2 10 65 2 minecraft:oak_log replace"));
  assert.ok(commands.some((command) => command.required));
});

test("classifies required RCON failure output as blocking setup failure", async () => {
  const commandRun = await runWorldScenarioCommands({
    phase: "pre_bot",
    commands: [
      {
        phase: "pre_bot",
        args: ["fill", "-10", "64", "-10", "10", "64", "10", "minecraft:grass_block", "replace"],
        required: true,
        purpose: "required work pad command"
      },
      {
        phase: "pre_bot",
        args: ["time", "set", "noon"],
        required: true,
        purpose: "should not run after required setup failure"
      }
    ],
    runRcon: async (args) => {
      if (args[0] === "fill") {
        return "That position is not loaded";
      }
      return "Set the time to 6000";
    }
  });

  assert.equal(commandRun.required_failure, true);
  assert.equal(commandRun.results.length, 1);
  assert.equal(commandRun.results[0]?.status, "failed");
  assert.equal(commandRun.results[0]?.output, "That position is not loaded");
  assert.equal(commandRun.results[0]?.failure_kind, "unloaded_position");
});

test("classifies optional RCON failure output without blocking required fixture setup", async () => {
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
        return "Incorrect argument for command at position 9: gamerule <--[HERE]";
      }
      return "ok";
    }
  });

  assert.equal(commandRun.required_failure, false);
  assert.equal(commandRun.results[0]?.status, "failed");
  assert.equal(commandRun.results[0]?.output, "Incorrect argument for command at position 9: gamerule <--[HERE]");
  assert.equal(commandRun.results[0]?.failure_kind, "incorrect_argument");
  assert.equal(commandRun.results[1]?.status, "passed");
  assert.equal(commandRun.results[1]?.output, "ok");
});

test("classifies narrow known RCON failure output signatures", async () => {
  const cases = [
    ["Incomplete", "incomplete_command"],
    ["Unknown or incomplete command, see below for error", "unknown_command"],
    ["No player was found", "missing_player"]
  ] as const;

  for (const [output, failureKind] of cases) {
    const commandRun = await runWorldScenarioCommands({
      phase: "post_bot",
      commands: [
        {
          phase: "post_bot",
          args: ["tp", "missing_actor", "0", "64", "0"],
          required: false,
          purpose: "optional compatibility command"
        }
      ],
      runRcon: async () => output
    });

    assert.equal(commandRun.required_failure, false);
    assert.equal(commandRun.results[0]?.status, "failed");
    assert.equal(commandRun.results[0]?.output, output);
    assert.equal(commandRun.results[0]?.failure_kind, failureKind);
  }
});
