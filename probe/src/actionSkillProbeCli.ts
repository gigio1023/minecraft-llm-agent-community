import type { SeedActionSkillId } from "./gameplay/seedSkills/registry.js";
import type { RoleId } from "./npc/roles/contracts.js";
import {
  validateSkillProbeConfig,
  buildSkillProbeActionSkillRecords,
  loadSkillProbeContract,
  runLiveActionSkillProbe,
  type ActionSkillProbeConfig,
} from "./runtime/actionSkillProbeRunner.js";
import { loadProbeConfig } from "./config.js";
import {
  initializeActorWorkspaces
} from "./runtime/actorWorkspace.js";
import { assignSeedActionSkillOwnership } from "./skills/ownership.js";
import { startDashboardServer, type DashboardServer } from "./dashboard/dashboardServer.js";
import { listImplementedSeedActionSkills } from "./gameplay/seedSkills/registry.js";
import { probePort } from "./server/serverLifecycle.js";
import { checkDockerPreflight, dockerPreflightCommand } from "./server/dockerPreflight.js";

type SkillProbeCliOptions = {
  actor?: string;
  skill?: string;
  maxActions?: number;
  initActorWorkspace?: boolean;
  dashboard?: boolean;
  dashboardPort?: number;
};

function parseArgs(argv: readonly string[]): SkillProbeCliOptions {
  const options: SkillProbeCliOptions = {};

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
      case "--skill":
        options.skill = next();
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
      case "--no-dashboard":
        options.dashboard = false;
        break;
      case "--dashboard-port": {
        const value = Number(next());
        if (!Number.isInteger(value) || value < 1 || value > 65_535) {
          throw new Error("--dashboard-port must be between 1 and 65535");
        }
        options.dashboardPort = value;
        break;
      }
      case "--list-skills":
        printImplementedSkills();
        process.exit(0);
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
  const lines = [
    "Usage: bun run src/actionSkillProbeCli.ts --actor <id> --skill <skillId> [options]",
    "",
    "Run one action skill at a time against a single Mineflayer bot.",
    "This is a narrow live contract runner, not a broad NPC simulation.",
    "",
    "Required:",
    "  --actor <id>              Actor ID (e.g., npc_a, npc_b)",
    "  --skill <skillId>         Seed action skill ID to probe",
    "",
    "Options:",
    "  --max-actions <n>         Max actions per probe (default: 5)",
    "  --init-actor-workspace baseline   Initialize actor workspace before run",
    "  --no-dashboard            Disable the dashboard server",
    "  --dashboard-port <n>      Dashboard port (default: 3099)",
    "  --list-skills             List all implemented seed action skills",
    "  --help                    Show this help",
    "",
    "Examples:",
    "  bun run src/actionSkillProbeCli.ts --actor npc_a --skill collectLogs --max-actions 1",
    "  bun run src/actionSkillProbeCli.ts --actor npc_b --skill craftPlanksAndSticks --init-actor-workspace baseline",
    "  bun run src/actionSkillProbeCli.ts --list-skills"
  ];
  console.log(lines.join("\n"));
}

function printImplementedSkills() {
  const skills = listImplementedSeedActionSkills();
  console.log("Implemented seed action skills:\n");
  for (const skill of skills) {
    console.log(`  ${skill.id}`);
    console.log(`    primitives: ${skill.primitiveIds.join(", ")}`);
    console.log(`    roles:      ${skill.validRoles.join(", ")}`);
    console.log();
  }
}

