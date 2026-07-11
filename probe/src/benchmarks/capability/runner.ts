/**
 * Capability runner wrapper around social-cycle for V4 Stage 1 cases.
 *
 * Loads a validated manifest, writes a case declaration before execution,
 * runs the existing social-cycle seam, then adapts evidence and builds the
 * normalized individual-capability report. Does not invent action suggestions
 * from the manifest.
 */

import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { runSocialCycle } from "../../runtime/socialCycleRunner.js";
import type { SocialCycleProviderId } from "../../runtime/goals/types.js";
import { parseWorldScenarioId } from "../../server/worldScenarios.js";
import { adaptSocialCycleReportToEvidenceBag } from "./evidenceBagAdapter.js";
import { applyFurnaceObservationAdapter } from "./furnaceObservationAdapter.js";
import { loadIndividualCapabilityManifestFromFile } from "./loader.js";
import { buildIndividualCapabilityReport } from "./report.js";
import type { IndividualCapabilityReportV1 } from "./reportTypes.js";
import type {
  IndividualCapabilityCaseV1,
  IndividualCapabilityManifestV1
} from "./types.js";

export const CAPABILITY_CASE_DECLARATION_SCHEMA =
  "individual-capability-case-declaration/v1" as const;
export const CAPABILITY_SUITE_INDEX_SCHEMA = "individual-capability-suite-index/v1" as const;
export const CAPABILITY_BUDGET_STATUS_SCHEMA = "capability-budget-status/v1" as const;

export type CapabilityCaseDeclarationV1 = {
  schema: typeof CAPABILITY_CASE_DECLARATION_SCHEMA;
  suite_id: string;
  version: string;
  case_id: string;
  manifest_hash: string;
  world_scenario_id: string;
  seed: string;
  budgets: IndividualCapabilityCaseV1["budgets"];
  provider: {
    provider_id: SocialCycleProviderId;
    model: string;
  };
  provider_free: boolean;
  actor_id: string;
  capability_run_id: string;
  output_paths: {
    run_dir: string;
    declaration: string;
    raw_report: string;
    normalized_report: string;
    budget_status: string;
    suite_index: string;
    actor_workspace: string;
  };
  implementation_revision?: string;
  repeat_index: number;
  connect_to_world: boolean;
  declared_at: string;
};

export type CapabilityBudgetStatusV1 = {
  schema: typeof CAPABILITY_BUDGET_STATUS_SCHEMA;
  case_id: string;
  capability_run_id: string;
  budget_exhausted: boolean;
  exhausted_dimensions: Array<"cycles" | "runtime_actions">;
  target_passed: boolean;
  declared: IndividualCapabilityCaseV1["budgets"];
  observed: {
    cycles: number;
    runtime_actions: number;
  };
};

export type CapabilitySuiteIndexRunV1 = {
  case_id: string;
  capability_run_id: string;
  social_cycle_run_id: string;
  declaration_ref: string;
  raw_report_ref: string;
  normalized_report_ref: string;
  budget_status_ref: string;
  interpretation_status: IndividualCapabilityReportV1["interpretation_status"];
  runtime_status: IndividualCapabilityReportV1["runtime_status"];
  budget_exhausted: boolean;
  provider_id: SocialCycleProviderId;
  model: string;
  seed: string;
  provider_free: boolean;
  completed_at: string;
};

export type CapabilitySuiteIndexV1 = {
  schema: typeof CAPABILITY_SUITE_INDEX_SCHEMA;
  suite_id: string;
  version: string;
  manifest_hash: string;
  updated_at: string;
  runs: CapabilitySuiteIndexRunV1[];
};

export type RunCapabilityCaseInput = {
  manifestPath: string;
  caseId: string;
  outDir: string;
  providerId?: SocialCycleProviderId;
  model?: string;
  seed?: string;
  actorId?: string;
  /** When omitted, defaults offline for deterministic/scripted providers. */
  connectToWorld?: boolean;
  repeatIndex?: number;
  repoRoot?: string;
  /**
   * Optional overrides for fast smoke/debug. When omitted, cycles come from
   * case.budgets.max_cycles and maxActionsPerCycle is derived from
   * max_runtime_actions / max_cycles.
   */
  cycles?: number;
  maxActionsPerCycle?: number;
  implementationRevision?: string | null;
};

export type RunCapabilityCaseResult = {
  declaration: CapabilityCaseDeclarationV1;
  budget_status: CapabilityBudgetStatusV1;
  normalized_report: IndividualCapabilityReportV1;
  suite_index: CapabilitySuiteIndexV1;
  declaration_path: string;
  raw_report_path: string;
  normalized_report_path: string;
  budget_status_path: string;
  suite_index_path: string;
  social_cycle_run_id: string;
};

