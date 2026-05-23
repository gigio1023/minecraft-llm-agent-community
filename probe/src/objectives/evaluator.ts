import { promises as fs } from "node:fs";
import path from "node:path";

import type { ObjectiveDefinition, ObjectiveId } from "./registry.js";
import { getObjectiveDefinition } from "./registry.js";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonRecord = Record<string, JsonValue>;

type TranscriptStep = {
  actor?: string;
  tool?: string;
  args?: JsonRecord;
  result?: JsonValue;
  verification?: JsonValue;
};

type TranscriptPayload = {
  probe?: string;
  steps?: TranscriptStep[];
  final?: JsonRecord;
};

export type ObjectiveOracleFinding = {
  kind: "proposal" | "argument" | "evidence";
  status: "passed" | "failed" | "warning";
  message: string;
  stepIndex?: number;
};

export type ObjectiveEvaluationReport = {
  schema: "objective-evaluation-report/v1";
  objectiveId: ObjectiveId;
  status: "passed" | "failed";
  evidenceScope: "current_run" | "historical_transcript";
  transcriptPath: string;
  summary: string;
  findings: ObjectiveOracleFinding[];
  evidence: {
    actorId: string;
    matchedStepIndex?: number;
    tool?: string;
    beforeCount?: number;
    afterCount?: number;
    delta?: number;
    verificationReason?: string;
  };
  nextActions: string[];
};

