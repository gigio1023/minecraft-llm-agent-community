import type { Bot } from "mineflayer";

import type { ProbeConfig } from "../config.js";
import { classifyRconOutputFailure } from "./worldScenarioRcon.js";

export const worldScenarioIds = [
  "natural-survival",
  "natural-safe-spawn-v1",
  "roofless-hut-flat-survival-v1",
  "wooden-pickaxe-flat-benchmark-v1"
] as const;

export type WorldScenarioId = typeof worldScenarioIds[number];

export type WorldScenarioLane = "survival_social_run" | "fixture_probe";

export type WorldScenarioCommandPhase = "pre_bot" | "post_bot";

export type WorldScenarioCommand = {
  phase: WorldScenarioCommandPhase;
  args: string[];
  required: boolean;
  purpose: string;
};

export type WorldScenarioCommandResult = WorldScenarioCommand & {
  status: "passed" | "failed";
  output?: string;
  error?: string;
  failure_reason?: string;
  failure_pattern?: string;
};

export type WorldScenarioCommandRun = {
  schema: "world-scenario-command-run/v1";
  phase: WorldScenarioCommandPhase;
  results: WorldScenarioCommandResult[];
  required_failure: boolean;
};

export type WorldScenarioManifest = {
  schema: "world-scenario-manifest/v1";
  scenario_id: WorldScenarioId;
  lane: WorldScenarioLane;
  title: string;
  description: string;
  fixture_dependency: boolean;
  requires_fresh_world: boolean;
  server: {
    level_type: string;
    seed: string;
    generator_settings?: string;
    generate_structures: boolean;
    spawn_npcs: boolean;
    spawn_animals: boolean;
    spawn_monsters: boolean;
    difficulty: string;
    view_distance: number;
    simulation_distance: number;
  };
  actor_start?: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
  };
  build_area?: {
    center: { x: number; y: number; z: number };
    half_extent: number;
    purpose: string;
  };
  resource_fixture?: {
    type: string;
    description: string;
    credited_as_actor_progress: false;
  };
  natural_spawn_validation?: {
    status: "not_applicable" | "passed" | "failed";
    artifact_ref?: string;
    credited_as_actor_progress: false;
  };
  world_event_summary?: string;
  notes: string[];
  command_runs: WorldScenarioCommandRun[];
};

export type WorldScenario = {
  id: WorldScenarioId;
  lane: WorldScenarioLane;
  title: string;
  description: string;
  fixtureDependency: boolean;
  requiresFreshWorld: boolean;
  world: Required<Pick<
    ProbeConfig["world"],
    | "seed"
    | "levelType"
    | "generateStructures"
    | "spawnNpcs"
    | "spawnAnimals"
    | "spawnMonsters"
    | "difficulty"
    | "viewDistance"
    | "simulationDistance"
  >> & {
    generatorSettings?: string;
  };
  actorStart?: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
  };
  buildArea?: WorldScenarioManifest["build_area"];
  resourceFixture?: WorldScenarioManifest["resource_fixture"];
  naturalSpawnValidation?: WorldScenarioManifest["natural_spawn_validation"];
  worldEventSummary?: string;
  notes: string[];
};

const flatPlainsGeneratorSettings = JSON.stringify({
  layers: [
    { block: "minecraft:bedrock", height: 1 },
    { block: "minecraft:deepslate", height: 16 },
    { block: "minecraft:stone", height: 107 },
    { block: "minecraft:dirt", height: 3 },
    { block: "minecraft:grass_block", height: 1 }
  ],
  biome: "minecraft:plains",
  features: false,
  lakes: false,
  structure_overrides: []
});

