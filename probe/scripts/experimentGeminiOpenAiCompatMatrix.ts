import { promises as fs } from "node:fs";
import path from "node:path";

import OpenAI from "openai";

import { assertDirectGeneratedActionSkillSource } from "../src/generatedActionSkills/directExecutor.js";
import { getLongPhaseDefinition, type LongPhaseId } from "../src/objectives/longObjective/ladder.js";
import { loadGeminiApiKey } from "../src/provider/gemini/auth.js";
import { flushTracing, startTracing, traceGeneration } from "../src/mutual/skillVillage/tracing.js";

const GEMINI_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

/** Free-tier candidates (user-supplied limits in plan). */
const MODEL_CANDIDATES = [
  { id: "gemma-4-31b-it", tier: "gemma-4-31b rpm15 tpm∞ rpd1.5k" },
  { id: "gemma-4-26b-a4b-it", tier: "gemma-4-26b-a4b" },
  { id: "gemini-3.1-flash-lite", tier: "gemini-3.1-flash-lite rpm15 tpm250k rpd500" },
  { id: "gemini-2.5-flash", tier: "baseline text-genai" }
] as const;

const PHASE_IDS: LongPhaseId[] = [
  "craft_current_run_stone_pickaxe_1",
  "obtain_current_run_iron_ingot_1",
  "craft_current_run_iron_pickaxe_1"
];

type OutputMode = "codegen_ts" | "json_object";

type JobSpec = {
  jobId: string;
  model: string;
  phaseId: LongPhaseId;
  outputMode: OutputMode;
};

type JobResult = {
  jobId: string;
  model: string;
  phaseId: LongPhaseId;
  outputMode: OutputMode;
  elapsedMs: number;
  ok: boolean;
  error?: string;
  finishReason?: string;
  usage?: OpenAI.Completions.CompletionUsage;
  messageRoles: string[];
  sandbox?: "PASS" | "EMPTY" | `FAIL: ${string}`;
  jsonParseOk?: boolean;
  jsonHasToolArgs?: boolean;
  preview: string;
};

const SYSTEM_CODEGEN = [
  "You are a Minecraft Mineflayer direct-generated action skill planner.",
  "Return only TypeScript source. Do not wrap it in markdown.",
  "The source must export exactly: export async function run(ctx) { ... }",
  "Never use import, require, eval, or Node APIs.",
  "Use the ctx helper API only."
].join("\n");

const SYSTEM_JSON = [
  "Return exactly one JSON object with keys tool, args, and optional why.",
  "Do not wrap the JSON in markdown fences.",
  "tool must be a short string; args must be an object."
].join("\n");

function buildPhaseUserContent(phaseId: LongPhaseId): string {
  const phase = getLongPhaseDefinition(phaseId);
  return [
    `Phase objective: ${phase.summary}`,
    `Success criteria: current-run evidence for ${phase.targetItemName} >= ${phase.minCount}`,
    `Helper hints: ${phase.helperHints.join(", ")}`,
    JSON.stringify({
      objective_id: "openai-compat-matrix",
      phase_id: phase.phaseId,
      actor_id: "npc_b",
      inventory: [{ name: "stone_axe", count: 1 }],
      memory: null
    })
  ].join("\n");
}

function buildMessages(phaseId: LongPhaseId, outputMode: OutputMode): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const system = outputMode === "codegen_ts" ? SYSTEM_CODEGEN : SYSTEM_JSON;
  return [
    { role: "system", content: system },
    { role: "user", content: buildPhaseUserContent(phaseId) }
  ];
}

