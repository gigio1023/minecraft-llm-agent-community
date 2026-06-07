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

  assert.ok(commands.some((command) => command.args.join(" ") === "gamerule minecraft:respawn_radius 0"));
  assert.ok(commands.some((command) => command.args.join(" ") === "gamerule minecraft:advance_time false"));
  assert.ok(commands.some((command) => command.args.join(" ") === "fill 8 64 -2 10 65 2 minecraft:oak_log replace"));
  assert.ok(commands.some((command) => command.required));
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