const scenarios: Record<WorldScenarioId, WorldScenario> = {
  "natural-survival": {
    id: "natural-survival",
    lane: "survival_social_run",
    title: "Natural Survival World",
    description:
      "A normal survival world with a configured seed. Use this lane for broad survival/social behavior, not for isolating construction-tool quality.",
    fixtureDependency: false,
    requiresFreshWorld: false,
    world: {
      seed: "",
      levelType: "default",
      generateStructures: true,
      spawnNpcs: true,
      spawnAnimals: true,
      spawnMonsters: false,
      difficulty: "peaceful",
      viewDistance: 10,
      simulationDistance: 10
    },
    notes: [
      "Natural survival runs are useful after a behavior is stable in a fixture.",
      "World noise, terrain, trees, and animals are part of the scenario rather than setup failures."
    ]
  },
  "natural-safe-spawn-v1": {
    id: "natural-safe-spawn-v1",
    lane: "survival_social_run",
    title: "Natural Safe Spawn Survival Run",
    description:
      "A normal seeded survival world with post-join spawn validation so dense-canopy and tree-top starts are classified as setup failures rather than actor behavior.",
    fixtureDependency: false,
    requiresFreshWorld: true,
    world: {
      seed: "natural-safe-spawn-v1",
      levelType: "default",
      generateStructures: true,
      spawnNpcs: true,
      spawnAnimals: true,
      spawnMonsters: false,
      difficulty: "peaceful",
      viewDistance: 10,
      simulationDistance: 10
    },
    naturalSpawnValidation: {
      status: "not_applicable",
      credited_as_actor_progress: false
    },
    worldEventSummary:
      "Current local task: begin from the verified natural spawn area, use nearby natural resources, and make physical early-survival progress from runtime evidence. Spawn validation proves starting conditions only; it is not actor progress.",
    notes: [
      "This scenario keeps default terrain generation and does not place resources, clear pads, or build starter structures.",
      "Post-join spawn validation records loaded-world evidence before Actor Turn cycles begin.",
      "A failed safe-spawn validation is environment/setup failure, not an Actor Turn behavior failure."
    ]
  },
  "roofless-hut-flat-survival-v1": {
    id: "roofless-hut-flat-survival-v1",
    lane: "fixture_probe",
    title: "Roofless Hut Flat Survival Fixture",
    description:
      "A flat survival construction fixture for separating Actor Turn behavior quality from forest spawn noise.",
    fixtureDependency: true,
    requiresFreshWorld: true,
    world: {
      seed: "roofless-hut-flat-survival-v1",
      levelType: "FLAT",
      generatorSettings: flatPlainsGeneratorSettings,
      generateStructures: false,
      spawnNpcs: false,
      spawnAnimals: false,
      spawnMonsters: false,
      difficulty: "peaceful",
      viewDistance: 6,
      simulationDistance: 6
    },
    actorStart: { x: 0, y: 64, z: 0, yaw: 0, pitch: 0 },
    buildArea: {
      center: { x: 0, y: 64, z: 0 },
      half_extent: 5,
      purpose:
        "A clear flat work pad for a very small roofless hut or partial low-wall footprint."
    },
    resourceFixture: {
      type: "oak_log_rack",
      description:
        "A nearby oak_log rack is placed as a survival resource source. Mining or using it can count only after runtime evidence records actor action.",
      credited_as_actor_progress: false
    },
    worldEventSummary:
      "Current local task: build a very small roofless hut on the marked flat worksite using nearby survival materials. A useful result is a visible low wall outline or partial shelter footprint with verifier evidence. Choose the worksite and keep taking physical actions when possible.",
    notes: [
      "This fixture is not a hidden planner. It makes the worksite observable and repeatable.",
      "RCON setup artifacts are fixture evidence only; they must not be credited as actor progress.",
      "Screenshots help human review, but block, inventory, position, and verifier artifacts remain runtime authority."
    ]
  },
  "wooden-pickaxe-flat-benchmark-v1": {
    id: "wooden-pickaxe-flat-benchmark-v1",
    lane: "fixture_probe",
    title: "Wooden Pickaxe Flat Benchmark Fixture",
    description:
      "A flat survival fixture for comparing model ability to chain early survival actions into a verified wooden_pickaxe.",
    fixtureDependency: true,
    requiresFreshWorld: true,
    world: {
      seed: "wooden-pickaxe-flat-benchmark-v1",
      levelType: "FLAT",
      generatorSettings: flatPlainsGeneratorSettings,
      generateStructures: false,
      spawnNpcs: false,
      spawnAnimals: false,
      spawnMonsters: false,
      difficulty: "peaceful",
      viewDistance: 6,
      simulationDistance: 6
    },
    actorStart: { x: 0, y: 64, z: 0, yaw: 0, pitch: 0 },
    buildArea: {
      center: { x: 0, y: 64, z: 0 },
      half_extent: 5,
      purpose:
        "A clear flat work pad for crafting a basic tool from actor-collected materials."
    },
    resourceFixture: {
      type: "oak_log_rack",
      description:
        "A nearby oak_log rack is placed as the only starter resource source. The actor must mine it before crafted items can count as progress.",
      credited_as_actor_progress: false
    },
    worldEventSummary:
      "Benchmark task: from empty inventory, collect oak logs from the nearby rack and physically craft one wooden_pickaxe. Useful milestone evidence includes oak_log inventory, oak_planks and stick crafting, a crafting_table item or placed crafting_table, and final wooden_pickaxe inventory or held-item evidence. Setup blocks and RCON commands are fixture evidence only, not actor progress.",
    notes: [
      "This fixture is for model comparison, not a general product goal.",
      "The target is reached only when runtime evidence shows a wooden_pickaxe in inventory or held item state.",
      "Tool-call schema compliance is not a benchmark score; runtime world and inventory evidence are the score authority."
    ]
  }
};

