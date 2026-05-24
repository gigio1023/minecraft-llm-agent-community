import { promises as fs } from "node:fs";
import path from "node:path";

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

import { loadGeminiApiKey } from "../src/provider/gemini/auth.js";
import { flushTracing, startTracing, traceGeneration } from "../src/mutual/skillVillage/tracing.js";
import {
  buildOpenAiMessages,
  evaluateToolJson,
  loadRepoDotEnv,
  MATRIX_PHASES,
  sandboxTs,
  TOOL_PROPOSAL_GENAI_SCHEMA,
  TOOL_PROPOSAL_JSON_SCHEMA,
  type MatrixPhase
} from "./plannerProviderMatrixShared.js";

const GEMINI_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
const PARALLEL_LIMIT = 6;
const REQUEST_TIMEOUT_MS = 90_000;

export type ProviderChannel =
  | "genai"
  | "openai-compat-gemini"
  | "openai-api";

export type OutputMode = "codegen_ts" | "json_schema";

type JobSpec = {
  jobId: string;
  channel: ProviderChannel;
  model: string;
  phase: MatrixPhase;
  outputMode: OutputMode;
};

type JobResult = {
  jobId: string;
  channel: ProviderChannel;
  model: string;
  phaseId: string;
  outputMode: OutputMode;
  elapsedMs: number;
  ok: boolean;
  error?: string;
  messageRoles: string[];
  sandbox?: ReturnType<typeof sandboxTs>;
  jsonParseOk?: boolean;
  jsonHasToolArgs?: boolean;
  preview: string;
  usage?: unknown;
};

const CHANNEL_MODELS: Array<{ channel: ProviderChannel; model: string; note: string }> = [
  { channel: "genai", model: "gemini-3.1-flash-lite", note: "Gemini free tier primary" },
  { channel: "genai", model: "gemini-2.5-flash", note: "genai baseline" },
  { channel: "openai-compat-gemini", model: "gemini-3.1-flash-lite", note: "OpenAI SDK + Gemini base URL" },
  { channel: "openai-api", model: "gpt-5.4-mini", note: "OpenAI Tier3 mini pool" }
];

async function runWithTimeout<T>(label: string, fn: () => Promise<T>): Promise<T> {
  return await Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      setTimeout(
        () => reject(new Error(`${label} timed out after ${REQUEST_TIMEOUT_MS}ms`)),
        REQUEST_TIMEOUT_MS
      );
    })
  ]);
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function runGenaiJob(
  client: GoogleGenAI,
  spec: JobSpec
): Promise<JobResult> {
  const started = Date.now();
  const messages = buildOpenAiMessages(spec.phase, spec.outputMode);
  const system = messages[0]?.content ?? "";
  const user = messages[1]?.content ?? "";

  try {
    const response = await runWithTimeout(spec.jobId, () =>
      client.models.generateContent({
        model: spec.model,
        contents: user,
        config: {
          systemInstruction: system,
          temperature: 0.2,
          maxOutputTokens: 2048,
          ...(spec.outputMode === "json_schema"
            ? {
                responseMimeType: "application/json",
                responseSchema: TOOL_PROPOSAL_GENAI_SCHEMA
              }
            : {})
        }
      })
    );

    const text = response.text?.trim() ?? "";
    return finishResult(spec, started, text, messages, response.usageMetadata);
  } catch (error) {
    return errorResult(spec, started, messages, error);
  }
}

async function runOpenAiJob(
  client: OpenAI,
  spec: JobSpec
): Promise<JobResult> {
  const started = Date.now();
  const messages = buildOpenAiMessages(spec.phase, spec.outputMode);

  try {
    const completion = await runWithTimeout(spec.jobId, () =>
      traceGeneration(
        `planner-matrix/${spec.jobId}`,
        { channel: spec.channel, model: spec.model, messages, outputMode: spec.outputMode },
        {
          provider: spec.channel,
          model: spec.model,
          phaseId: spec.phase.phaseId,
          messageStructure: "system+user"
        },
        () =>
          client.chat.completions.create({
            model: spec.model,
            messages,
            temperature: 0.2,
            ...(spec.channel === "openai-api"
              ? { max_completion_tokens: 2048 }
              : { max_tokens: 2048 }),
            ...(spec.outputMode === "json_schema"
              ? {
                  response_format: {
                    type: "json_schema",
                    json_schema: {
                      name: "mineflayer_tool_proposal",
                      strict: true,
                      schema: TOOL_PROPOSAL_JSON_SCHEMA
                    }
                  }
                }
              : {})
          })
      )
    );

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    return finishResult(spec, started, text, messages, completion.usage);
  } catch (error) {
    return errorResult(spec, started, messages, error);
  }
}

