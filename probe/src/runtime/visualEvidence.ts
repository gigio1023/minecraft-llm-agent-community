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

type VisualEvidenceSession = {
  cameraMode: "first_person" | "third_person";
  viewerUrl: string;
  viewerPort: number;
  browser?: Browser;
  page?: Page;
  closeViewer?: () => void;
};

export type VisualEvidenceOptions = {
  enabled: true;
  intervalCycles?: number;
  cameraMode?: "first_person" | "third_person" | "both";
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

function normalizeCameraModes(value: VisualEvidenceOptions["cameraMode"]): Array<"first_person" | "third_person"> {
  if (value === "first_person") {
    return ["first_person"];
  }
  if (value === "third_person") {
    return ["third_person"];
  }
  return ["first_person", "third_person"];
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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function zoomThirdPersonCloser(page: Page, width: number, height: number, amount = -4_800) {
  await page.mouse.move(width / 2, height / 2);
  await page.mouse.wheel(0, amount);
  await page.waitForTimeout(500);
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
  cameraMode?: "first_person" | "third_person";
}) {
  const suffix = input.cameraMode ? `-${input.cameraMode.replace(/_/g, "-")}` : "";
  return `${input.cycleId}-${input.phase.replace(/_/g, "-")}${suffix}`;
}

function thirdPersonScreenshotClip(width: number, height: number) {
  const clipWidth = Math.floor(width * 0.62);
  const clipHeight = Math.floor(height * 0.68);
  return {
    x: Math.floor((width - clipWidth) / 2),
    y: Math.floor((height - clipHeight) / 2),
    width: clipWidth,
    height: clipHeight
  };
}

function createManifest(input: {
  intervalCycles: number;
  width: number;
  height: number;
  cameraModes: Array<"first_person" | "third_person">;
  viewerUrl?: string;
  viewerPort?: number;
  chromeExecutablePath?: string;
  notes?: string[];
}): SocialCycleVisualEvidence {
  return {
    schema: "social-cycle-visual-evidence/v1",
    enabled: true,
    method: "prismarine-viewer-web-screenshot",
    first_person: input.cameraModes.length === 1 && input.cameraModes[0] === "first_person",
    camera_mode: input.cameraModes.length === 2 ? "both" : input.cameraModes[0] ?? "third_person",
    camera_modes: input.cameraModes,
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
    `${captureFileBase({
      cycleId: input.record.cycle_id,
      phase: input.record.phase,
      cameraMode: input.record.camera_mode
    })}.json`
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
  cameraMode?: VisualEvidenceOptions["cameraMode"];
  width?: number;
  height?: number;
}): SocialCycleVisualEvidence {
  const cameraModes = normalizeCameraModes(input.cameraMode);
  return {
    schema: "social-cycle-visual-evidence/v1",
    enabled: true,
    method: "prismarine-viewer-web-screenshot",
    first_person: cameraModes.length === 1 && cameraModes[0] === "first_person",
    camera_mode: cameraModes.length === 2 ? "both" : cameraModes[0] ?? "third_person",
    camera_modes: cameraModes,
    interval_cycles: positiveInteger(input.intervalCycles, 1),
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
  const intervalCycles = positiveInteger(input.options.intervalCycles, 1);
  const cameraModes = normalizeCameraModes(input.options.cameraMode);
  const viewDistance = positiveInteger(input.options.viewDistance, 8);
  const chromeExecutablePath = await resolveChromeExecutablePath(input.options.chromeExecutablePath);
  const notes = [
    "Screenshots are review evidence from prismarine-viewer, not runtime verifier authority.",
    "Visual evidence can differ from a real Minecraft Java client screenshot in lighting and renderer details."
  ];
  const manifest = createManifest({
    intervalCycles,
    width,
    height,
    cameraModes,
    chromeExecutablePath,
    notes
  });
  const sessions: VisualEvidenceSession[] = [];

  const recordFailure = async (
    cycleId: string,
    phase: SocialCycleVisualEvidenceCapture["phase"],
    error: string,
    cameraMode?: "first_person" | "third_person",
    viewerUrl?: string
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
        ...(viewerUrl ? { viewer_url: viewerUrl } : {}),
        bot_position: botPosition(input.bot),
        ...(cameraMode ? { camera_mode: cameraMode } : {}),
        error
      }
    });
    manifest.captures.push(record);
  };

  try {
    const prismarineViewer = require("prismarine-viewer") as PrismarineViewerModule;
    if (
      Array.isArray(prismarineViewer.supportedVersions) &&
      !prismarineViewer.supportedVersions.includes(input.bot.version)
    ) {
      manifest.notes.push(
        `prismarine-viewer does not list exact bot.version ${input.bot.version}; it may fall back to the nearest supported texture set.`
      );
    }

    if (!chromeExecutablePath) {
      await recordFailure("startup", "startup", "No Chrome/Chromium executable found for visual evidence screenshots");
    } else {
      for (const cameraMode of cameraModes) {
        const port = positiveInteger(
          cameraMode === cameraModes[0] ? input.options.port : undefined,
          await findOpenPort()
        );
        const viewerUrl = `http://127.0.0.1:${port}`;
        const session: VisualEvidenceSession = { cameraMode, viewerUrl, viewerPort: port };
        sessions.push(session);
        try {
          prismarineViewer.mineflayer(input.bot, {
            port,
            firstPerson: cameraMode === "first_person",
            viewDistance
          });
          session.closeViewer = (input.bot as Bot & { viewer?: { close?: () => void } }).viewer?.close;
          if (!manifest.viewer_url) {
            manifest.viewer_url = viewerUrl;
            manifest.viewer_port = port;
          }
          await waitForHttp(viewerUrl, 5_000);
          session.browser = await chromium.launch({
            executablePath: chromeExecutablePath,
            headless: true
          });
          session.page = await session.browser.newPage({ viewport: { width, height } });
          await session.page.goto(viewerUrl, { waitUntil: "domcontentloaded", timeout: 15_000 });
          await session.page.waitForSelector("canvas", { timeout: 15_000 });
          await session.page.waitForTimeout(5_000);
          if (cameraMode === "third_person") {
            await zoomThirdPersonCloser(session.page, width, height);
          }
        } catch (error) {
          await recordFailure(
            "startup",
            "startup",
            error instanceof Error ? error.message : String(error),
            cameraMode,
            viewerUrl
          );
        }
      }
    }
  } catch (error) {
    await recordFailure("startup", "startup", error instanceof Error ? error.message : String(error));
  }

  return {
    manifest,
    async capture({ cycleId, phase }) {
      const capturedAt = nowIso();
      const artifactDir = path.join(input.actorDir, "visual-evidence");
      await fs.mkdir(artifactDir, { recursive: true });
      for (const session of sessions) {
        if (!session.page) {
          continue;
        }
        const imagePath = path.join(
          artifactDir,
          `${captureFileBase({ cycleId, phase, cameraMode: session.cameraMode })}.png`
        );
        try {
          await session.page.waitForTimeout(1_000);
          if (session.cameraMode === "third_person") {
            await zoomThirdPersonCloser(session.page, width, height, -900);
          }
          await withTimeout(
            session.page.screenshot({
              path: imagePath,
              fullPage: false,
              timeout: 10_000,
              ...(session.cameraMode === "third_person"
                ? { clip: thirdPersonScreenshotClip(width, height) }
                : {})
            }),
            12_000,
            `visual evidence screenshot ${session.cameraMode} ${cycleId} ${phase}`
          );
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
              viewer_url: session.viewerUrl,
              bot_position: botPosition(input.bot),
              camera_mode: session.cameraMode
            }
          });
          manifest.captures.push(record);
        } catch (error) {
          await recordFailure(
            cycleId,
            phase,
            error instanceof Error ? error.message : String(error),
            session.cameraMode,
            session.viewerUrl
          );
        }
      }
    },
    async close() {
      for (const session of sessions) {
        try {
          if (session.page) {
            await withTimeout(session.page.close(), 5_000, `visual evidence page close ${session.cameraMode}`);
          }
        } finally {
          if (session.browser) {
            await withTimeout(session.browser.close(), 5_000, `visual evidence browser close ${session.cameraMode}`);
          }
          session.closeViewer?.();
        }
      }
    }
  };
}
