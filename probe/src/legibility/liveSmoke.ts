import fs from "node:fs/promises";
import path from "node:path";

import {
  createExperimentDeclaration,
  writeExperimentDeclaration
} from "./declaration.js";
import {
  runLiveSharedLegibilitySession
} from "./liveSharedSession.js";
import {
  createPublicHistoryPredictions,
  publicHistoryPredictorArms
} from "./predictors.js";
import { exportPublicHistory } from "./publicHistory.js";
import { scoreLegibilityPredictions } from "./scoring.js";
import type {
  ExperimentDeclarationV1,
  LegibilityScoreReport,
  TransitionRowV1
} from "./types.js";

export type LiveProviderFreeSmokeGate = {
  schema: "legibility-live-provider-free-smoke-gate/v1";
  status: "passed" | "failed";
  provider_spend: 0;
  row_count: number;
  material_grounded_row_count: number;
  full_artifact_chain_written: boolean;
  history_grounded_lift_gate: {
    threshold_macro_f1_lift: number;
    passed: boolean;
    max_lift: number;
    metrics: Array<{
      condition: string;
      layer: string;
      support: number;
      lift: number;
    }>;
  };
  rerun_stability: {
    checked: boolean;
    reason: string;
  };
  notes: string[];
};

export type LiveProviderFreeSmokeResult = {
  outputDir: string;
  declarationPath: string;
  sessionPath: string;
  publicHistoryPath: string;
  predictionsPath: string;
  scoreReportPath: string;
  gatePath: string;
  gate: LiveProviderFreeSmokeGate;
};

const C2G_LIFT_THRESHOLD = 0.05;

async function writeJson(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return filePath;
}

function relative(from: string, to: string) {
  return path.relative(from, to);
}

function routesForDeclaration(declaration: ExperimentDeclarationV1) {
  const assignment = declaration.conditions[0];
  if (!assignment) {
    throw new Error("C2-G live smoke declaration must include a scripted_responder condition");
  }
  const shared = {
    condition: assignment.condition,
    condition_id: assignment.condition_id,
    actor_soul_route: assignment.soul_provenance.actor_soul_route,
    seed_or_reset_id: assignment.seed_reset.seed_or_reset_id,
    ...(assignment.seed_reset.seed_reset_ref
      ? { seed_reset_ref: assignment.seed_reset.seed_reset_ref }
      : {}),
    soul_family_id: assignment.soul_provenance.soul_family_id,
    soul_instance_id: assignment.soul_provenance.soul_instance_id,
    actor_model_family: assignment.soul_provenance.family_holdout.actor_model_family,
    predictor_model_family: assignment.soul_provenance.family_holdout.predictor_model_family
  };
  return [
    {
      actor_id: "npc_d",
      provider_id: "deterministic-social" as const,
      model: "deterministic-social",
      ...shared
    },
    {
      actor_id: "npc_b",
      provider_id: "scripted-social" as const,
      model: "scripted-social",
      ...shared
    }
  ];
}

function isMateriallyGrounded(row: TransitionRowV1) {
  const classes = row.observed_delta.material.classes;
  return (
    classes.some((label) => label !== "unknown_material_delta" && label !== "no_material_delta") &&
    row.observed_delta.material.evidence_refs.some((ref) =>
      ref.startsWith("material-evidence/") || ref.includes("/material-evidence/")
    )
  );
}

