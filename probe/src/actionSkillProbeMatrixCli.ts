import type { SeedActionSkillId } from "./gameplay/seedSkills/registry.js";
import { listImplementedSeedActionSkills } from "./gameplay/seedSkills/registry.js";
import { getActionSkillVerificationContract } from "./gameplay/seedSkills/verificationContracts.js";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RoleId } from "./npc/roles/contracts.js";
import { loadProbeConfig } from "./config.js";
import { initializeActorWorkspaces } from "./runtime/actorWorkspace.js";
import {
  actionSkillPostconditionSpecs,
  getActionSkillProbePreconditionMode,
  hasDeterministicActionSkillProbeDriver,
  runLiveActionSkillProbe,
  validateProbePostcondition,
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
  auditExistingEvidence?: boolean;
  evidenceDir?: string;
  reportPath?: string;
};

type ProbeMatrixCase = ActionSkillProbeConfig & {
  summary: string;
  preconditions: string[];
  probePreconditionMode: string;
  readinessItems: ProbeMatrixReadinessItem[];
  primitiveIds: string[];
  contractEvidence: string[];
  postconditionEvidence: string[];
};

export type ProbeMatrixVerdict = "passed" | "failed" | "environment_blocked" | "incomplete";

export type ProbeMatrixReadinessItem = {
  id:
    | "implemented_seed_action_skill"
    | "role_selected"
    | "primitive_ownership_declared"
    | "verification_contract_declared"
    | "postcondition_spec_declared"
    | "deterministic_probe_driver_declared"
    | "probe_precondition_mode_declared";
  status: "ready";
  detail: string;
};

export type ProbeMatrixEvidenceGap = {
  skillId: SeedActionSkillId;
  status: "pending_live_evidence" | "environment_blocked" | "failed" | "error";
  evidenceScope: ProbeMatrixEvidenceScope;
  reason: string;
  terminalStatus?: string;
  terminalWhy?: string;
  postconditionStatus?: "passed" | "failed";
  postconditionFailure?: string;
  failureKind?: "terminal_failed" | "postcondition_failed" | "terminal_and_postcondition_failed";
  requiredEvidence: {
    contract: string[];
    postcondition: string[];
  };
  transcriptPath?: string;
  freshEvidenceCommand: string;
};

export type ProbeMatrixSkillStatus = {
  skillId: SeedActionSkillId;
  status: "passed" | "pending_live_evidence" | "environment_blocked" | "failed" | "error";
  evidenceScope: ProbeMatrixEvidenceScope;
  reason: string;
  terminalStatus?: string;
  terminalWhy?: string;
  postconditionStatus?: "passed" | "failed";
  postconditionFailure?: string;
  failureKind?: "terminal_failed" | "postcondition_failed" | "terminal_and_postcondition_failed";
  requiredEvidence: {
    contract: string[];
    postcondition: string[];
  };
  transcriptPath?: string;
  freshEvidenceCommand: string;
};

export type ProbeMatrixEvidenceScope =
  | "current_run"
  | "historical_transcript"
  | "missing"
  | "environment_blocked";

export type ProbeMatrixStatusCounts = {
  passed: number;
  failed: number;
  error: number;
  pendingLiveEvidence: number;
  environmentBlocked: number;
};

export type ProbeMatrixEvidenceScopeCounts = {
  currentRun: number;
  historicalTranscript: number;
  missing: number;
  environmentBlocked: number;
};

export type ProbeMatrixReport = {
  schema: "action-skill-probe-matrix-report/v1";
  mode: "dry_run" | "live" | "evidence_audit";
  createdAt: string;
  actorId: string;
  maxActions: number;
  cases: ProbeMatrixCase[];
  preflight?: ProbeMatrixPreflight;
  results?: ActionSkillProbeResult[];
  verdict: ProbeMatrixVerdict;
  skillStatuses: ProbeMatrixSkillStatus[];
  evidenceGaps: ProbeMatrixEvidenceGap[];
  nextActions: ProbeMatrixNextAction[];
  summary: {
    passed: number;
    failed: number;
    error: number;
    completed: number;
    planned: number;
    statusCounts: ProbeMatrixStatusCounts;
    evidenceScopeCounts: ProbeMatrixEvidenceScopeCounts;
  };
};

