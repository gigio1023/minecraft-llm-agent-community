/**
 * Optional visual evidence capture for Mineflayer social-cycle runs.
 *
 * @remarks This module records what a viewer rendered from the bot's current
 * world cache. It is review evidence, not Minecraft progress authority: failed
 * screenshots must not fail actor turns, and captured pixels do not replace
 * block/inventory/container verifier artifacts.
 */
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import type { Bot } from "mineflayer";
import { chromium, type Browser, type Page } from "playwright-core";

import { writeJson } from "./actorWorkspaceStore.js";
import type {
  SocialCycleVisualEvidence,
  SocialCycleVisualEvidenceCapture
} from "./goals/types.js";

const require = createRequire(import.meta.url);

type PrismarineViewerModule = {
  mineflayer: (
    bot: Bot,
    settings: {
      viewDistance?: number;
      firstPerson?: boolean;
      port?: number;
      prefix?: string;
    }
  ) => void;
  supportedVersions?: readonly string[];
};

export type VisualEvidenceOptions = {
  enabled: true;
  intervalCycles?: number;
  port?: number;
  width?: number;
  height?: number;
  viewDistance?: number;
  chromeExecutablePath?: string;
};

export type VisualEvidenceRecorder = {
  manifest: SocialCycleVisualEvidence;
  capture(input: { cycleId: string; phase: SocialCycleVisualEvidenceCapture["phase"] }): Promise<void>;
  close(): Promise<void>;
};

function nowIso() {
  return new Date().toISOString();
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findOpenPort() {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (typeof address === "object" && address && typeof address.port === "number") {
          resolve(address.port);
        } else {
          reject(new Error("Unable to allocate a local visual-evidence port"));
        }
      });
    });
  });
}

async function waitForHttp(url: string, timeoutMs: number) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // The viewer starts asynchronously; retry until the timeout boundary.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for visual evidence viewer: ${url}`);
}