function sandboxTs(text: string): JobResult["sandbox"] {
  const trimmed = text.trim();
  if (!trimmed) return "EMPTY";
  try {
    assertDirectGeneratedActionSkillSource(trimmed);
    return "PASS";
  } catch (error) {
    return `FAIL: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function evaluateJson(text: string) {
  try {
    const parsed = JSON.parse(text) as { tool?: unknown; args?: unknown };
    return {
      jsonParseOk: true,
      jsonHasToolArgs: typeof parsed.tool === "string" && typeof parsed.args === "object" && parsed.args !== null
    };
  } catch {
    return { jsonParseOk: false, jsonHasToolArgs: false };
  }
}

async function runJob(client: OpenAI, spec: JobSpec): Promise<JobResult> {
  const started = Date.now();
  const messages = buildMessages(spec.phaseId, spec.outputMode);

  try {
    const completion = await traceGeneration(
      `gemini-openai-compat/${spec.jobId}`,
      { messages, model: spec.model, outputMode: spec.outputMode },
      {
        provider: "gemini-openai-compat",
        model: spec.model,
        phaseId: spec.phaseId,
        outputMode: spec.outputMode,
        messageStructure: "system+user (long-objective shape)"
      },
      () =>
        client.chat.completions.create({
          model: spec.model,
          messages,
          ...(spec.outputMode === "json_object"
            ? { response_format: { type: "json_object" as const } }
            : {}),
          temperature: 0.2
        })
    );

    const choice = completion.choices[0];
    const content = choice?.message?.content?.trim() ?? "";
    const base: JobResult = {
      jobId: spec.jobId,
      model: spec.model,
      phaseId: spec.phaseId,
      outputMode: spec.outputMode,
      elapsedMs: Date.now() - started,
      ok: Boolean(content),
      finishReason: choice?.finish_reason ?? undefined,
      usage: completion.usage ?? undefined,
      messageRoles: messages.map((m) => m.role),
      preview: content.replace(/\s+/g, " ").slice(0, 160)
    };

    if (spec.outputMode === "codegen_ts") {
      return { ...base, sandbox: sandboxTs(content) };
    }

    const jsonEval = evaluateJson(content);
    return {
      ...base,
      ...jsonEval,
      ok: base.ok && jsonEval.jsonParseOk && jsonEval.jsonHasToolArgs
    };
  } catch (error) {
    return {
      jobId: spec.jobId,
      model: spec.model,
      phaseId: spec.phaseId,
      outputMode: spec.outputMode,
      elapsedMs: Date.now() - started,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      messageRoles: messages.map((m) => m.role),
      preview: ""
    };
  }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function main() {
  const repoRoot = path.resolve(process.cwd(), "..");
  const apiKey = await loadGeminiApiKey(repoRoot);
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing (build/provider-auth/gemini-live.env)");
  }

  const client = new OpenAI({ apiKey, baseURL: GEMINI_OPENAI_BASE_URL });

  const plan = {
    hypothesis: [
      "OpenAI SDK chat.completions against Gemini OpenAI-compat endpoint preserves system+user messages.",
      "json_object response_format behaves like OpenAI Codex-style structured output.",
      "codegen_ts produces sandbox-valid export async function run(ctx) for upper ladder phases.",
      "Gemma 4 31B tolerates parallel load better (higher RPD)."
    ],
    models: MODEL_CANDIDATES,
    phases: PHASE_IDS,
    outputModes: ["codegen_ts", "json_object"] as const,
    parallelLimit: 4,
    parameters: { temperature: 0.2, baseURL: GEMINI_OPENAI_BASE_URL }
  };

  const jobs: JobSpec[] = [];
  for (const model of MODEL_CANDIDATES) {
    for (const phaseId of PHASE_IDS) {
      for (const outputMode of ["codegen_ts", "json_object"] as const) {
        jobs.push({
          jobId: `${model.id}__${phaseId}__${outputMode}`,
          model: model.id,
          phaseId,
          outputMode
        });
      }
    }
  }

  console.log("=== Gemini OpenAI-compat experiment plan ===");
  console.log(JSON.stringify(plan, null, 2));
  console.log(`jobs=${jobs.length} parallel=${plan.parallelLimit}\n`);

  startTracing();
  const startedAll = Date.now();

  const results = await mapPool(jobs, plan.parallelLimit, (job) => runJob(client, job));
  await flushTracing();

  const report = {
    schema: "gemini-openai-compat-matrix-report/v1",
    created_at: new Date().toISOString(),
    elapsedMs: Date.now() - startedAll,
    plan,
    results
  };

  const reportPath = path.join(repoRoot, "tmp/gemini-openai-compat-matrix-report.json");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("\n=== Results (codegen_ts sandbox) ===\n");
  console.log("model\tphase\tsandbox\tms\terror");
  for (const row of results.filter((r) => r.outputMode === "codegen_ts")) {
    console.log(
      [row.model, row.phaseId, row.sandbox ?? "-", row.elapsedMs, row.error ?? "-"].join("\t")
    );
    if (row.preview) console.log(`  ${row.preview}`);
  }

  console.log("\n=== Results (json_object structured) ===\n");
  console.log("model\tphase\tparse\ttool+args\tms\terror");
  for (const row of results.filter((r) => r.outputMode === "json_object")) {
    console.log(
      [
        row.model,
        row.phaseId,
        row.jsonParseOk ? "yes" : "no",
        row.jsonHasToolArgs ? "yes" : "no",
        row.elapsedMs,
        row.error ?? "-"
      ].join("\t")
    );
    if (row.preview) console.log(`  ${row.preview}`);
  }

  const codegenPass = results.filter((r) => r.outputMode === "codegen_ts" && r.sandbox === "PASS");
  const jsonPass = results.filter((r) => r.outputMode === "json_object" && r.ok);

  console.log("\n=== Conclusions ===");
  console.log(`report: ${reportPath}`);
  console.log(`codegen_ts PASS: ${codegenPass.length}/${results.filter((r) => r.outputMode === "codegen_ts").length}`);
  console.log(`json_object OK: ${jsonPass.length}/${results.filter((r) => r.outputMode === "json_object").length}`);
  if (codegenPass.length > 0) {
    const byModel = [...new Set(codegenPass.map((r) => r.model))];
    console.log(`codegen PASS models: ${byModel.join(", ")}`);
  }

  process.exitCode = codegenPass.length > 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