export type ProbeMatrixNextAction = {
  kind:
    | "run_fresh_live_probe"
    | "fix_failed_probe"
    | "restore_environment";
  skillId?: SeedActionSkillId;
  skillIds?: SeedActionSkillId[];
  priority: "P0";
  reason: string;
  command?: string;
  evidenceScope: ProbeMatrixEvidenceScope;
  requiredEvidence?: {
    contract: string[];
    postcondition: string[];
  };
};

const dockerPreflightCommand = "docker info --format '{{.ServerVersion}}'";

function buildProbeMatrixReadinessItems(input: {
  skillId: SeedActionSkillId;
  roleId: RoleId;
  primitiveIds: string[];
  contractEvidence: string[];
  postconditionEvidence: string[];
  probePreconditionMode: string;
}): ProbeMatrixReadinessItem[] {
  return [
    {
      id: "implemented_seed_action_skill",
      status: "ready",
      detail: `${input.skillId} is implemented in the seed action skill registry`
    },
    {
      id: "role_selected",
      status: "ready",
      detail: `probe role ${input.roleId} is valid for ${input.skillId}`
    },
    {
      id: "primitive_ownership_declared",
      status: "ready",
      detail: input.primitiveIds.join(", ")
    },
    {
      id: "verification_contract_declared",
      status: "ready",
      detail: `${input.contractEvidence.length} contract evidence item(s)`
    },
    {
      id: "postcondition_spec_declared",
      status: "ready",
      detail: `${input.postconditionEvidence.length} postcondition evidence item(s)`
    },
    {
      id: "deterministic_probe_driver_declared",
      status: "ready",
      detail: hasDeterministicActionSkillProbeDriver(input.skillId)
        ? "deterministic probe driver exists"
        : "deterministic probe driver missing"
    },
    {
      id: "probe_precondition_mode_declared",
      status: "ready",
      detail: input.probePreconditionMode
    }
  ];
}

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
  mode?: ProbeMatrixReport["mode"];
  cases: ProbeMatrixCase[];
  preflight?: ProbeMatrixPreflight;
  results?: ActionSkillProbeResult[];
}): ProbeMatrixEvidenceGap[] {
  const resultsBySkill = new Map((input.results ?? []).map((result) => [result.skillId, result]));

  return input.cases.flatMap((testCase): ProbeMatrixEvidenceGap[] => {
    const result = resultsBySkill.get(testCase.skillId);
    const freshEvidenceCommand = buildFreshEvidenceCommand(testCase);
    const requiredEvidence = {
      contract: [...testCase.contractEvidence],
      postcondition: [...testCase.postconditionEvidence]
    };

    if (!result) {
      if (input.preflight?.status === "environment_blocked") {
        return [{
          skillId: testCase.skillId,
          status: "environment_blocked",
          evidenceScope: "environment_blocked",
          reason: input.preflight.reason,
          requiredEvidence,
          freshEvidenceCommand
        }];
      }

      return [{
        skillId: testCase.skillId,
        status: "pending_live_evidence",
        evidenceScope: "missing",
        reason: "live probe has not produced runtime evidence for this action skill",
        requiredEvidence,
        freshEvidenceCommand
      }];
    }

    if (result.status === "passed") {
      return [];
    }

    return [{
      skillId: testCase.skillId,
      status: result.status,
      evidenceScope: input.mode === "evidence_audit" ? "historical_transcript" : "current_run",
      reason: result.errorMessage ?? result.finalWhy ?? "probe did not satisfy the action skill contract",
      ...(result.terminalStatus ? { terminalStatus: result.terminalStatus } : {}),
      ...(result.terminalWhy ? { terminalWhy: result.terminalWhy } : {}),
      ...(result.postconditionStatus ? { postconditionStatus: result.postconditionStatus } : {}),
      ...(result.postconditionFailure ? { postconditionFailure: result.postconditionFailure } : {}),
      ...(result.failureKind ? { failureKind: result.failureKind } : {}),
      requiredEvidence,
      ...(result.transcriptPath ? { transcriptPath: result.transcriptPath } : {}),
      freshEvidenceCommand
    }];
  });
}