export class CapabilityRunnerError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "CapabilityRunnerError";
    this.exitCode = exitCode;
  }
}

/** Stable JSON stringify with sorted object keys for content hashing. */
export function stableJsonStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJsonStringify(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(record[key])}`)
    .join(",")}}`;
}

export function hashCapabilityManifest(manifest: IndividualCapabilityManifestV1): string {
  return createHash("sha256").update(stableJsonStringify(manifest)).digest("hex");
}

export function isProviderFree(providerId: SocialCycleProviderId): boolean {
  return providerId === "deterministic-social" || providerId === "scripted-social";
}

export function resolveDefaultModel(providerId: SocialCycleProviderId, model?: string): string {
  const explicit = model?.trim();
  if (explicit) {
    return explicit;
  }
  if (
    providerId === "openai-api" ||
    providerId === "gemini-api" ||
    providerId === "modelscope-api"
  ) {
    throw new CapabilityRunnerError(
      `--model is required for provider ${providerId}; do not rely on env defaults for capability runs`
    );
  }
  return providerId === "scripted-social" ? "scripted-social" : "deterministic-social";
}

export function selectCapabilityCase(
  manifest: IndividualCapabilityManifestV1,
  caseId: string
): IndividualCapabilityCaseV1 {
  const found = manifest.cases.find((entry) => entry.case_id === caseId);
  if (!found) {
    const available = manifest.cases.map((entry) => entry.case_id).join(", ");
    throw new CapabilityRunnerError(
      `Case '${caseId}' not found in suite '${manifest.suite_id}'. Available: ${available}`
    );
  }
  return found;
}

export function resolveCaseSeed(
  capabilityCase: IndividualCapabilityCaseV1,
  seedOverride?: string
): string {
  const explicit = seedOverride?.trim();
  if (explicit) {
    return explicit;
  }
  const policy = capabilityCase.seed_policy;
  if ((policy.kind === "fixed" || policy.kind === "declared_set") && policy.seeds?.[0]) {
    return policy.seeds[0];
  }
  return `fresh-${capabilityCase.case_id}-${randomUUID().slice(0, 8)}`;
}

export function deriveMaxActionsPerCycle(budgets: IndividualCapabilityCaseV1["budgets"]): number {
  return Math.max(1, Math.floor(budgets.max_runtime_actions / budgets.max_cycles));
}

export function countRuntimeActions(report: {
  cycles: Array<{ action_attempts?: unknown[] }>;
}): number {
  let count = 0;
  for (const cycle of report.cycles) {
    if (cycle.action_attempts && cycle.action_attempts.length > 0) {
      count += cycle.action_attempts.length;
    }
  }
  return count;
}

export function evaluateBudgetExhaustion(input: {
  declared: IndividualCapabilityCaseV1["budgets"];
  observedCycles: number;
  observedRuntimeActions: number;
  targetPassed: boolean;
}): {
  budget_exhausted: boolean;
  exhausted_dimensions: Array<"cycles" | "runtime_actions">;
} {
  const exhausted_dimensions: Array<"cycles" | "runtime_actions"> = [];
  if (input.observedCycles >= input.declared.max_cycles) {
    exhausted_dimensions.push("cycles");
  }
  if (input.observedRuntimeActions >= input.declared.max_runtime_actions) {
    exhausted_dimensions.push("runtime_actions");
  }
  const budget_exhausted = exhausted_dimensions.length > 0 && !input.targetPassed;
  return { budget_exhausted, exhausted_dimensions };
}

export function readImplementationRevision(
  repoRoot: string,
  override?: string | null
): string | undefined {
  if (override === null) {
    return undefined;
  }
  if (typeof override === "string" && override.trim().length > 0) {
    return override.trim();
  }
  try {
    const result = spawnSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8"
    });
    if (result.status === 0) {
      const rev = result.stdout.trim();
      if (rev.length > 0) {
        return rev;
      }
    }
  } catch {
    // optional
  }
  return undefined;
}

