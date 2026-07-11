import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const probeRoot = path.resolve(here, "..");
const manifestPath = path.join(
  probeRoot,
  "benchmarks/capability/individual-capability-v1.json"
);

test("capability CLI records tighter wall, request, and token limits", async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), "capability-cli-"));

  try {
    const child = spawn(
      "bun",
      [
        "run",
        "src/benchmarks/capability/cli.ts",
        "--manifest",
        manifestPath,
        "--case",
        "collect_logs",
        "--offline",
        "--cycles",
        "1",
        "--max-actions-per-cycle",
        "1",
        "--max-wall-time-ms",
        "30000",
        "--max-provider-requests",
        "2",
        "--max-total-tokens",
        "1000",
        "--out",
        outDir
      ],
      {
        cwd: probeRoot,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    const exitCode = await new Promise<number | null>((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });

    assert.equal(exitCode, 0, `stdout:\n${stdout}\nstderr:\n${stderr}`);

    const suiteIndex = JSON.parse(
      await fs.readFile(path.join(outDir, "suite-index.json"), "utf8")
    ) as {
      runs: Array<{ budget_status_ref: string }>;
    };
    assert.equal(suiteIndex.runs.length, 1);

    const budgetStatus = JSON.parse(
      await fs.readFile(path.join(outDir, suiteIndex.runs[0]!.budget_status_ref), "utf8")
    ) as {
      declared: {
        max_wall_time_ms: number;
        max_provider_requests?: number;
        max_total_tokens?: number;
      };
    };
    assert.equal(budgetStatus.declared.max_wall_time_ms, 30_000);
    assert.equal(budgetStatus.declared.max_provider_requests, 2);
    assert.equal(budgetStatus.declared.max_total_tokens, 1_000);
  } finally {
    await fs.rm(outDir, { recursive: true, force: true });
  }
});