export function buildFreshEvidenceCommand(testCase: ActionSkillProbeConfig) {
  return [
    "bun run probe:skill --",
    `--actor ${testCase.actorId}`,
    `--skill ${testCase.skillId}`,
    `--max-actions ${testCase.maxActions}`,
    "--init-actor-workspace baseline",
    "--no-dashboard"
  ].join(" ");
}

export function buildProbeMatrixSkillStatuses(input: {
  mode?: ProbeMatrixReport["mode"];
  cases: ProbeMatrixCase[];
  preflight?: ProbeMatrixPreflight;
  results?: ActionSkillProbeResult[];
}): ProbeMatrixSkillStatus[] {
  const resultsBySkill = new Map((input.results ?? []).map((result) => [result.skillId, result]));

  return input.cases.map((testCase) => {
    const result = resultsBySkill.get(testCase.skillId);
    const freshEvidenceCommand = buildFreshEvidenceCommand(testCase);
    const requiredEvidence = {
      contract: [...testCase.contractEvidence],
      postcondition: [...testCase.postconditionEvidence]
    };

    if (!result) {
      if (input.preflight?.status === "environment_blocked") {
        return {
          skillId: testCase.skillId,
          status: "environment_blocked",
          evidenceScope: "environment_blocked",
          reason: input.preflight.reason,
          requiredEvidence,
          freshEvidenceCommand
        };
      }

      return {
        skillId: testCase.skillId,
        status: "pending_live_evidence",
        evidenceScope: "missing",
        reason: "live probe has not produced runtime evidence for this action skill",
        requiredEvidence,
        freshEvidenceCommand
      };
    }

    return {
      skillId: testCase.skillId,
      status: result.status,
      evidenceScope: input.mode === "evidence_audit" ? "historical_transcript" : "current_run",
      reason:
        result.errorMessage ??
        result.finalWhy ??
        (result.status === "passed"
          ? "probe transcript satisfies the action skill postcondition"
          : "probe did not satisfy the action skill contract"),
      ...(result.terminalStatus ? { terminalStatus: result.terminalStatus } : {}),
      ...(result.terminalWhy ? { terminalWhy: result.terminalWhy } : {}),
      ...(result.postconditionStatus ? { postconditionStatus: result.postconditionStatus } : {}),
      ...(result.postconditionFailure ? { postconditionFailure: result.postconditionFailure } : {}),
      ...(result.failureKind ? { failureKind: result.failureKind } : {}),
      requiredEvidence,
      ...(result.transcriptPath ? { transcriptPath: result.transcriptPath } : {}),
      freshEvidenceCommand
    };
  });
}

export function countProbeMatrixSkillStatuses(
  skillStatuses: readonly ProbeMatrixSkillStatus[]
): ProbeMatrixStatusCounts {
  return {
    passed: skillStatuses.filter((entry) => entry.status === "passed").length,
    failed: skillStatuses.filter((entry) => entry.status === "failed").length,
    error: skillStatuses.filter((entry) => entry.status === "error").length,
    pendingLiveEvidence: skillStatuses.filter((entry) => entry.status === "pending_live_evidence").length,
    environmentBlocked: skillStatuses.filter((entry) => entry.status === "environment_blocked").length
  };
}