function isRecord(value: JsonValue | undefined): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberField(value: JsonValue | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringField(value: JsonValue | undefined) {
  return typeof value === "string" ? value : undefined;
}

function getNestedRecord(root: JsonValue | undefined, ...keys: string[]) {
  let cursor = root;
  for (const key of keys) {
    if (!isRecord(cursor)) {
      return undefined;
    }
    cursor = cursor[key];
  }

  return isRecord(cursor) ? cursor : undefined;
}

function getVerification(step: TranscriptStep) {
  const direct = isRecord(step.verification) ? step.verification : undefined;
  if (direct) {
    return direct;
  }

  return getNestedRecord(step.result, "verification");
}

function countConsecutiveObserves(steps: readonly TranscriptStep[], actorId: string) {
  let longest = 0;
  let current = 0;

  for (const step of steps) {
    if (step.actor !== actorId) {
      continue;
    }

    if (step.tool === "observe") {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

function findCollectLogEvidence(steps: readonly TranscriptStep[], objective: ObjectiveDefinition) {
  for (const [index, step] of steps.entries()) {
    if (step.actor !== objective.actorId || step.tool !== "collect_logs") {
      continue;
    }

    const verification = getVerification(step);
    const progress = getNestedRecord(verification, "progress");
    const result = isRecord(step.result) ? step.result : {};
    const beforeCount =
      numberField(progress?.beforeCount) ?? numberField(result.beforeLogCount);
    const afterCount =
      numberField(progress?.afterCount) ?? numberField(result.afterLogCount);
    const toolDelta =
      numberField(progress?.toolInventoryDelta) ?? numberField(result.inventoryDelta);
    const delta =
      toolDelta ?? (beforeCount !== undefined && afterCount !== undefined ? afterCount - beforeCount : undefined);

    if (
      stringField(verification?.status) === "passed" &&
      delta !== undefined &&
      delta >= objective.target.minDelta
    ) {
      return {
        index,
        beforeCount,
        afterCount,
        delta,
        reason: stringField(verification?.reason)
      };
    }
  }

  return null;
}

function buildNextActions(report: Pick<ObjectiveEvaluationReport, "status" | "findings">) {
  if (report.status === "passed") {
    return [];
  }

  const nextActions = new Set<string>();
  for (const finding of report.findings) {
    if (finding.status !== "failed") {
      continue;
    }

    if (finding.kind === "proposal") {
      nextActions.add("Inspect provider outputs for repeated observe or terminal remember proposals.");
    }
    if (finding.kind === "argument") {
      nextActions.add("Tighten provider prompt/normalizer so it emits primitive ids and exact args.");
    }
    if (finding.kind === "evidence") {
      nextActions.add("Run the matching action-skill probe and repair the primitive/verifier boundary.");
    }
  }

  return [...nextActions];
}

export async function evaluateObjectiveTranscript(input: {
  objectiveId: string;
  transcriptPath: string;
  evidenceScope?: "current_run" | "historical_transcript";
  actorId?: string;
}): Promise<ObjectiveEvaluationReport> {
  const objective = {
    ...getObjectiveDefinition(input.objectiveId),
    ...(input.actorId ? { actorId: input.actorId } : {})
  };
  const payload = JSON.parse(await fs.readFile(input.transcriptPath, "utf8")) as TranscriptPayload;
  const steps = Array.isArray(payload.steps) ? payload.steps : [];
  const evidenceScope = input.evidenceScope ?? "current_run";
  const evidence = findCollectLogEvidence(steps, objective);
  const objectiveSteps =
    evidence?.index !== undefined ? steps.slice(0, evidence.index + 1) : steps;
  const findings: ObjectiveOracleFinding[] = [];
  const longestObserveRun = countConsecutiveObserves(objectiveSteps, objective.actorId);

  findings.push({
    kind: "proposal",
    status: longestObserveRun >= 2 ? "failed" : "passed",
    message:
      longestObserveRun >= 2
        ? `Actor ${objective.actorId} repeated observe ${longestObserveRun} times without concrete progress.`
        : `Actor ${objective.actorId} did not enter a repeated observe loop.`
  });

  const rememberBeforeProgress = steps.some(
    (step, index) =>
      step.actor === objective.actorId &&
      step.tool === "remember" &&
      (evidence?.index === undefined || index <= evidence.index)
  );
  if (rememberBeforeProgress) {
    findings.push({
      kind: "proposal",
      status: "warning",
      message: "Terminal remember appeared in the transcript; it is not accepted as objective success."
    });
  }

  const unsupportedTools = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step, index }) =>
      step.actor === objective.actorId &&
      step.tool &&
      (evidence?.index === undefined || index <= evidence.index) &&
      !objective.allowedPrimitives.includes(step.tool as (typeof objective.allowedPrimitives)[number])
    );
  for (const { step, index } of unsupportedTools) {
    findings.push({
      kind: "argument",
      status: "failed",
      message: `Tool ${step.tool} is outside objective allowed primitives.`,
      stepIndex: index
    });
  }

  if (evidence) {
    findings.push({
      kind: "evidence",
      status: "passed",
      message: `Current transcript shows collect_logs inventory delta ${evidence.delta}.`,
      stepIndex: evidence.index
    });
  } else {
    findings.push({
      kind: "evidence",
      status: "failed",
      message: "No current-run collect_logs step had passed verification and positive inventory delta."
    });
  }

  const status = findings.some((finding) => finding.status === "failed") ? "failed" : "passed";
  const report: ObjectiveEvaluationReport = {
    schema: "objective-evaluation-report/v1",
    objectiveId: objective.id,
    status,
    evidenceScope,
    transcriptPath: path.resolve(input.transcriptPath),
    summary:
      status === "passed"
        ? `${objective.id} passed from ${evidenceScope} evidence.`
        : `${objective.id} failed; objective success was not proven from ${evidenceScope} evidence.`,
    findings,
    evidence: {
      actorId: objective.actorId,
      ...(evidence
        ? {
            matchedStepIndex: evidence.index,
            tool: "collect_logs",
            beforeCount: evidence.beforeCount,
            afterCount: evidence.afterCount,
            delta: evidence.delta,
            verificationReason: evidence.reason
          }
        : {})
    },
    nextActions: []
  };
  report.nextActions = buildNextActions(report);

  return report;
}
