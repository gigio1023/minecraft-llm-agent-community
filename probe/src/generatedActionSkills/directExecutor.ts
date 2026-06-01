import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export type GeneratedActionSkillHelperEvent = {
  name: string;
  args: unknown[];
  status?: "started" | "completed" | "failed";
  result?: unknown;
  error?: string;
};

export type DirectGeneratedActionSkillContext = Record<string, unknown>;

export type DirectGeneratedActionSkillRunInput<TContext extends DirectGeneratedActionSkillContext> = {
  actorId: string;
  skillName: string;
  source: string;
  ctx: TContext;
  params?: Record<string, unknown>;
  timeoutMs?: number;
  artifactDir?: string;
  helperEvents?: GeneratedActionSkillHelperEvent[];
  helperAllowlist?: readonly string[];
  onTimeout?: () => void | Promise<void>;
};

export type DirectGeneratedActionSkillRunResult = {
  status: "completed" | "timeout" | "skill_error" | "rejected";
  actorId: string;
  skillName: string;
  sourcePath?: string;
  helperEvents: GeneratedActionSkillHelperEvent[];
  result?: unknown;
  errorMessage?: string;
  durationMs: number;
  timeoutMs: number;
};

const defaultTimeoutMs = 30_000;

const blockedGeneratedCodePattern =
  /\b(import|require|process|Bun|Deno|eval|Function|child_process|fs|node:fs|net|http|https)\b|while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)/;

function sanitizeFileId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "generated_action_skill";
}

export function assertDirectGeneratedActionSkillSource(source: string) {
  if (!source.includes("export async function run")) {
    throw new Error("Generated action skill must export async function run(ctx)");
  }

  if (blockedGeneratedCodePattern.test(source)) {
    throw new Error("Generated action skill contains a blocked API or obvious unbounded loop");
  }
}

async function writeGeneratedSource(input: {
  actorId: string;
  skillName: string;
  source: string;
  artifactDir?: string;
}) {
  const artifactDir =
    input.artifactDir ??
    await fs.mkdtemp(path.join(os.tmpdir(), "direct-generated-action-skill-"));
  await fs.mkdir(artifactDir, { recursive: true });
  const fileName = `${Date.now()}-${sanitizeFileId(input.actorId)}-${sanitizeFileId(input.skillName)}.ts`;
  const filePath = path.join(artifactDir, fileName);
  await fs.writeFile(filePath, input.source, "utf8");
  return filePath;
}

function withHelperLogging<TContext extends DirectGeneratedActionSkillContext>(
  ctx: TContext,
  helperEvents: GeneratedActionSkillHelperEvent[],
  helperAllowlist?: readonly string[]
): TContext {
  const allowedHelpers = helperAllowlist ? new Set(helperAllowlist) : undefined;
  return new Proxy(ctx, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof property !== "string" || typeof value !== "function" || property === "constructor") {
        return value;
      }
      if (allowedHelpers && !allowedHelpers.has(property)) {
        return (...args: unknown[]) => {
          const error = `Generated action skill helper ${property} is not in this candidate's helper_allowlist`;
          helperEvents.push({ name: property, args, status: "failed", error });
          throw new Error(error);
        };
      }

      return (...args: unknown[]) => {
        helperEvents.push({ name: property, args, status: "started" });
        try {
          const result = value.apply(target, args);
          if (result && typeof (result as Promise<unknown>).then === "function") {
            return (result as Promise<unknown>).then(
              (resolved) => {
                helperEvents.push({ name: property, args, status: "completed", result: resolved });
                return resolved;
              },
              (error) => {
                const message = error instanceof Error ? error.message : String(error);
                helperEvents.push({ name: property, args, status: "failed", error: message });
                throw error;
              }
            );
          }

          helperEvents.push({ name: property, args, status: "completed", result });
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          helperEvents.push({ name: property, args, status: "failed", error: message });
          throw error;
        }
      };
    }
  });
}

async function importGeneratedActionSkill(sourcePath: string) {
  const moduleUrl = `${pathToFileURL(sourcePath).href}?t=${Date.now()}`;
  const imported = await import(moduleUrl) as { run?: unknown };
  if (typeof imported.run !== "function") {
    throw new Error("Generated action skill module must export run(ctx)");
  }

  return imported.run as (ctx: unknown, params?: Record<string, unknown>) => Promise<unknown>;
}

export async function runDirectGeneratedActionSkill<TContext extends DirectGeneratedActionSkillContext>(
  input: DirectGeneratedActionSkillRunInput<TContext>
): Promise<DirectGeneratedActionSkillRunResult> {
  const startedAt = Date.now();
  const timeoutMs = input.timeoutMs ?? defaultTimeoutMs;
  const helperEvents = input.helperEvents ?? [];
  let sourcePath: string | undefined;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    assertDirectGeneratedActionSkillSource(input.source);
    sourcePath = await writeGeneratedSource(input);
    const run = await importGeneratedActionSkill(sourcePath);
    const loggedCtx = withHelperLogging(input.ctx, helperEvents, input.helperAllowlist);
    const runPromise = Promise.resolve(run(loggedCtx, input.params ?? {}));
    const result = await Promise.race([
      runPromise,
      new Promise((resolve) => {
        timeoutHandle = setTimeout(() => resolve({ status: "timeout", timeoutMs }), timeoutMs);
      })
    ]);

    if (
      result &&
      typeof result === "object" &&
      "status" in result &&
      (result as { status?: unknown }).status === "timeout"
    ) {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      await input.onTimeout?.();
      runPromise.catch(() => {
        // The timeout path has already returned a standardized result. Late
        // helper rejection is expected after cancellation and must not create an
        // unhandled rejection that hides the original timeout evidence.
      });
      return {
        status: "timeout",
        actorId: input.actorId,
        skillName: input.skillName,
        sourcePath,
        helperEvents,
        result,
        durationMs: Date.now() - startedAt,
        timeoutMs
      };
    }

    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }

    return {
      status: "completed",
      actorId: input.actorId,
      skillName: input.skillName,
      sourcePath,
      helperEvents,
      result,
      durationMs: Date.now() - startedAt,
      timeoutMs
    };
  } catch (error) {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: sourcePath ? "skill_error" : "rejected",
      actorId: input.actorId,
      skillName: input.skillName,
      ...(sourcePath ? { sourcePath } : {}),
      helperEvents,
      errorMessage: message,
      durationMs: Date.now() - startedAt,
      timeoutMs
    };
  }
}