export function countProbeMatrixEvidenceScopes(
  skillStatuses: readonly ProbeMatrixSkillStatus[]
): ProbeMatrixEvidenceScopeCounts {
  return {
    currentRun: skillStatuses.filter((entry) => entry.evidenceScope === "current_run").length,
    historicalTranscript: skillStatuses.filter((entry) => entry.evidenceScope === "historical_transcript").length,
    missing: skillStatuses.filter((entry) => entry.evidenceScope === "missing").length,
    environmentBlocked: skillStatuses.filter((entry) => entry.evidenceScope === "environment_blocked").length
  };
}

export function buildProbeMatrixNextActions(
  gaps: readonly ProbeMatrixEvidenceGap[]
): ProbeMatrixNextAction[] {
  const environmentBlocked = gaps.filter((gap) => gap.status === "environment_blocked");
  const actionable = gaps.filter((gap) => gap.status !== "environment_blocked");
  const actions: ProbeMatrixNextAction[] = [];

  if (environmentBlocked.length > 0) {
    actions.push({
      kind: "restore_environment",
      priority: "P0",
      reason: environmentBlocked[0]?.reason ?? "runtime environment is blocked",
      evidenceScope: "environment_blocked",
      command: dockerPreflightCommand,
      skillIds: environmentBlocked.map((gap) => gap.skillId)
    });
  }

  for (const gap of actionable) {
    if (gap.status === "pending_live_evidence") {
      actions.push({
        kind: "run_fresh_live_probe",
        priority: "P0",
        reason: gap.reason,
        evidenceScope: gap.evidenceScope,
        command: gap.freshEvidenceCommand,
        skillId: gap.skillId,
        requiredEvidence: gap.requiredEvidence
      });
      continue;
    }

    actions.push({
      kind: "fix_failed_probe",
      priority: "P0",
      reason: gap.reason,
      evidenceScope: gap.evidenceScope,
      command: gap.freshEvidenceCommand,
      skillId: gap.skillId,
      requiredEvidence: gap.requiredEvidence
    });
  }

  return actions;
}

type ExistingEvidencePayload = {
  metadata?: {
    action_skill_probe?: {
      actor_id?: unknown;
      skill_id?: unknown;
    };
  };
  steps?: unknown;
  final?: {
    status?: unknown;
    why?: unknown;
  };
};

function readTimestampFromEvidenceFile(name: string) {
  const match = name.match(/-(\d+)\.json$/);
  return match ? Number(match[1]) : 0;
}

async function readExistingEvidencePayload(filePath: string): Promise<ExistingEvidencePayload | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as ExistingEvidencePayload;
  } catch {
    return null;
  }
}