function evaluateGate(input: {
  rows: readonly TransitionRowV1[];
  scoreReport: LegibilityScoreReport;
  fullArtifactChainWritten: boolean;
  targetCondition: string;
}): LiveProviderFreeSmokeGate {
  const historyMetrics = input.scoreReport.metrics
    .filter((metric) =>
      metric.condition === input.targetCondition &&
      metric.predictor_arm === "history_grounded" &&
      metric.support > 0
    )
    .map((metric) => ({
      condition: metric.condition,
      layer: metric.layer,
      support: metric.support,
      lift: metric.lift
    }));
  const maxLift = historyMetrics.length === 0
    ? 0
    : Math.max(...historyMetrics.map((metric) => metric.lift));
  const materialGroundedRowCount = input.rows.filter(isMateriallyGrounded).length;
  const liftPassed = maxLift > C2G_LIFT_THRESHOLD;
  const status =
    input.fullArtifactChainWritten &&
    materialGroundedRowCount >= 1 &&
    liftPassed
      ? "passed"
      : "failed";
  return {
    schema: "legibility-live-provider-free-smoke-gate/v1",
    status,
    provider_spend: 0,
    row_count: input.rows.length,
    material_grounded_row_count: materialGroundedRowCount,
    full_artifact_chain_written: input.fullArtifactChainWritten,
    history_grounded_lift_gate: {
      threshold_macro_f1_lift: C2G_LIFT_THRESHOLD,
      passed: liftPassed,
      max_lift: maxLift,
      metrics: historyMetrics
    },
    rerun_stability: {
      checked: false,
      reason: "C2-G rerun stability requires a second invocation against a fresh output directory."
    },
    notes: [
      "C2-G is provider-free; OpenAI/Gemini/ModelScope calls are not made.",
      "Material labels count only when the live runner writes material-access-evidence/v1 from typed runtime tool results."
    ]
  };
}

export async function runLiveProviderFreeSmoke(input: {
  outputDir: string;
  slotsPerActor?: number;
  responseWindowTimeoutAfterSlots?: number;
  worldSeed?: string;
  writtenAt?: string;
}): Promise<LiveProviderFreeSmokeResult> {
  const outputDir = input.outputDir;
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const declaredAt = input.writtenAt ?? new Date().toISOString();
  const declaration = createExperimentDeclaration({
    experimentId: "c2-g-live-provider-free-smoke",
    actorAssignments: [{
      condition: "scripted_responder",
      actorIds: ["npc_d", "npc_b"],
      responderActorIds: ["npc_b"],
      conditionId: "c2-g-live-provider-free-scripted-responder",
      seedOrResetId: "c2-g-live-provider-free-scripted-responder",
      counterbalancing:
        "npc_d deterministic gatherer material primitive, npc_b scripted-social responder"
    }],
    scenarioFamilies: ["c2-live-shared-session-response-window"],
    seedResetRefs: [],
    providerFree: true,
    writtenAt: declaredAt
  });
  const declarationPath = await writeExperimentDeclaration(
    path.join(outputDir, "experiment-declaration.json"),
    declaration
  );

  const sessionResult = await runLiveSharedLegibilitySession({
    outputDir,
    actorRoutes: routesForDeclaration(declaration),
    slotsPerActor: input.slotsPerActor ?? 2,
    responseWindowTimeoutAfterSlots: input.responseWindowTimeoutAfterSlots ?? 1,
    defaultPrimitivesByActor: {
      npc_d: "collect_logs"
    },
    cleanOutputDir: false,
    writtenAt: declaredAt,
    worldSeed: input.worldSeed
  });

  const publicHistory = exportPublicHistory(sessionResult.session, {
    createdAt: new Date().toISOString()
  });
  const publicHistoryPath = await writeJson(
    path.join(outputDir, "public-history.json"),
    publicHistory
  );
  const predictions = createPublicHistoryPredictions({
    publicHistory,
    declaration,
    createdAt: new Date().toISOString(),
    arms: publicHistoryPredictorArms,
    policyCopyMinCount: 1
  });
  const predictionsPath = await writeJson(
    path.join(outputDir, "predictions.json"),
    predictions
  );
  const scoreReport = scoreLegibilityPredictions({
    declaration,
    declarationRef: relative(outputDir, declarationPath),
    publicHistory,
    rows: sessionResult.session.transition_rows,
    predictions,
    scoredAt: new Date().toISOString()
  });
  const scoreReportPath = await writeJson(
    path.join(outputDir, "score-report.json"),
    scoreReport
  );
  const gate = evaluateGate({
    rows: sessionResult.session.transition_rows,
    scoreReport,
    fullArtifactChainWritten: true,
    targetCondition: declaration.conditions[0]?.condition ?? "unknown"
  });
  const gatePath = await writeJson(
    path.join(outputDir, "c2-g-gate-summary.json"),
    gate
  );

  return {
    outputDir,
    declarationPath,
    sessionPath: sessionResult.sessionPath,
    publicHistoryPath,
    predictionsPath,
    scoreReportPath,
    gatePath,
    gate
  };
}
