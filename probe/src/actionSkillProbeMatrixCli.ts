import type { SeedActionSkillId } from "./gameplay/seedSkills/registry.js";
import { listImplementedSeedActionSkills } from "./gameplay/seedSkills/registry.js";
import { fileURLToPath } from "node:url";
import type { RoleId } from "./npc/roles/contracts.js";
import { loadProbeConfig } from "./config.js";
import { initializeActorWorkspaces } from "./runtime/actorWorkspace.js";
import {
  runLiveActionSkillProbe,
  validateSkillProbeConfig,
  type ActionSkillProbeConfig,
  type ActionSkillProbeResult
} from "./runtime/actionSkillProbeRunner.js";
import { assignSeedActionSkillOwnership } from "./skills/ownership.js";

type MatrixCliOptions = {
  actor?: string;
  skills?: string[];
  maxActions?: number;
  initActorWorkspace?: boolean;
  continueOnFailure?: boolean;
};

type ProbeMatrixCase = ActionSkillProbeConfig & {
  summary: string;
};

function parseArgs(argv: readonly string[]): MatrixCliOptions {
  const options: MatrixCliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      index += 1;
      return value;
    };

    switch (arg) {
      case "--actor":
        options.actor = next();
        break;
      case "--skills":
        options.skills = next().split(",").map((value) => value.trim()).filter(Boolean);
        break;
      case "--max-actions": {
        const value = Number(next());
        if (!Number.isInteger(value) || value <= 0) {
          throw new Error("--max-actions must be a positive integer");
        }
        options.maxActions = value;
        break;
      }
      case "--init-actor-workspace":
        options.initActorWorkspace = next() === "baseline";
        break;
      case "--continue-on-failure":
        options.continueOnFailure = true;
        break;
      case "--help":
        printUsage();
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printUsage() {
  console.log([
    "Usage: bun run src/actionSkillProbeMatrixCli.ts [options]",
    "",
    "Run implemented seed action skills one-by-one through the live probe harness.",
    "The matrix fails on the first non-passing probe unless --continue-on-failure is set.",
    "",
    "Options:",
    "  --actor <id>              Actor ID for the probe bot (default: npc_b)",
    "  --skills <a,b,c>          Comma-separated skill IDs (default: all implemented)",
    "  --max-actions <n>         Max actions per skill probe (default: 8)",
    "  --init-actor-workspace baseline   Initialize actor workspace before each run",
    "  --continue-on-failure     Continue after failed/error probes",
    "  --help                    Show this help"
  ].join("\n"));
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function assertSeedActionSkillId(value: string): asserts value is SeedActionSkillId {
  const ids = new Set(listImplementedSeedActionSkills().map((skill) => skill.id));
  if (!ids.has(value as SeedActionSkillId)) {
    throw new Error(`Unknown or non-implemented action skill: ${value}`);
  }
}

export function buildProbeMatrixCases(input: {
  actorId: string;
  skillIds?: string[];
  maxActions: number;
}): ProbeMatrixCase[] {
  const implementedSkills = listImplementedSeedActionSkills();
  const selectedIds = input.skillIds ?? implementedSkills.map((skill) => skill.id);
  const byId = new Map(implementedSkills.map((skill) => [skill.id, skill]));

  return selectedIds.map((rawSkillId) => {
    assertSeedActionSkillId(rawSkillId);
    const skill = byId.get(rawSkillId);
    if (!skill) {
      throw new Error(`Unknown action skill: ${rawSkillId}`);
    }

    const roleId = skill.validRoles[0] as RoleId | undefined;
    if (!roleId) {
      throw new Error(`Action skill ${skill.id} has no valid runtime role`);
    }

    const probeConfig = {
      actorId: input.actorId,
      skillId: skill.id,
      roleId,
      maxActions: input.maxActions
    } satisfies ActionSkillProbeConfig;
    validateSkillProbeConfig(probeConfig);

    return {
      ...probeConfig,
      summary: skill.summary
    };
  });
}

async function initializeWorkspaceForCase(testCase: ProbeMatrixCase) {
  const config = loadProbeConfig();
  const actorRoles = { [testCase.actorId]: testCase.roleId };
  const seedOwnership = assignSeedActionSkillOwnership([testCase.actorId], actorRoles);

  await initializeActorWorkspaces({
    rootDir: config.actorWorkspace.rootDir,
    actors: [
      {
        actor_id: testCase.actorId,
        username: testCase.actorId,
        role_id: testCase.roleId
      }
    ],
    seedActionSkillOwnership: seedOwnership
  });
}

function printResult(result: ActionSkillProbeResult) {
  console.log(`  status: ${result.status}`);
  if (result.finalWhy) {
    console.log(`  why:    ${result.finalWhy}`);
  }
  if (result.transcriptPath) {
    console.log(`  transcript: ${result.transcriptPath}`);
  }
  if (result.errorMessage) {
    console.log(`  error:  ${result.errorMessage}`);
  }
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const actorId = options.actor ?? "npc_b";
    const cases = buildProbeMatrixCases({
      actorId,
      skillIds: options.skills,
      maxActions: options.maxActions ?? 8
    });
    const results: ActionSkillProbeResult[] = [];

    console.log(`Action skill probe matrix: ${cases.length} case(s)`);
    console.log(`actor: ${actorId}`);
    console.log();

    for (const [index, testCase] of cases.entries()) {
      console.log(`─── [${index + 1}/${cases.length}] ${testCase.skillId} ───`);
      console.log(`  role:    ${testCase.roleId}`);
      console.log(`  summary: ${testCase.summary}`);

      if (options.initActorWorkspace) {
        await initializeWorkspaceForCase(testCase);
        console.log("  actor workspace: initialized");
      }

      const result = await runLiveActionSkillProbe(testCase);
      results.push(result);
      printResult(result);
      console.log();

      if (result.status !== "passed" && !options.continueOnFailure) {
        break;
      }
    }

    const passed = results.filter((result) => result.status === "passed").length;
    const failed = results.filter((result) => result.status === "failed").length;
    const errored = results.filter((result) => result.status === "error").length;
    console.log(`matrix_summary passed=${passed} failed=${failed} error=${errored} total=${results.length}/${cases.length}`);

    if (passed !== cases.length || failed > 0 || errored > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`action-skill-matrix error: ${formatError(error)}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main();
}
