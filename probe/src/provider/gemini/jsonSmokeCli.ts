/**
 * Smoke CLI for Gemini structured JSON calls.
 *
 * @remarks This validates provider setup and schema behavior only. A successful
 * smoke call does not imply the Minecraft runtime loop or actor evidence path is
 * working.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRepoDotEnv } from "../../config/loadRepoDotEnv.js";
import { callGeminiJsonSchema } from "../geminiApiJsonProvider.js";

function parseArgs(argv: string[]) {
  const options: { model?: string; report?: string; prompt?: string } = {};
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--model" && next) {
      options.model = next;
      index++;
    } else if (arg === "--report" && next) {
      options.report = next;
      index++;
    } else if (arg === "--prompt" && next) {
      options.prompt = next;
      index++;
    }
  }
  return options;
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, "../../../..");
  loadRepoDotEnv(repoRoot, { overrideKeys: ["GEMINI_API_KEY"] });

  const parsed = parseArgs(process.argv.slice(2));
  const model = parsed.model?.trim();
  if (!model) {
    throw new Error("--model is required for probe:gemini-json-smoke.");
  }
  const runId = `gemini-json-smoke-${Date.now()}`;
  const prompt =
    parsed.prompt ??
    "Return a compact JSON readiness note for a Minecraft social-cycle provider smoke test.";
  const result = await callGeminiJsonSchema<{
    ok: boolean;
    provider: string;
    note: string;
  }>({
    config: {
      apiKey: process.env.GEMINI_API_KEY ?? "",
      model,
      requestTimeoutMs: Number(process.env.GEMINI_TEXT_REQUEST_TIMEOUT_MS ?? 120_000),
      repoRoot
    },
    schemaName: "gemini_json_smoke",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        ok: { type: "boolean" },
        provider: { type: "string" },
        note: { type: "string" }
      },
      required: ["ok", "provider", "note"]
    },
    system:
      "You are a provider smoke test. Return only JSON matching the schema. Do not include secrets.",
    user: prompt,
    usageContext: {
      runId,
      actorId: "provider_smoke",
      turnId: "gemini-json-smoke",
      stage: "gemini_json_smoke"
    }
  });

  const reportPath = parsed.report
    ? path.resolve(parsed.report)
    : path.resolve(repoRoot, "tmp", "gemini-json-smoke.json");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(
    reportPath,
    `${JSON.stringify(
      {
        schema: "gemini-json-smoke-report/v1",
        run_id: runId,
        model,
        ok: result.ok,
        result
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(
    JSON.stringify({
      report_path: reportPath,
      ok: result.ok,
      model,
      error: result.ok ? null : result.message,
      usage: result.usageRecord?.usage ?? null,
      budget_status: result.budgetDecision?.status ?? null
    })
  );
  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
