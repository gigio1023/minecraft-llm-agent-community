import type { SeedActionSkillId } from "./gameplay/seedSkills/registry.js";
import { listImplementedSeedActionSkills } from "./gameplay/seedSkills/registry.js";
import { getActionSkillVerificationContract } from "./gameplay/seedSkills/verificationContracts.js";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RoleId } from "./npc/roles/contracts.js";
import { loadProbeConfig } from "./config.js";
import { initializeActorWorkspaces } from "./runtime/actorWorkspace.js";
import {
  actionSkillPostconditionSpecs,
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
  dryRun?: boolean;
  reportPath?: string;
};

type ProbeMatrixCase = ActionSkillProbeConfig & {
  summary: string;
  preconditions: string[];
  primitiveIds: string[];
  contractEvidence: string[];
  postconditionEvidence: string[];
};

export type ProbeMatrixVerdict = "passed" | "failed" | "environment_blocked" | "incomplete";

export type ProbeMatrixEvidenceGap = {
  skillId: SeedActionSkillId;
  status: "pending_live_evidence" | "environment_blocked" | "failed" | "error";
  reason: string;
  requiredEvidence: {
    contract: string[];
    postcondition: string[];
  };
  transcriptPath?: string;
};

export type ProbeMatrixReport = {
  schema: "action-skill-probe-matrix-report/v1";
  mode: "dry_run" | "live";
  createdAt: string;
  actorId: string;
  maxActions: number;
  cases: ProbeMatrixCase[];
  preflight?: ProbeMatrixPreflight;
  results?: ActionSkillProbeResult[];
  verdict: ProbeMatrixVerdict;
  evidenceGaps: ProbeMatrixEvidenceGap[];
  summary: {
    passed: number;
    failed: number;
    error: number;
    completed: number;
    planned: number;
  };
};

export type ProbeMatrixPreflight =
  | { status: "ready" }
  | { status: "environment_blocked"; reason: string };

export function classifyProbeMatrixReport(input: {
  planned: number;
  completed: number;
  passed: number;
  failed: number;
  error: number;
  preflight?: ProbeMatrixPreflight;
}): ProbeMatrixVerdict {
  if (input.preflight?.status === "environment_blocked" && input.completed === 0) {
    return "environment_blocked";
  }

  if (input.failed > 0 || input.error > 0) {
    return "failed";
  }

  if (input.planned > 0 && input.completed === input.planned && input.passed === input.planned) {
    return "passed";
  }

  return "incomplete";
}

export function buildProbeMatrixEvidenceGaps(input: {
  cases: ProbeMatrixCase[];
  preflight?: ProbeMatrixPreflight;
  results?: ActionSkillProbeResult[];
}): ProbeMatrixEvidenceGap[] {
  const resultsBySkill = new Map((input.results ?? []).map((result) => [result.skillId, result]));

  return input.cases.flatMap((testCase): ProbeMatrixEvidenceGap[] => {
    const result = resultsBySkill.get(testCase.skillId);
    const requiredEvidence = {
      contract: [...testCase.contractEvidence],
      postcondition: [...testCase.postconditionEvidence]
    };

    if (!result) {
      if (input.preflight?.status === "environment_blocked") {
        return [{
          skillId: testCase.skillId,
          status: "environment_blocked",
          reason: input.preflight.reason,
          requiredEvidence
        }];
      }

      return [{
        skillId: testCase.skillId,
        status: "pending_live_evidence",
        reason: "live probe has not produced runtime evidence for this action skill",
        requiredEvidence
      }];
    }

    if (result.status === "passed") {
      return [];
    }

    return [{
      skillId: testCase.skillId,
      status: result.status,
      reason: result.errorMessage ?? result.finalWhy ?? "probe did not satisfy the action skill contract",
      requiredEvidence,
      ...(result.transcriptPath ? { transcriptPath: result.transcriptPath } : {})
    }];
  });
}

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
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--report":
        options.reportPath = next();
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
    "  --dry-run                 Print action skill verification checklist without Docker",
    "  --report <path>           Write a JSON matrix report artifact",
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
    const postconditionSpec = actionSkillPostconditionSpecs[skill.id];
    if (!postconditionSpec) {
      throw new Error(`Missing postcondition spec for implemented action skill: ${skill.id}`);
    }
    const contract = getActionSkillVerificationContract(skill.id);

    return {
      ...probeConfig,
      summary: skill.summary,
      preconditions: [...skill.preconditions],
      primitiveIds: [...skill.primitiveIds],
      contractEvidence: [...contract.evidence],
      postconditionEvidence: [...postconditionSpec.evidenceSummary]
    };
  });
}

function runPreflightCommand(command: string, args: readonly string[], timeoutMs: number) {
  return new Promise<{ code: number | null; stdout: string; stderr: string; signal: NodeJS.Signals | null }>(
    (resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ["ignore", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          child.kill("SIGTERM");
        }
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        reject(error);
      });
      child.on("close", (code, signal) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        resolve({ code, stdout: stdout.trim(), stderr: stderr.trim(), signal });
      });
    }
  );
}