export async function auditExistingActionSkillEvidence(input: {
  evidenceDir: string;
  cases: ProbeMatrixCase[];
}): Promise<ActionSkillProbeResult[]> {
  let entries: string[];
  try {
    entries = await readdir(input.evidenceDir);
  } catch {
    return [];
  }

  const caseBySkill = new Map(input.cases.map((testCase) => [testCase.skillId, testCase]));
  const candidates: Array<ActionSkillProbeResult & { timestamp: number }> = [];

  for (const entry of entries) {
    if (!entry.startsWith("action_skill_probe_") || entry.includes("-canonical-") || !entry.endsWith(".json")) {
      continue;
    }

    const filePath = path.join(input.evidenceDir, entry);
    const payload = await readExistingEvidencePayload(filePath);
    const skillId = payload?.metadata?.action_skill_probe?.skill_id;
    if (typeof skillId !== "string" || !caseBySkill.has(skillId as SeedActionSkillId) || !Array.isArray(payload?.steps)) {
      continue;
    }

    const testCase = caseBySkill.get(skillId as SeedActionSkillId);
    if (!testCase) {
      continue;
    }

    const postconditionFailure = await validateProbePostcondition(testCase.skillId, filePath);
    const terminalStatus = typeof payload.final?.status === "string" ? payload.final.status : undefined;
    const terminalWhy = typeof payload.final?.why === "string" ? payload.final.why : undefined;
    candidates.push({
      status: postconditionFailure ? "failed" : "passed",
      skillId: testCase.skillId,
      actorId:
        typeof payload.metadata?.action_skill_probe?.actor_id === "string"
          ? payload.metadata.action_skill_probe.actor_id
          : testCase.actorId,
      contract: getActionSkillVerificationContract(testCase.skillId),
      allowedPrimitives: testCase.primitiveIds as ActionSkillProbeResult["allowedPrimitives"],
      transcriptPath: filePath,
      finalWhy: postconditionFailure ?? terminalWhy ?? "existing transcript satisfies postcondition",
      ...(terminalStatus ? { terminalStatus } : {}),
      ...(terminalWhy ? { terminalWhy } : {}),
      postconditionStatus: postconditionFailure ? "failed" : "passed",
      ...(postconditionFailure ? { postconditionFailure, failureKind: "postcondition_failed" } : {}),
      timestamp: readTimestampFromEvidenceFile(entry)
    });
  }

  const results: ActionSkillProbeResult[] = [];
  for (const testCase of input.cases) {
    const skillCandidates = candidates
      .filter((candidate) => candidate.skillId === testCase.skillId)
      .sort((left, right) => right.timestamp - left.timestamp);
    const latest = skillCandidates[0];
    if (latest) {
      // Historical audit must not cherry-pick an older pass over a newer
      // failure. The report is a review artifact for current behavior, so the
      // newest raw probe transcript is the only honest historical row.
      const { timestamp: _timestamp, ...result } = latest;
      results.push(result);
    }
  }

  return results;
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
      case "--audit-existing-evidence":
        options.auditExistingEvidence = true;
        break;
      case "--evidence-dir":
        options.evidenceDir = next();
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
    "  --audit-existing-evidence Audit existing action skill transcripts without Docker",
    "  --evidence-dir <path>     Evidence directory for --audit-existing-evidence",
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
    const probePreconditionMode = getActionSkillProbePreconditionMode(skill.id);
    if (!probePreconditionMode) {
      throw new Error(`Missing live probe precondition mode for implemented action skill: ${skill.id}`);
    }
    const contract = getActionSkillVerificationContract(skill.id);

    return {
      ...probeConfig,
      summary: skill.summary,
      preconditions: [...skill.preconditions],
      probePreconditionMode,
      primitiveIds: [...skill.primitiveIds],
      contractEvidence: [...contract.evidence],
      postconditionEvidence: [...postconditionSpec.evidenceSummary],
      readinessItems: buildProbeMatrixReadinessItems({
        skillId: skill.id,
        roleId,
        primitiveIds: [...skill.primitiveIds],
        contractEvidence: [...contract.evidence],
        postconditionEvidence: [...postconditionSpec.evidenceSummary],
        probePreconditionMode
      })
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
  const skillStatuses = buildProbeMatrixSkillStatuses({
    mode: input.mode,
    cases: input.cases,
    preflight: input.preflight,
    results
  });
  const summary = {
    passed,
    failed,
    error,
    completed: results.length,
    planned: input.cases.length,
    statusCounts: countProbeMatrixSkillStatuses(skillStatuses),
    evidenceScopeCounts: countProbeMatrixEvidenceScopes(skillStatuses)
  };
  const evidenceGaps = buildProbeMatrixEvidenceGaps({
    mode: input.mode,
    cases: input.cases,
    preflight: input.preflight,
    results
  });

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
    skillStatuses,
    evidenceGaps,
    nextActions: buildProbeMatrixNextActions(evidenceGaps),
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
    console.log(`  probe fixture: ${testCase.probePreconditionMode}`);
    console.log(`  readiness:     ${testCase.readinessItems.map((item) => item.id).join(", ")}`);
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
    console.log(`  ${gap.skillId}: ${gap.status}/${gap.evidenceScope} - ${gap.reason.split("\n")[0]}`);
  }
}