export function parseWorldScenarioId(value: string | undefined): WorldScenarioId | undefined {
  if (!value || value.trim().length === 0) {
    return undefined;
  }
  const trimmed = value.trim();
  if (worldScenarioIds.includes(trimmed as WorldScenarioId)) {
    return trimmed as WorldScenarioId;
  }
  throw new Error(
    `Unsupported world scenario '${value}'. Supported scenarios: ${worldScenarioIds.join(", ")}`
  );
}

export function getWorldScenario(id: WorldScenarioId | undefined) {
  return scenarios[id ?? "natural-survival"];
}

export function applyWorldScenarioToConfig(
  config: ProbeConfig,
  scenario: WorldScenario,
  options?: { worldSeed?: string }
): ProbeConfig {
  if (scenario.id === "natural-survival") {
    return config;
  }
  const explicitSurvivalSeed =
    scenario.lane === "survival_social_run" && options?.worldSeed?.trim()
      ? { seed: options.worldSeed.trim() }
      : {};

  return {
    ...config,
    world: {
      ...config.world,
      ...scenario.world,
      ...explicitSurvivalSeed
    },
    ...(scenario.actorStart
      ? {
          spawn: {
            x: scenario.actorStart.x,
            y: scenario.actorStart.y,
            z: scenario.actorStart.z
          }
        }
      : {})
  };
}