export async function resolveChromeExecutablePath(explicitPath?: string) {
  const candidates = [
    explicitPath,
    process.env.SOCIAL_CYCLE_VISUAL_CHROME_PATH,
    process.env.VISUAL_EVIDENCE_CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter((candidate): candidate is string => typeof candidate === "string" && candidate.length > 0);

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function botPosition(bot: Bot) {
  return {
    x: Number(bot.entity.position.x.toFixed(2)),
    y: Number(bot.entity.position.y.toFixed(2)),
    z: Number(bot.entity.position.z.toFixed(2)),
    yaw: Number(bot.entity.yaw.toFixed(3)),
    pitch: Number(bot.entity.pitch.toFixed(3))
  };
}

function actorRelativeRef(actorDir: string, filePath: string) {
  return path.relative(actorDir, filePath);
}

function captureFileBase(input: {
  cycleId: string;
  phase: SocialCycleVisualEvidenceCapture["phase"];
}) {
  return `${input.cycleId}-${input.phase.replace(/_/g, "-")}`;
}

function createManifest(input: {
  intervalCycles: number;
  width: number;
  height: number;
  viewerUrl?: string;
  viewerPort?: number;
  chromeExecutablePath?: string;
  notes?: string[];
}): SocialCycleVisualEvidence {
  return {
    schema: "social-cycle-visual-evidence/v1",
    enabled: true,
    method: "prismarine-viewer-web-screenshot",
    first_person: true,
    interval_cycles: input.intervalCycles,
    viewport: { width: input.width, height: input.height },
    ...(input.viewerUrl ? { viewer_url: input.viewerUrl } : {}),
    ...(input.viewerPort ? { viewer_port: input.viewerPort } : {}),
    ...(input.chromeExecutablePath ? { chrome_executable_path: input.chromeExecutablePath } : {}),
    captures: [],
    failures: [],
    notes: input.notes ?? []
  };
}

async function writeCaptureArtifact(input: {
  actorDir: string;
  record: Omit<SocialCycleVisualEvidenceCapture, "artifact_ref">;
}) {
  const artifactDir = path.join(input.actorDir, "visual-evidence");
  await fs.mkdir(artifactDir, { recursive: true });
  const filePath = path.join(
    artifactDir,
    `${captureFileBase({ cycleId: input.record.cycle_id, phase: input.record.phase })}.json`
  );
  const artifactRef = actorRelativeRef(input.actorDir, filePath);
  const record: SocialCycleVisualEvidenceCapture = {
    ...input.record,
    artifact_ref: artifactRef
  };
  await writeJson(filePath, record);
  return record;
}

export function createUnavailableVisualEvidence(input: {
  actorId: string;
  runId: string;
  reason: string;
  intervalCycles?: number;
  width?: number;
  height?: number;
}): SocialCycleVisualEvidence {
  return {
    schema: "social-cycle-visual-evidence/v1",
    enabled: true,
    method: "prismarine-viewer-web-screenshot",
    first_person: true,
    interval_cycles: positiveInteger(input.intervalCycles, 5),
    viewport: {
      width: positiveInteger(input.width, 960),
      height: positiveInteger(input.height, 540)
    },
    captures: [],
    failures: [{ captured_at: nowIso(), error: input.reason }],
    notes: [
      "Visual evidence was requested, but no live Mineflayer bot was available.",
      "This is a diagnostic gap, not Minecraft progress evidence."
    ]
  };
}

export async function startVisualEvidenceRecorder(input: {
  actorDir: string;
  actorId: string;
  runId: string;
  bot: Bot;
  options: VisualEvidenceOptions;
}): Promise<VisualEvidenceRecorder> {
  const width = positiveInteger(input.options.width, 960);
  const height = positiveInteger(input.options.height, 540);
  const intervalCycles = positiveInteger(input.options.intervalCycles, 5);
  const viewDistance = positiveInteger(input.options.viewDistance, 4);
  const port = positiveInteger(input.options.port, await findOpenPort());
  const viewerUrl = `http://127.0.0.1:${port}`;
  const chromeExecutablePath = await resolveChromeExecutablePath(input.options.chromeExecutablePath);
  const notes = [
    "Screenshots are review evidence from prismarine-viewer, not runtime verifier authority.",
    "Visual evidence can differ from a real Minecraft Java client screenshot in lighting and renderer details."
  ];
  const manifest = createManifest({
    intervalCycles,
    width,
    height,
    viewerUrl,
    viewerPort: port,
    chromeExecutablePath,
    notes
  });
  let browser: Browser | undefined;
  let page: Page | undefined;

  const recordFailure = async (
    cycleId: string,
    phase: SocialCycleVisualEvidenceCapture["phase"],
    error: string
  ) => {
    manifest.failures.push({ captured_at: nowIso(), error });
    const record = await writeCaptureArtifact({
      actorDir: input.actorDir,
      record: {
        schema: "visual-evidence-capture/v1",
        actor_id: input.actorId,
        run_id: input.runId,
        cycle_id: cycleId,
        phase,
        status: "failed",
        captured_at: nowIso(),
        method: "prismarine-viewer-web-screenshot",
        viewer_url: viewerUrl,
        bot_position: botPosition(input.bot),
        error
      }
    });
    manifest.captures.push(record);
  };

  try {
    const prismarineViewer = require("prismarine-viewer") as PrismarineViewerModule;
    prismarineViewer.mineflayer(input.bot, {
      port,
      firstPerson: true,
      viewDistance
    });
    if (
      Array.isArray(prismarineViewer.supportedVersions) &&
      !prismarineViewer.supportedVersions.includes(input.bot.version)
    ) {
      manifest.notes.push(
        `prismarine-viewer does not list exact bot.version ${input.bot.version}; it may fall back to the nearest supported texture set.`
      );
    }

    if (!chromeExecutablePath) {
      await recordFailure(
        "startup",
        "startup",
        "No Chrome/Chromium executable found for visual evidence screenshots"
      );
    } else {
      await waitForHttp(viewerUrl, 5_000);
      browser = await chromium.launch({
        executablePath: chromeExecutablePath,
        headless: true
      });
      page = await browser.newPage({ viewport: { width, height } });
      await page.goto(viewerUrl, { waitUntil: "domcontentloaded", timeout: 15_000 });
      await page.waitForSelector("canvas", { timeout: 15_000 });
      await page.waitForTimeout(1_500);
    }
  } catch (error) {
    await recordFailure("startup", "startup", error instanceof Error ? error.message : String(error));
  }

  return {
    manifest,
    async capture({ cycleId, phase }) {
      if (!page) {
        return;
      }
      const capturedAt = nowIso();
      const artifactDir = path.join(input.actorDir, "visual-evidence");
      await fs.mkdir(artifactDir, { recursive: true });
      const imagePath = path.join(artifactDir, `${captureFileBase({ cycleId, phase })}.png`);
      try {
        await page.screenshot({ path: imagePath, fullPage: false });
        const imageRef = actorRelativeRef(input.actorDir, imagePath);
        const record = await writeCaptureArtifact({
          actorDir: input.actorDir,
          record: {
            schema: "visual-evidence-capture/v1",
            actor_id: input.actorId,
            run_id: input.runId,
            cycle_id: cycleId,
            phase,
            status: "captured",
            captured_at: capturedAt,
            method: "prismarine-viewer-web-screenshot",
            image_ref: imageRef,
            image_path: imagePath,
            viewer_url: viewerUrl,
            bot_position: botPosition(input.bot)
          }
        });
        manifest.captures.push(record);
      } catch (error) {
        await recordFailure(cycleId, phase, error instanceof Error ? error.message : String(error));
      }
    },
    async close() {
      try {
        await page?.close();
      } finally {
        await browser?.close();
        const viewer = (input.bot as Bot & { viewer?: { close?: () => void } }).viewer;
        viewer?.close?.();
      }
    }
  };
}