function finishResult(
  spec: JobSpec,
  started: number,
  text: string,
  messages: { role: string }[],
  usage?: unknown
): JobResult {
  const base = {
    jobId: spec.jobId,
    channel: spec.channel,
    model: spec.model,
    phaseId: spec.phase.phaseId,
    outputMode: spec.outputMode,
    elapsedMs: Date.now() - started,
    messageRoles: messages.map((m) => m.role),
    preview: text.replace(/\s+/g, " ").slice(0, 180),
    usage
  };

  if (spec.outputMode === "codegen_ts") {
    const sandbox = sandboxTs(text);
    return { ...base, ok: sandbox === "PASS", sandbox };
  }

  const jsonEval = evaluateToolJson(text);
  return {
    ...base,
    ok: jsonEval.jsonParseOk && jsonEval.jsonHasToolArgs,
    ...jsonEval
  };
}

function errorResult(
  spec: JobSpec,
  started: number,
  messages: { role: string }[],
  error: unknown
): JobResult {
  return {
    jobId: spec.jobId,
    channel: spec.channel,
    model: spec.model,
    phaseId: spec.phase.phaseId,
    outputMode: spec.outputMode,
    elapsedMs: Date.now() - started,
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    messageRoles: messages.map((m) => m.role),
    preview: ""
  };
}

async function main() {
  const repoRoot = path.resolve(process.cwd(), "..");
  loadRepoDotEnv(repoRoot, { overrideKeys: ["OPENAI_API_KEY", "GEMINI_API_KEY"] });

  const geminiKey = await loadGeminiApiKey(repoRoot);
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (!geminiKey) throw new Error("GEMINI_API_KEY missing");
  if (!openaiKey) throw new Error("OPENAI_API_KEY missing in repo .env");

  const genaiClient = new GoogleGenAI({ apiKey: geminiKey });
  const openaiGemini = new OpenAI({ apiKey: geminiKey, baseURL: GEMINI_OPENAI_BASE_URL });
  const openaiNative = new OpenAI({ apiKey: openaiKey });

  const plan = {
    phases: MATRIX_PHASES.map((p) => p.phaseId),
    channels: CHANNEL_MODELS,
    outputModes: ["codegen_ts", "json_schema"],
    structuredOutput: {
      genai: "config.responseMimeType + config.responseSchema (@google/genai)",
      openai: 'response_format.type = "json_schema" (Structured Outputs guide)'
    },
    parallelLimit: PARALLEL_LIMIT,
    docs: [
      "docs/docs/Setup/OpenAI-Tier3-Free-Usage.md",
      "docs/docs/Architecture/Gemini-Native-Audio-Codegen-Verdict.md"
    ]
  };

  const jobs: JobSpec[] = [];
  for (const { channel, model } of CHANNEL_MODELS) {
    for (const phase of MATRIX_PHASES) {
      for (const outputMode of ["codegen_ts", "json_schema"] as const) {
        jobs.push({
          jobId: `${channel}__${model}__${phase.phaseId}__${outputMode}`,
          channel,
          model,
          phase,
          outputMode
        });
      }
    }
  }

  console.log("=== Planner provider matrix (genai + OpenAI SDK) ===");
  console.log(JSON.stringify(plan, null, 2));
  console.log(`jobs=${jobs.length}\n`);

  startTracing();
  const startedAll = Date.now();

  const results = await mapPool(jobs, PARALLEL_LIMIT, async (job) => {
    if (job.channel === "genai") {
      return runGenaiJob(genaiClient, job);
    }
    const client = job.channel === "openai-compat-gemini" ? openaiGemini : openaiNative;
    return runOpenAiJob(client, job);
  });

  await flushTracing();

  const report = {
    schema: "planner-provider-matrix-report/v1",
    created_at: new Date().toISOString(),
    elapsedMs: Date.now() - startedAll,
    plan,
    results
  };

  const reportPath = path.join(repoRoot, "tmp/planner-provider-matrix-report.json");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  printSummary(results, reportPath);
  process.exitCode = results.some((r) => r.outputMode === "codegen_ts" && r.sandbox === "PASS") ? 0 : 1;
}

function printSummary(results: JobResult[], reportPath: string) {
  console.log("\n=== codegen_ts (Mineflayer TS sandbox) ===\n");
  for (const row of results.filter((r) => r.outputMode === "codegen_ts")) {
    console.log(
      [row.channel, row.model, row.phaseId, row.sandbox ?? "-", row.elapsedMs, row.error ?? "-"].join(
        "\t"
      )
    );
    if (row.preview) console.log(`  ${row.preview}`);
  }

  console.log("\n=== json_schema (tool + args) ===\n");
  for (const row of results.filter((r) => r.outputMode === "json_schema")) {
    console.log(
      [
        row.channel,
        row.model,
        row.phaseId,
        row.jsonParseOk ? "parse" : "no",
        row.jsonHasToolArgs ? "ok" : "no",
        row.elapsedMs,
        row.error ?? "-"
      ].join("\t")
    );
    if (row.preview) console.log(`  ${row.preview}`);
  }

  console.log("\n=== By channel (codegen PASS count) ===");
  for (const ch of ["genai", "openai-compat-gemini", "openai-api"] as const) {
    const subset = results.filter((r) => r.channel === ch && r.outputMode === "codegen_ts");
    const pass = subset.filter((r) => r.sandbox === "PASS").length;
    console.log(`  ${ch}: ${pass}/${subset.length}`);
  }

  console.log(`\nreport: ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
