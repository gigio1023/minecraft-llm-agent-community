import fs from "node:fs/promises";
import path from "node:path";

import { loadProbeConfig } from "../../config.js";
import type { CycleJudgment, SocialCycleRunReport } from "./types.js";
import { readJsonIfExists } from "./goalJsonStore.js";
import type { ActionIntent } from "./types.js";

export type CycleReviewRow = {
  cycle_id: string;
  cycle_goal_summary: string;
  action_kind: string;
  primitive_or_skill: string;
  verifier_status: string;
  judgment_outcome: string;
  what_happened: string;
  cites_prior: boolean;
  evidence_count: number;
};

export type SocialCycleReviewSummary = {
  schema: "social-cycle-review-summary/v1";
  report_path: string;
  actor_id: string;
  run_id: string;
  provider_model: string;
  runtime_status: string;
  total_cycles: number;
  outcome_counts: Record<string, number>;
  verifier_counts: Record<string, number>;
  primitive_counts: Record<string, number>;
  cycles_with_prior_judgment_context: number;
  rows: CycleReviewRow[];
};

async function readJudgment(actorDir: string, ref: string) {
  return readJsonIfExists<CycleJudgment>(path.join(actorDir, ref));
}

async function readIntent(actorDir: string, ref: string) {
  return readJsonIfExists<ActionIntent>(path.join(actorDir, ref));
}

async function readCycleGoalSummary(actorDir: string, ref: string) {
  const goal = await readJsonIfExists<{ summary?: string }>(path.join(actorDir, ref));
  return goal?.summary ?? ref;
}

export async function buildSocialCycleReviewSummary(
  reportPath: string,
  actorWorkspaceRoot?: string
): Promise<SocialCycleReviewSummary> {
  const report = JSON.parse(await fs.readFile(reportPath, "utf8")) as SocialCycleRunReport;
  const actorDir =
    actorWorkspaceRoot ??
    path.join(loadProbeConfig().actorWorkspace.rootDir, report.actor_id);

  const outcome_counts: Record<string, number> = {};
  const verifier_counts: Record<string, number> = {};
  const primitive_counts: Record<string, number> = {};
  let cycles_with_prior_judgment_context = 0;

  const rows: CycleReviewRow[] = [];

  for (const cycle of report.cycles) {
    const judgment = await readJudgment(actorDir, cycle.judgment_ref);
    const intent = await readIntent(actorDir, cycle.action_intent_ref);
    const cycleGoalSummary = await readCycleGoalSummary(actorDir, cycle.cycle_goal_ref);

    const outcome = judgment?.outcome ?? "missing";
    const verifier = cycle.verifier_status;
    outcome_counts[outcome] = (outcome_counts[outcome] ?? 0) + 1;
    verifier_counts[verifier] = (verifier_counts[verifier] ?? 0) + 1;

    const primitiveOrSkill =
      intent?.kind === "use_primitive"
        ? (intent.primitive_id ?? "?")
        : intent?.kind === "use_action_skill"
          ? (intent.action_skill_id ?? "?")
          : (intent?.kind ?? "?");
    primitive_counts[primitiveOrSkill] = (primitive_counts[primitiveOrSkill] ?? 0) + 1;

    const cycleGoalProviderInput = await readJsonIfExists<{
      input?: { previous_cycle_judgments?: unknown[] };
    }>(path.join(actorDir, cycle.provider_input_refs[0] ?? ""));
    const citesPrior = (cycleGoalProviderInput?.input?.previous_cycle_judgments?.length ?? 0) > 0;
    if (citesPrior) {
      cycles_with_prior_judgment_context += 1;
    }

    rows.push({
      cycle_id: cycle.cycle_id,
      cycle_goal_summary: cycleGoalSummary,
      action_kind: intent?.kind ?? "missing",
      primitive_or_skill: primitiveOrSkill,
      verifier_status: verifier,
      judgment_outcome: outcome,
      what_happened: judgment?.what_happened ?? "",
      cites_prior: citesPrior,
      evidence_count: cycle.evidence_refs.length
    });
  }

  return {
    schema: "social-cycle-review-summary/v1",
    report_path: reportPath,
    actor_id: report.actor_id,
    run_id: report.run_id,
    provider_model: report.provider.model,
    runtime_status: report.runtime_status,
    total_cycles: report.cycles.length,
    outcome_counts,
    verifier_counts,
    primitive_counts,
    cycles_with_prior_judgment_context,
    rows
  };
}

export function formatReviewSummaryMarkdown(summary: SocialCycleReviewSummary): string {
  const lines: string[] = [
    `# Social cycle review — ${summary.actor_id}`,
    "",
    `- run_id: \`${summary.run_id}\``,
    `- model: \`${summary.provider_model}\``,
    `- runtime_status: **${summary.runtime_status}**`,
    `- cycles in report: **${summary.total_cycles}**`,
    `- cycles citing prior judgment in CycleGoal provider: **${summary.cycles_with_prior_judgment_context}**`,
    "",
    "## Outcome distribution",
    "",
    ...Object.entries(summary.outcome_counts).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "## Primitive / skill usage",
    "",
    ...Object.entries(summary.primitive_counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `- ${k}: ${v}`),
    "",
    "## Cycle timeline",
    "",
    "| cycle | outcome | verifier | action | CycleGoal (short) | cites prior |",
    "|-------|---------|----------|--------|-------------------|-------------|"
  ];

  for (const row of summary.rows) {
    const goal = row.cycle_goal_summary.replace(/\|/g, "/").slice(0, 60);
    const action = `${row.action_kind}:${row.primitive_or_skill}`;
    lines.push(
      `| ${row.cycle_id} | ${row.judgment_outcome} | ${row.verifier_status} | ${action} | ${goal} | ${row.cites_prior ? "yes" : "no"} |`
    );
  }

  lines.push("", "## Last 5 judgments (detail)", "");
  for (const row of summary.rows.slice(-5)) {
    lines.push(`### ${row.cycle_id}`, "", row.what_happened, "");
  }

  return lines.join("\n");
}