function printStatusCountsSummary(report: ProbeMatrixReport) {
  const counts = report.summary.statusCounts;
  console.log(
    [
      "matrix_status_counts",
      `passed=${counts.passed}`,
      `failed=${counts.failed}`,
      `error=${counts.error}`,
      `pending_live_evidence=${counts.pendingLiveEvidence}`,
      `environment_blocked=${counts.environmentBlocked}`
    ].join(" ")
  );
}

function printEvidenceScopeCountsSummary(report: ProbeMatrixReport) {
  const counts = report.summary.evidenceScopeCounts;
  console.log(
    [
      "matrix_scope_counts",
      `current_run=${counts.currentRun}`,
      `historical_transcript=${counts.historicalTranscript}`,
      `missing=${counts.missing}`,
      `environment_blocked=${counts.environmentBlocked}`
    ].join(" ")
  );
}

function printFreshEvidenceCommands(gaps: readonly ProbeMatrixEvidenceGap[]) {
  if (gaps.length === 0) {
    console.log("matrix_fresh_commands count=0");
    return;
  }

  console.log(`matrix_fresh_commands count=${gaps.length}`);
  for (const gap of gaps.slice(0, 5)) {
    console.log(`  ${gap.skillId}: ${gap.freshEvidenceCommand}`);
  }
}

function printNextActions(actions: readonly ProbeMatrixNextAction[]) {
  if (actions.length === 0) {
    console.log("matrix_next_actions count=0");
    return;
  }

  console.log(`matrix_next_actions count=${actions.length}`);
  for (const action of actions) {
    const skill = action.skillId
      ? `${action.skillId}: `
      : action.skillIds && action.skillIds.length > 0
        ? `${action.skillIds.length} skill(s): `
        : "";
    console.log(`  ${action.priority} ${action.kind} ${skill}${action.reason.split("\n")[0]}`);
    if (action.command) {
      console.log(`    ${action.command}`);
    }
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
      printStatusCountsSummary(report);
      printEvidenceScopeCountsSummary(report);
      printEvidenceGapSummary(report.evidenceGaps);
      printFreshEvidenceCommands(report.evidenceGaps);
      printNextActions(report.nextActions);
      if (options.reportPath) {
        await writeMatrixReport(options.reportPath, report);
      }
      return;
    }

    if (options.auditExistingEvidence) {
      const evidenceDir = options.evidenceDir ?? loadProbeConfig().evidenceDir;
      const auditedResults = await auditExistingActionSkillEvidence({ evidenceDir, cases });
      const report = buildProbeMatrixReport({
        mode: "evidence_audit",
        actorId,
        maxActions: options.maxActions ?? 8,
        cases,
        results: auditedResults
      });

      console.log(`matrix_evidence_audit dir=${evidenceDir}`);
      for (const result of auditedResults) {
        console.log(`─── ${result.skillId} ───`);
        printResult(result);
      }
      console.log(`matrix_summary verdict=${report.verdict} passed=${report.summary.passed} failed=${report.summary.failed} error=${report.summary.error} total=${report.summary.completed}/${report.summary.planned}`);
      printStatusCountsSummary(report);
      printEvidenceScopeCountsSummary(report);
      printEvidenceGapSummary(report.evidenceGaps);
      printFreshEvidenceCommands(report.evidenceGaps);
      printNextActions(report.nextActions);
      if (options.reportPath) {
        await writeMatrixReport(options.reportPath, report);
      }
      if (report.verdict !== "passed") {
        process.exitCode = 1;
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
      printStatusCountsSummary(report);
      printEvidenceScopeCountsSummary(report);
      printEvidenceGapSummary(report.evidenceGaps);
      printFreshEvidenceCommands(report.evidenceGaps);
      printNextActions(report.nextActions);
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
    printStatusCountsSummary(report);
    printEvidenceScopeCountsSummary(report);
    printEvidenceGapSummary(report.evidenceGaps);
    printFreshEvidenceCommands(report.evidenceGaps);
    printNextActions(report.nextActions);

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
