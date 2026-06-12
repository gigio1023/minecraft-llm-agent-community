import type { Bot } from "mineflayer";

import type { ProbeConfig } from "../config.js";

export const worldScenarioIds = [
  "natural-survival",
  "natural-safe-spawn-v1",
  "roofless-hut-flat-survival-v1"
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

export type WorldScenarioCommandFailureKind =
  | "unloaded_position"
  | "incomplete_command"
  | "incorrect_argument"
  | "unknown_command"
  | "missing_player";

export type WorldScenarioCommandResult = WorldScenarioCommand & {
  status: "passed" | "failed";
  output?: string;
  error?: string;
  failure_kind?: WorldScenarioCommandFailureKind;
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
  world_event_summary?: string;
  notes: string[];
  command_runs: WorldScenarioCommandRun[];
  validation_refs: string[];
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
    title: "Natural Safe Spawn Survival World",
    description:
      "A normal fresh survival world for validating an ordinary playable natural spawn without terrain or resource fixtures.",
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
    notes: [
      "This scenario configures ordinary natural generation; a later spawn-validation slice must prove the concrete start position.",
      "Setup must not use fill, setblock, resource racks, cleared pads, or starter structures.",
      "Spawn validation and pinning evidence is setup context only and must not be credited as actor progress."
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

export function applyWorldScenarioToConfig(config: ProbeConfig, scenario: WorldScenario): ProbeConfig {
  if (scenario.id === "natural-survival") {
    return config;
  }

  const scenarioWorld = {
    ...config.world,
    ...scenario.world
  };
  if (scenario.world.generatorSettings === undefined) {
    delete scenarioWorld.generatorSettings;
  }

  return {
    ...config,
    world: scenarioWorld,
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

export function createWorldScenarioManifest(scenario: WorldScenario): WorldScenarioManifest {
  return {
    schema: "world-scenario-manifest/v1",
    scenario_id: scenario.id,
    lane: scenario.lane,
    title: scenario.title,
    description: scenario.description,
    fixture_dependency: scenario.fixtureDependency,
    requires_fresh_world: scenario.requiresFreshWorld,
    server: {
      level_type: scenario.world.levelType,
      seed: scenario.world.seed,
      ...(scenario.world.generatorSettings
        ? { generator_settings: scenario.world.generatorSettings }
        : {}),
      generate_structures: scenario.world.generateStructures,
      spawn_npcs: scenario.world.spawnNpcs,
      spawn_animals: scenario.world.spawnAnimals,
      spawn_monsters: scenario.world.spawnMonsters,
      difficulty: scenario.world.difficulty,
      view_distance: scenario.world.viewDistance,
      simulation_distance: scenario.world.simulationDistance
    },
    ...(scenario.actorStart ? { actor_start: { ...scenario.actorStart } } : {}),
    ...(scenario.buildArea ? { build_area: scenario.buildArea } : {}),
    ...(scenario.resourceFixture ? { resource_fixture: scenario.resourceFixture } : {}),
    ...(scenario.worldEventSummary ? { world_event_summary: scenario.worldEventSummary } : {}),
    notes: [...scenario.notes],
    command_runs: [],
    validation_refs: []
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

export function buildNaturalSpawnPinningCommands(input: {
  username: string;
  position: { x: number; y: number; z: number };
  serverVersion: string;
}): WorldScenarioCommand[] {
  const x = Math.floor(input.position.x);
  const y = Math.floor(input.position.y);
  const z = Math.floor(input.position.z);
  const tpX = String(x + 0.5);
  const tpZ = String(z + 0.5);
  const respawnRadiusRule = supportsNamespacedGamerules(input.serverVersion)
    ? "minecraft:respawn_radius"
    : "spawnRadius";

  return [
    {
      phase: "post_bot",
      args: ["setworldspawn", String(x), String(y), String(z), "0"],
      required: true,
      purpose: "pin the validated natural world spawn after loaded-world validation"
    },
    {
      phase: "post_bot",
      args: ["gamerule", respawnRadiusRule, "0"],
      required: true,
      purpose: "avoid random spawn spreading around the validated natural start"
    },
    {
      phase: "post_bot",
      args: ["spawnpoint", input.username, String(x), String(y), String(z), "0"],
      required: true,
      purpose: "pin the actor-specific respawn to the validated natural start"
    },
    {
      phase: "post_bot",
      args: ["tp", input.username, tpX, String(y), tpZ, "0", "0"],
      required: true,
      purpose: "place the actor at the validated natural start before provider cycles"
    }
  ];
}

const rconOutputFailureSignatures: Array<{
  text: string;
  failure_kind: WorldScenarioCommandFailureKind;
}> = [
  { text: "That position is not loaded", failure_kind: "unloaded_position" },
  { text: "Unknown or incomplete command", failure_kind: "unknown_command" },
  { text: "Incorrect argument for command", failure_kind: "incorrect_argument" },
  { text: "No player was found", failure_kind: "missing_player" },
  { text: "Incomplete", failure_kind: "incomplete_command" }
];

function classifyRconCommandOutput(output: string):
  | { status: "passed" }
  | { status: "failed"; failure_kind: WorldScenarioCommandFailureKind } {
  for (const signature of rconOutputFailureSignatures) {
    if (output.includes(signature.text)) {
      return {
        status: "failed",
        failure_kind: signature.failure_kind
      };
    }
  }
  return { status: "passed" };
}

export function buildWorldScenarioCommands(input: {
  scenario: WorldScenario;
  phase: WorldScenarioCommandPhase;
  serverVersion: string;
  bot?: Bot;
}): WorldScenarioCommand[] {
  if (input.scenario.id !== "roofless-hut-flat-survival-v1") {
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
          String(actorStart.z),
          String(actorStart.yaw)
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
      const classification = classifyRconCommandOutput(output);
      results.push({
        ...command,
        status: classification.status,
        ...(output ? { output } : {}),
        ...(classification.status === "failed"
          ? { failure_kind: classification.failure_kind }
          : {})
      });
      if (command.required && classification.status === "failed") {
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
