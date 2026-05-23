/**
 * Exports all provider input/output snapshots referenced by a social-cycle run report.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadProbeConfig } from "../src/config.js";
import type { SocialCycleRunReport } from "../src/runtime/goals/types.js";

const STAGES = ["goal_mind", "action_planner", "cycle_judgment"] as const;

type Snapshot = {
  schema: string;
  snapshot_id: string;
  provider_id: string;
  model: string;
  created_at: string;
  input?: Record<string, unknown>;
  raw_output_text?: string;
  parsed_output?: unknown;
};

function pickInputSummary(input: Record<string, unknown> | undefined) {
  if (!input) return {};
  const soul = input.ActorSoul as Record<string, unknown> | undefined;
  const life = input.ActorLifeGoal as Record<string, unknown> | undefined;
  const worldEvents = Array.isArray(input.world_events)
    ? (input.world_events as Array<{ summary?: string; kind?: string }>).map((e) => e.summary)
    : [];
  const prior = Array.isArray(input.previous_cycle_judgments)
    ? (input.previous_cycle_judgments as Array<{ cycle_id?: string; what_happened?: string; outcome?: string }>)
    : [];
  return {
    stage: input.stage,
    soul_life_goal: soul?.life_goal,
    life_objective: life?.objective,
    world_event_summaries: worldEvents,
    previous_judgments: prior.map((p) => ({
      cycle_id: p.cycle_id,
      outcome: p.outcome,
      what_happened: p.what_happened?.slice(0, 200)
    })),
    cycle_goal: input.cycle_goal,
    action_intent: input.action_intent,
    runtime_result: input.runtime_result,
    verifier_status: input.verifier_status,
    evidence_refs: input.evidence_refs
  };
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

async function main() {
  const reportPath = path.resolve(process.argv[2] ?? "");
  const outPath = path.resolve(
    process.argv[3] ?? reportPath.replace(/\.json$/i, "-llm-io.md")
  );

  if (!reportPath) {
    console.error("Usage: bun run scripts/exportSocialCycleLlmIo.ts <report.json> [out.md]");
    process.exit(1);
  }

  const report = JSON.parse(await fs.readFile(reportPath, "utf8")) as SocialCycleRunReport;
  const actorDir = path.join(loadProbeConfig().actorWorkspace.rootDir, report.actor_id);

  const lines: string[] = [
    `# Social cycle LLM I/O — ${report.actor_id}`,
    "",
    `- run_id: \`${report.run_id}\``,
    `- model: \`${report.provider.model}\``,
    `- cycles: ${report.cycles.length}`,
    `- runtime_status: ${report.runtime_status}`,
    "",
    "## Design note",
    "",
    "Every LLM call includes `ActorSoul` + `ActorLifeGoal` in provider input (see snapshots).",
    "WorldEvents are pressure, not LifeGoal replacement.",
    ""
  ];

  for (const cycle of report.cycles) {
    lines.push(`---`, "", `## ${cycle.cycle_id}`, "");
    lines.push(`- cycle_goal_ref: \`${cycle.cycle_goal_ref}\``);
    lines.push(`- action_intent_ref: \`${cycle.action_intent_ref}\``);
    lines.push(`- judgment_ref: \`${cycle.judgment_ref}\``);
    lines.push(`- verifier: ${cycle.verifier_status}`);
    lines.push("");

    for (let i = 0; i < STAGES.length; i++) {
      const stage = STAGES[i]!;
      const inRef = cycle.provider_input_refs[i];
      const outRef = cycle.provider_output_refs[i];
      if (!inRef || !outRef) continue;

      const inputSnap = JSON.parse(
        await fs.readFile(path.join(actorDir, inRef), "utf8")
      ) as Snapshot;
      const outputSnap = JSON.parse(
        await fs.readFile(path.join(actorDir, outRef), "utf8")
      ) as Snapshot;

      lines.push(`### ${stage}`, "");
      lines.push(`**Input** (\`${inRef}\`)`, "");
      lines.push("```json");
      lines.push(formatJson(pickInputSummary(inputSnap.input as Record<string, unknown>)));
      lines.push("```", "");
      lines.push(`**Output** (\`${outRef}\`)`, "");
      if (outputSnap.raw_output_text?.trim()) {
        lines.push("```json");
        lines.push(outputSnap.raw_output_text);
        lines.push("```", "");
      }
      lines.push("<details><summary>parsed_output</summary>", "");
      lines.push("```json");
      lines.push(formatJson(outputSnap.parsed_output));
      lines.push("```", "", "</details>", "");
    }
  }

  await fs.writeFile(outPath, lines.join("\n"), "utf8");
  console.log(JSON.stringify({ written: outPath, bytes: lines.join("\n").length }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