function formatError(error: unknown): string {
  if (error instanceof AggregateError) {
    return error.errors.map((entry) => formatError(entry)).join("\n");
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function main() {
  let dashboardServer: DashboardServer | null = null;

  try {
    const cliOptions = parseArgs(process.argv.slice(2));

    if (!cliOptions.actor) {
      throw new Error("--actor is required. Use --help for usage.");
    }
    if (!cliOptions.skill) {
      throw new Error("--skill is required. Use --help for usage or --list-skills to see available skills.");
    }

    const skillId = cliOptions.skill as SeedActionSkillId;
    const actorId = cliOptions.actor;
    const maxActions = cliOptions.maxActions ?? 5;

    // Load the seed action skill to determine the correct role
    const { getSeedActionSkill: getSkill } = await import("./gameplay/seedSkills/registry.js");
    const seedSkill = getSkill(skillId);
    const roleId: RoleId = seedSkill.validRoles[0] ?? "gatherer";

    const probeConfig: ActionSkillProbeConfig = {
      actorId,
      skillId,
      roleId,
      maxActions
    };

    validateSkillProbeConfig(probeConfig);

    const { contract, allowedPrimitives } = loadSkillProbeContract(skillId);
    const records = buildSkillProbeActionSkillRecords(probeConfig);

    console.log(`\n─── Action Skill Probe ───`);
    console.log(`  actor:      ${actorId}`);
    console.log(`  skill:      ${skillId}`);
    console.log(`  role:       ${roleId}`);
    console.log(`  max-actions: ${maxActions}`);
    console.log(`  primitives: ${allowedPrimitives.join(", ")}`);
    console.log(`  evidence:   ${contract.evidence.join("; ")}`);
    console.log(`─────────────────────────\n`);

    const preflight = await checkDockerPreflight();
    if (preflight.status === "environment_blocked") {
      console.log(`─── Environment Blocked ───`);
      console.log(`  status: environment_blocked`);
      console.log(`  command: ${dockerPreflightCommand}`);
      console.log(`  reason: ${preflight.reason.split("\n")[0]}`);
      console.log(`───────────────────────────\n`);
      process.exitCode = 1;
      return;
    }

    // Initialize actor workspace if requested
    if (cliOptions.initActorWorkspace) {
      const config = loadProbeConfig();
      const actorRoles = { [actorId]: roleId };
      const seedOwnership = assignSeedActionSkillOwnership([actorId], actorRoles);

      await initializeActorWorkspaces({
        rootDir: config.actorWorkspace.rootDir,
        actors: [{ actor_id: actorId, username: actorId, role_id: roleId }],
        seedActionSkillOwnership: seedOwnership
      });
      console.log(`Actor workspace initialized for ${actorId}`);
    }

    // Start dashboard if not disabled
    if (cliOptions.dashboard !== false) {
      const port = cliOptions.dashboardPort ?? 3099;
      try {
        if ((await probePort(port)).inUse) {
          console.warn(`dashboard already running: http://127.0.0.1:${port}`);
        } else {
          dashboardServer = startDashboardServer(port);
          console.log(`dashboard: ${dashboardServer.url}`);
        }
      } catch (error) {
        console.warn(`dashboard unavailable: ${formatError(error)}`);
      }
    }

    // Print the action skill records the gate will use
    console.log(`Action skill records for gate:`);
    for (const record of records) {
      console.log(`  ${record.skill_id} (${record.status}): ${record.required_primitives.join(", ")}`);
    }
    console.log();

    console.log(`Skill probe config validated. Starting live Mineflayer run.`);
    console.log(`\nVerification contract:`);
    console.log(`  skill: ${contract.skillId}`);
    console.log(`  evidence: ${contract.evidence.length} items`);
    console.log(`  protected by: ${contract.protectedBy.join(", ")}`);
    if (contract.liveProbe) {
      console.log(`  live probe: ${contract.liveProbe}`);
    }

    const result = await runLiveActionSkillProbe(probeConfig);

    console.log(`\n─── Probe Result ───`);
    console.log(`  status: ${result.status}`);
    if (result.terminalStatus) {
      console.log(`  terminal: ${result.terminalStatus}`);
    }
    if (result.postconditionStatus) {
      console.log(`  postcondition: ${result.postconditionStatus}`);
    }
    if (result.failureKind) {
      console.log(`  failure_kind: ${result.failureKind}`);
    }
    if (result.finalWhy) {
      console.log(`  why:    ${result.finalWhy}`);
    }
    if (result.transcriptPath) {
      console.log(`  transcript: ${result.transcriptPath}`);
    }
    if (result.errorMessage) {
      console.log(`  error:  ${result.errorMessage}`);
    }
    console.log(`────────────────────\n`);

    if (result.status !== "passed") {
      process.exitCode = 1;
    }

  } catch (error) {
    console.error(`skill-probe error: ${formatError(error)}`);
    process.exitCode = 1;
  } finally {
    dashboardServer?.stop();
  }
}

void main();