export function createWorldScenarioManifest(
  scenario: WorldScenario,
  options?: { world?: Partial<ProbeConfig["world"]> }
): WorldScenarioManifest {
  const world = {
    ...scenario.world,
    ...options?.world
  };
  return {
    schema: "world-scenario-manifest/v1",
    scenario_id: scenario.id,
    lane: scenario.lane,
    title: scenario.title,
    description: scenario.description,
    fixture_dependency: scenario.fixtureDependency,
    requires_fresh_world: scenario.requiresFreshWorld,
    server: {
      level_type: world.levelType,
      seed: world.seed,
      ...(world.generatorSettings
        ? { generator_settings: world.generatorSettings }
        : {}),
      generate_structures: world.generateStructures,
      spawn_npcs: world.spawnNpcs,
      spawn_animals: world.spawnAnimals,
      spawn_monsters: world.spawnMonsters,
      difficulty: world.difficulty,
      view_distance: world.viewDistance,
      simulation_distance: world.simulationDistance
    },
    ...(scenario.actorStart ? { actor_start: { ...scenario.actorStart } } : {}),
    ...(scenario.buildArea ? { build_area: scenario.buildArea } : {}),
    ...(scenario.resourceFixture ? { resource_fixture: scenario.resourceFixture } : {}),
    ...(scenario.naturalSpawnValidation
      ? { natural_spawn_validation: scenario.naturalSpawnValidation }
      : {}),
    ...(scenario.worldEventSummary ? { world_event_summary: scenario.worldEventSummary } : {}),
    notes: [...scenario.notes],
    command_runs: []
  };
}

function supportsNamespacedGamerules(version: string) {
  const [major, minor, patch] = version.split(".").map((part) => Number(part));
  return major > 1 || (major === 1 && (minor > 21 || (minor === 21 && (patch || 0) >= 11)));
}

function stableFixtureGamerules(version: string): WorldScenarioCommand[] {
  if (supportsNamespacedGamerules(version)) {
    return [
      ["minecraft:respawn_radius", "0", "respawn exactly at the fixture spawn"],
      ["minecraft:spawn_chunk_radius", "2", "keep fixture spawn chunks small and predictable"],
      ["minecraft:advance_time", "false", "keep lighting stable during the probe"],
      ["minecraft:advance_weather", "false", "keep weather stable during the probe"],
      ["minecraft:spawn_mobs", "false", "prevent hostile or passive mob noise"],
      ["minecraft:spawn_wandering_traders", "false", "prevent trader noise"],
      ["minecraft:spawn_patrols", "false", "prevent patrol noise"],
      ["minecraft:spawn_phantoms", "false", "prevent phantom noise"],
      ["minecraft:keep_inventory", "true", "avoid inventory loss from accidental death"],
      ["minecraft:mob_griefing", "false", "prevent mobs from changing fixture state"],
      ["minecraft:random_tick_speed", "0", "prevent plant/fire/random tick drift"]
    ].map(([rule, value, purpose]) => ({
      phase: "pre_bot",
      args: ["gamerule", rule, value],
      required: false,
      purpose
    }));
  }

  return [
    ["spawnRadius", "0", "respawn exactly at the fixture spawn"],
    ["spawnChunkRadius", "2", "keep fixture spawn chunks small and predictable"],
    ["doDaylightCycle", "false", "keep lighting stable during the probe"],
    ["doWeatherCycle", "false", "keep weather stable during the probe"],
    ["doMobSpawning", "false", "prevent hostile or passive mob noise"],
    ["doTraderSpawning", "false", "prevent trader noise"],
    ["doPatrolSpawning", "false", "prevent patrol noise"],
    ["doInsomnia", "false", "prevent phantom noise"],
    ["keepInventory", "true", "avoid inventory loss from accidental death"],
    ["mobGriefing", "false", "prevent mobs from changing fixture state"],
    ["randomTickSpeed", "0", "prevent plant/fire/random tick drift"]
  ].map(([rule, value, purpose]) => ({
    phase: "pre_bot",
    args: ["gamerule", rule, value],
    required: false,
    purpose
  }));
}