function relativeUnder(root: string, absolutePath: string): string {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readSuiteIndex(filePath: string): Promise<CapabilitySuiteIndexV1 | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as CapabilitySuiteIndexV1;
    if (parsed?.schema !== CAPABILITY_SUITE_INDEX_SCHEMA) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function runCapabilityCase(
  input: RunCapabilityCaseInput
): Promise<RunCapabilityCaseResult> {
  const manifestPath = path.resolve(input.manifestPath);
  const outDir = path.resolve(input.outDir);
  const repoRoot = input.repoRoot ?? path.resolve(process.cwd(), "..");

  let manifest: IndividualCapabilityManifestV1;
  try {
    manifest = loadIndividualCapabilityManifestFromFile(manifestPath);
  } catch (error) {
    throw new CapabilityRunnerError(
      error instanceof Error ? error.message : `Failed to load manifest: ${String(error)}`
    );
  }

  const capabilityCase = selectCapabilityCase(manifest, input.caseId);
  const worldScenarioId = parseWorldScenarioId(capabilityCase.world_scenario_id);
  if (!worldScenarioId) {
    throw new CapabilityRunnerError(
      `Case '${capabilityCase.case_id}' has unsupported world_scenario_id '${capabilityCase.world_scenario_id}'`
    );
  }

  const providerId = input.providerId ?? "deterministic-social";
  const model = resolveDefaultModel(providerId, input.model);
  const providerFree = isProviderFree(providerId);
  const connectToWorld =
    input.connectToWorld ??
    !(providerId === "deterministic-social" || providerId === "scripted-social");
  const actorId = input.actorId?.trim() || "npc_b";
  const seed = resolveCaseSeed(capabilityCase, input.seed);
  const manifestHash = hashCapabilityManifest(manifest);
  const implementationRevision = readImplementationRevision(
    repoRoot,
    input.implementationRevision
  );
  const cycles = input.cycles ?? capabilityCase.budgets.max_cycles;
  const maxActionsPerCycle =
    input.maxActionsPerCycle ?? deriveMaxActionsPerCycle(capabilityCase.budgets);
  if (!Number.isInteger(cycles) || cycles <= 0 || cycles > capabilityCase.budgets.max_cycles) {
    throw new CapabilityRunnerError(
      `cycles must be a positive integer no greater than declared max_cycles (${capabilityCase.budgets.max_cycles})`
    );
  }
  if (
    !Number.isInteger(maxActionsPerCycle) ||
    maxActionsPerCycle <= 0 ||
    cycles * maxActionsPerCycle > capabilityCase.budgets.max_runtime_actions
  ) {
    throw new CapabilityRunnerError(
      `cycles * maxActionsPerCycle must not exceed declared max_runtime_actions (${capabilityCase.budgets.max_runtime_actions})`
    );
  }
  const repeatIndex = input.repeatIndex ?? 0;
  const capabilityRunId = `capability-${capabilityCase.case_id}-${randomUUID()}`;
  const runDir = path.join(outDir, "cases", capabilityCase.case_id, capabilityRunId);
  const declarationPath = path.join(runDir, "declaration.json");
  const rawReportPath = path.join(runDir, "raw-report.json");
  const normalizedReportPath = path.join(runDir, "normalized-report.json");
  const budgetStatusPath = path.join(runDir, "budget-status.json");
  const suiteIndexPath = path.join(outDir, "suite-index.json");
  const actorWorkspacePath = path.join(runDir, "actor-workspace");

  const declaration: CapabilityCaseDeclarationV1 = {
    schema: CAPABILITY_CASE_DECLARATION_SCHEMA,
    suite_id: manifest.suite_id,
    version: manifest.version,
    case_id: capabilityCase.case_id,
    manifest_hash: manifestHash,
    world_scenario_id: worldScenarioId,
    seed,
    budgets: { ...capabilityCase.budgets },
    provider: {
      provider_id: providerId,
      model
    },
    provider_free: providerFree,
    actor_id: actorId,
    capability_run_id: capabilityRunId,
    output_paths: {
      run_dir: runDir,
      declaration: declarationPath,
      raw_report: rawReportPath,
      normalized_report: normalizedReportPath,
      budget_status: budgetStatusPath,
      suite_index: suiteIndexPath,
      actor_workspace: actorWorkspacePath
    },
    ...(implementationRevision ? { implementation_revision: implementationRevision } : {}),
    repeat_index: repeatIndex,
    connect_to_world: connectToWorld,
    declared_at: new Date().toISOString()
  };

  // Declaration must exist before Minecraft/provider work begins.
  await writeJson(declarationPath, declaration);

  const socialResult = await runSocialCycle({
    actorId,
    providerId,
    model,
    cycles,
    maxActionsPerCycle,
    reportPath: rawReportPath,
    connectToWorld,
    actorWorkspaceRootDir: actorWorkspacePath,
    isolateWorkspace: false,
    worldScenario: worldScenarioId,
    worldSeed: seed,
    repoRoot
    // Intentionally no benchmarkTask: V4 reports require the manifest path.
  });

  const actorDir = path.join(
    socialResult.report.actor_workspace_root_dir ?? actorWorkspacePath,
    actorId
  );
  // Furnace placement is not tracked in settlement known_positions; enrich after
  // the generic adapter. Report builder stays furnace-plan-free.
  const evidenceBag = applyFurnaceObservationAdapter(
    adaptSocialCycleReportToEvidenceBag({
      report: socialResult.report,
      actorDir
    }),
    {
      report: socialResult.report,
      actorDir
    }
  );

  let normalizedReport = buildIndividualCapabilityReport({
    suite_id: manifest.suite_id,
    suite_version: manifest.version,
    case: capabilityCase,
    report: socialResult.report,
    evidence_bag: evidenceBag,
    manifest_hash: manifestHash,
    ...(implementationRevision ? { commit: implementationRevision } : {}),
    raw_report_ref: relativeUnder(runDir, rawReportPath),
    actor_workspace_ref: relativeUnder(runDir, actorWorkspacePath),
    generated_at: new Date().toISOString()
  });

  const observedRuntimeActions = countRuntimeActions(socialResult.report);
  const budgetEval = evaluateBudgetExhaustion({
    declared: capabilityCase.budgets,
    observedCycles: socialResult.report.cycles.length,
    observedRuntimeActions,
    targetPassed: normalizedReport.target.status === "passed"
  });

  if (budgetEval.budget_exhausted) {
    const note = `Budget exhausted without target pass (${budgetEval.exhausted_dimensions.join(", ")}).`;
    normalizedReport = {
      ...normalizedReport,
      diagnostic_notes: [...normalizedReport.diagnostic_notes, note].sort((a, b) =>
        a.localeCompare(b)
      )
    };
  }

  const budgetStatus: CapabilityBudgetStatusV1 = {
    schema: CAPABILITY_BUDGET_STATUS_SCHEMA,
    case_id: capabilityCase.case_id,
    capability_run_id: capabilityRunId,
    budget_exhausted: budgetEval.budget_exhausted,
    exhausted_dimensions: budgetEval.exhausted_dimensions,
    target_passed: normalizedReport.target.status === "passed",
    declared: { ...capabilityCase.budgets },
    observed: {
      cycles: socialResult.report.cycles.length,
      runtime_actions: observedRuntimeActions
    }
  };

  await writeJson(normalizedReportPath, normalizedReport);
  await writeJson(budgetStatusPath, budgetStatus);

  const completedAt = new Date().toISOString();
  const indexEntry: CapabilitySuiteIndexRunV1 = {
    case_id: capabilityCase.case_id,
    capability_run_id: capabilityRunId,
    social_cycle_run_id: socialResult.report.run_id,
    declaration_ref: relativeUnder(outDir, declarationPath),
    raw_report_ref: relativeUnder(outDir, rawReportPath),
    normalized_report_ref: relativeUnder(outDir, normalizedReportPath),
    budget_status_ref: relativeUnder(outDir, budgetStatusPath),
    interpretation_status: normalizedReport.interpretation_status,
    runtime_status: normalizedReport.runtime_status,
    budget_exhausted: budgetEval.budget_exhausted,
    provider_id: providerId,
    model,
    seed,
    provider_free: providerFree,
    completed_at: completedAt
  };

  const existingIndex = await readSuiteIndex(suiteIndexPath);
  const suiteIndex: CapabilitySuiteIndexV1 = {
    schema: CAPABILITY_SUITE_INDEX_SCHEMA,
    suite_id: manifest.suite_id,
    version: manifest.version,
    manifest_hash: manifestHash,
    updated_at: completedAt,
    runs: [...(existingIndex?.runs ?? []), indexEntry]
  };
  await writeJson(suiteIndexPath, suiteIndex);

  return {
    declaration,
    budget_status: budgetStatus,
    normalized_report: normalizedReport,
    suite_index: suiteIndex,
    declaration_path: declarationPath,
    raw_report_path: rawReportPath,
    normalized_report_path: normalizedReportPath,
    budget_status_path: budgetStatusPath,
    suite_index_path: suiteIndexPath,
    social_cycle_run_id: socialResult.report.run_id
  };
}

export async function runCapabilityCaseRepeats(
  input: RunCapabilityCaseInput & { repeat?: number }
): Promise<RunCapabilityCaseResult[]> {
  const repeat = Math.max(1, input.repeat ?? 1);
  const results: RunCapabilityCaseResult[] = [];
  for (let index = 0; index < repeat; index++) {
    results.push(
      await runCapabilityCase({
        ...input,
        repeatIndex: index
      })
    );
  }
  return results;
}