export function normalizeDockerPreflightResult(input: {
  code: number | null;
  stdout: string;
  stderr: string;
  signal: NodeJS.Signals | null;
}): ProbeMatrixPreflight {
  if (input.code === 0) {
    return { status: "ready" };
  }

  const reason = [
    input.signal ? `signal=${input.signal}` : `exit_code=${input.code ?? "unknown"}`,
    input.stderr,
    input.stdout
  ].filter(Boolean).join("\n");

  return {
    status: "environment_blocked",
    reason: reason || "docker is unavailable"
  };
}

export async function checkProbeMatrixEnvironment(): Promise<ProbeMatrixPreflight> {
  try {
    const result = await runPreflightCommand("docker", ["info", "--format", "{{.ServerVersion}}"], 5_000);
    return normalizeDockerPreflightResult(result);
  } catch (error) {
    return {
      status: "environment_blocked",
      reason: formatError(error)
    };
  }
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

export function buildProbeMatrixReport(input: {
  mode: ProbeMatrixReport["mode"];
  actorId: string;
  maxActions: number;
  cases: ProbeMatrixCase[];
  preflight?: ProbeMatrixPreflight;
  results?: ActionSkillProbeResult[];
  createdAt?: string;
}): ProbeMatrixReport {
  const results = input.results ?? [];
  const passed = results.filter((result) => result.status === "passed").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const preflightError =
    input.preflight?.status === "environment_blocked" && results.length === 0 ? 1 : 0;
  const error = results.filter((result) => result.status === "error").length + preflightError;
  const summary = {
    passed,
    failed,
    error,
    completed: results.length,
    planned: input.cases.length
  };

  return {
    schema: "action-skill-probe-matrix-report/v1",
    mode: input.mode,
    createdAt: input.createdAt ?? new Date().toISOString(),
    actorId: input.actorId,
    maxActions: input.maxActions,
    cases: input.cases,
    ...(input.preflight ? { preflight: input.preflight } : {}),
    ...(input.results ? { results } : {}),
    verdict: classifyProbeMatrixReport({
      ...summary,
      preflight: input.preflight
    }),
    evidenceGaps: buildProbeMatrixEvidenceGaps({
      cases: input.cases,
      preflight: input.preflight,
      results
    }),
    summary
  };
}

async function writeMatrixReport(reportPath: string, report: ProbeMatrixReport) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`matrix_report ${reportPath}`);
}

function printDryRun(cases: ProbeMatrixCase[]) {
  console.log("Action skill verification checklist:");
  for (const [index, testCase] of cases.entries()) {
    console.log(`─── [${index + 1}/${cases.length}] ${testCase.skillId} ───`);
    console.log(`  role:          ${testCase.roleId}`);
    console.log(`  max-actions:   ${testCase.maxActions}`);
    console.log(`  summary:       ${testCase.summary}`);
    console.log(`  primitives:    ${testCase.primitiveIds.join(", ")}`);
    console.log(`  preconditions: ${testCase.preconditions.length > 0 ? testCase.preconditions.join("; ") : "(none)"}`);
    console.log(`  contract:      ${testCase.contractEvidence.join("; ")}`);
    console.log(`  postcondition: ${testCase.postconditionEvidence.join("; ")}`);
  }
}

function printEvidenceGapSummary(gaps: readonly ProbeMatrixEvidenceGap[]) {
  if (gaps.length === 0) {
    console.log("matrix_evidence_gaps count=0");
    return;
  }

  console.log(`matrix_evidence_gaps count=${gaps.length}`);
  for (const gap of gaps.slice(0, 5)) {
    console.log(`  ${gap.skillId}: ${gap.status} - ${gap.reason.split("\n")[0]}`);
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

    if (options.dryRun) {
      printDryRun(cases);
      const report = buildProbeMatrixReport({
        mode: "dry_run",
        actorId,
        maxActions: options.maxActions ?? 8,
        cases
      });
      console.log(`matrix_dry_run total=${cases.length}`);
      printEvidenceGapSummary(report.evidenceGaps);
      if (options.reportPath) {
        await writeMatrixReport(options.reportPath, report);
      }
      return;
    }

    const preflight = await checkProbeMatrixEnvironment();
    if (preflight.status !== "ready") {
      console.log("matrix_preflight status=environment_blocked");
      console.log(preflight.reason);
      const report = buildProbeMatrixReport({
        mode: "live",
        actorId,
        maxActions: options.maxActions ?? 8,
        cases,
        preflight,
        results: []
      });
      console.log(`matrix_summary verdict=${report.verdict} passed=0 failed=0 error=1 total=0/${cases.length}`);
      printEvidenceGapSummary(report.evidenceGaps);
      if (options.reportPath) {
        await writeMatrixReport(options.reportPath, report);
      }
      process.exitCode = 1;
      return;
    }

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
    const verdict = classifyProbeMatrixReport({
      planned: cases.length,
      completed: results.length,
      passed,
      failed,
      error: errored,
      preflight
    });
    console.log(`matrix_summary verdict=${verdict} passed=${passed} failed=${failed} error=${errored} total=${results.length}/${cases.length}`);
    const report = buildProbeMatrixReport({
      mode: "live",
      actorId,
      maxActions: options.maxActions ?? 8,
      cases,
      preflight,
      results
    });
    printEvidenceGapSummary(report.evidenceGaps);

    if (options.reportPath) {
      await writeMatrixReport(options.reportPath, report);
    }

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
