#!/usr/bin/env bun

import fs from "node:fs/promises";
import path from "node:path";

import {
  buildGroundedSocialSticksFixture,
  GROUNDED_SOCIAL_STICKS_SCENARIO_ID
} from "./socialTrajectory/fixtures.js";
import { formatGroundedSocialTrajectoryHtml } from "./socialTrajectory/html.js";
import { scoreGroundedSocialTrajectory } from "./socialTrajectory/scorer.js";
import type { GroundedSocialTrajectoryInput } from "./socialTrajectory/types.js";

type CliArgs = {
  fixture?: string;
  input?: string;
  out?: string;
  html?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--fixture" && next) {
      args.fixture = next;
      index += 1;
    } else if (arg === "--input" && next) {
      args.input = next;
      index += 1;
    } else if (arg === "--out" && next) {
      args.out = next;
      index += 1;
    } else if (arg === "--html" && next) {
      args.html = next;
      index += 1;
    }
  }
  if (!args.fixture && !args.input) {
    args.fixture = GROUNDED_SOCIAL_STICKS_SCENARIO_ID;
  }
  if (args.fixture && args.input) {
    throw new Error("Use either --fixture or --input, not both.");
  }
  return args;
}

async function loadInput(args: CliArgs): Promise<GroundedSocialTrajectoryInput> {
  if (args.input) {
    return JSON.parse(await fs.readFile(path.resolve(args.input), "utf8")) as GroundedSocialTrajectoryInput;
  }
  if (!args.fixture || args.fixture === GROUNDED_SOCIAL_STICKS_SCENARIO_ID) {
    return buildGroundedSocialSticksFixture();
  }
  throw new Error(`Unknown social trajectory fixture: ${args.fixture}`);
}

async function writeFileIfRequested(filePath: string | undefined, contents: string) {
  if (!filePath) {
    return;
  }
  const resolved = path.resolve(filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, contents);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = await loadInput(args);
  const report = scoreGroundedSocialTrajectory(input);
  const json = `${JSON.stringify(report, null, 2)}\n`;

  if (args.out) {
    await writeFileIfRequested(args.out, json);
  } else {
    process.stdout.write(json);
  }

  if (args.html) {
    await writeFileIfRequested(args.html, formatGroundedSocialTrajectoryHtml(report));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