export function buildWorldScenarioCommands(input: {
  scenario: WorldScenario;
  phase: WorldScenarioCommandPhase;
  serverVersion: string;
  bot?: Bot;
}): WorldScenarioCommand[] {
  if (
    input.scenario.id !== "roofless-hut-flat-survival-v1" &&
    input.scenario.id !== "wooden-pickaxe-flat-benchmark-v1"
  ) {
    return [];
  }

  const actorStart = input.scenario.actorStart ?? { x: 0, y: 64, z: 0, yaw: 0, pitch: 0 };
  const username = input.bot?.username;

  if (input.phase === "pre_bot") {
    return [
      {
        phase: "pre_bot",
        args: [
          "setworldspawn",
          String(actorStart.x),
          String(actorStart.y),
          String(actorStart.z)
        ],
        required: true,
        purpose: "anchor the fixture spawn before the actor joins"
      },
      {
        phase: "pre_bot",
        args: ["worldborder", "center", "0", "0"],
        required: false,
        purpose: "center a small worldborder around the fixture"
      },
      {
        phase: "pre_bot",
        args: ["worldborder", "set", "128"],
        required: false,
        purpose: "keep the test run near the fixture"
      },
      {
        phase: "pre_bot",
        args: ["forceload", "add", "-16", "-16", "16", "16"],
        required: true,
        purpose: "load the fixture work pad before block setup commands run"
      },
      {
        phase: "pre_bot",
        args: ["time", "set", "noon"],
        required: true,
        purpose: "keep initial screenshots and navigation well lit"
      },
      {
        phase: "pre_bot",
        args: ["weather", "clear"],
        required: true,
        purpose: "avoid weather as a visual and movement variable"
      },
      ...stableFixtureGamerules(input.serverVersion),
      {
        phase: "pre_bot",
        args: ["fill", "-10", "60", "-10", "10", "62", "10", "minecraft:dirt", "replace"],
        required: true,
        purpose: "make the work pad support layers explicit"
      },
      {
        phase: "pre_bot",
        args: ["fill", "-10", "63", "-10", "10", "63", "10", "minecraft:grass_block", "replace"],
        required: true,
        purpose: "create the flat work pad surface"
      },
      {
        phase: "pre_bot",
        args: ["fill", "-10", "64", "-10", "10", "72", "10", "minecraft:air", "replace"],
        required: true,
        purpose: "clear headroom around the work pad"
      },
      {
        phase: "pre_bot",
        args: ["fill", "8", "64", "-2", "10", "65", "2", "minecraft:oak_log", "replace"],
        required: true,
        purpose: "place a nearby log rack as survival material source"
      }
    ];
  }

  if (!username) {
    return [];
  }

  return [
    {
      phase: "post_bot",
      args: ["gamemode", "survival", username],
      required: true,
      purpose: "ensure the actor remains in survival mode"
    },
    {
      phase: "post_bot",
      args: [
        "tp",
        username,
        String(actorStart.x),
        String(actorStart.y),
        String(actorStart.z),
        String(actorStart.yaw),
        String(actorStart.pitch)
      ],
      required: true,
      purpose: "place the actor at the fixture worksite start pose"
    },
    {
      phase: "post_bot",
      args: ["clear", username],
      required: true,
      purpose: "start from empty inventory so fixture resources are not pre-credited"
    }
  ];
}

export async function runWorldScenarioCommands(input: {
  phase: WorldScenarioCommandPhase;
  commands: WorldScenarioCommand[];
  runRcon: (args: string[]) => Promise<string>;
}): Promise<WorldScenarioCommandRun> {
  const results: WorldScenarioCommandResult[] = [];
  let requiredFailure = false;

  for (const command of input.commands) {
    try {
      const output = await input.runRcon(command.args);
      const failure = classifyRconOutputFailure(output);
      results.push({
        ...command,
        status: failure ? "failed" : "passed",
        ...(output ? { output } : {}),
        ...(failure
          ? {
              failure_reason: failure.reason,
              failure_pattern: failure.pattern
            }
          : {})
      });
      if (failure && command.required) {
        requiredFailure = true;
        break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        ...command,
        status: "failed",
        error: message
      });
      if (command.required) {
        requiredFailure = true;
        break;
      }
    }
  }

  return {
    schema: "world-scenario-command-run/v1",
    phase: input.phase,
    results,
    required_failure: requiredFailure
  };
}
