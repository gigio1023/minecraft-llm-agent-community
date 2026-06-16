#!/usr/bin/env bun

import fs from "node:fs/promises";
import path from "node:path";

import type { BenchmarkObservationMetrics } from "./socialCycleBenchmarkMetrics.js";
import {
  formatBenchmarkScoreHtml,
  scoreBenchmarkMetrics
} from "./socialCycleBenchmarkScore.js";

type CliArgs = {
  metrics?: string;
  out?: string;
  html?: string;
};

type MetricsBundle = {
  metrics?: BenchmarkObservationMetrics[];
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--metrics" && next) {
      args.metrics = next;
      index += 1;
    } else if (arg === "--out" && next) {
      args.out = next;
      index += 1;
    } else if (arg === "--html" && next) {
      args.html = next;
      index += 1;
    }
  }
  if (!args.metrics) {
    throw new Error("--metrics path is required");
  }
  return args;
}

function isMetricsArray(value: unknown): value is BenchmarkObservationMetrics[] {
  return Array.isArray(value);
}

function loadMetrics(value: unknown): BenchmarkObservationMetrics[] {
  if (isMetricsArray(value)) {
    return value;
  }
  const bundle = value as MetricsBundle;
  if (isMetricsArray(bundle.metrics)) {
    return bundle.metrics;
  }
  throw new Error("Metrics file must be an array or benchmark-observation-metrics-bundle/v1 object");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const raw = JSON.parse(await fs.readFile(path.resolve(args.metrics!), "utf8")) as unknown;
  const metrics = loadMetrics(raw);
  const bundle = scoreBenchmarkMetrics(metrics);

  if (args.out) {
    await fs.mkdir(path.dirname(path.resolve(args.out)), { recursive: true });
    await fs.writeFile(path.resolve(args.out), `${JSON.stringify(bundle, null, 2)}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(bundle, null, 2)}\n`);
  }

  if (args.html) {
    await fs.mkdir(path.dirname(path.resolve(args.html)), { recursive: true });
    await fs.writeFile(path.resolve(args.html), formatBenchmarkScoreHtml(bundle));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
