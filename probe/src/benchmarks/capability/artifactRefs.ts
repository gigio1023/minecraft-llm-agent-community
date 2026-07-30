/**
 * Root-safe relative artifact ref resolution for capability reports.
 *
 * Absolute paths and `..` escapes are rejected. Resolved paths must stay under
 * the actor directory or another declared artifact root.
 */

import { lstatSync, realpathSync } from "node:fs";
import path from "node:path";

export type RootSafeResolveResult =
  | { ok: true; absolute_path: string; relative_ref: string }
  | { ok: false; reason: string };

function isEmptyRef(ref: string): boolean {
  return ref.trim().length === 0;
}

/**
 * Returns true when `ref` is a relative path that does not escape via `..`
 * and is not absolute (POSIX or Windows).
 */
export function isRootSafeRelativeRef(ref: string): boolean {
  if (isEmptyRef(ref)) {
    return false;
  }
  if (path.isAbsolute(ref)) {
    return false;
  }
  // Reject Windows drive / UNC forms even when path.isAbsolute is false on POSIX.
  if (/^[a-zA-Z]:[\\/]/.test(ref) || ref.startsWith("\\\\") || ref.startsWith("//")) {
    return false;
  }
  const parts = ref.replace(/\\/g, "/").split("/");
  if (parts.some((part) => part === "..")) {
    return false;
  }
  const normalized = path.posix.normalize(ref.replace(/\\/g, "/"));
  if (normalized === "." || normalized.startsWith("../") || normalized === "..") {
    return false;
  }
  if (path.isAbsolute(normalized)) {
    return false;
  }
  return true;
}

/**
 * Resolve a relative artifact ref under `rootDir`. Rejects absolute paths and
 * any normalized path that escapes the root.
 */
export function resolveRootSafeArtifactRef(
  rootDir: string,
  ref: string
): RootSafeResolveResult {
  if (isEmptyRef(ref)) {
    return { ok: false, reason: "ref is empty" };
  }
  if (path.isAbsolute(ref) || /^[a-zA-Z]:[\\/]/.test(ref) || ref.startsWith("\\\\")) {
    return { ok: false, reason: "absolute paths are rejected" };
  }
  if (!isRootSafeRelativeRef(ref)) {
    return { ok: false, reason: "ref escapes root via '..' or is otherwise unsafe" };
  }

  const normalized = path.normalize(ref);
  const absolutePath = path.resolve(rootDir, normalized);
  const relative = path.relative(path.resolve(rootDir), absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return { ok: false, reason: "resolved path escapes rootDir" };
  }

  return {
    ok: true,
    absolute_path: absolutePath,
    relative_ref: relative.split(path.sep).join("/")
  };
}

/**
 * Resolve a ref without traversing symlinks below the declared root.
 *
 * The ordinary resolver prevents lexical `..` escapes. File readers and
 * writers that must not follow an in-root symlink to an outside path should
 * use this stricter form.
 */
export function resolveRootSafeArtifactRefWithoutSymlinks(
  rootDir: string,
  ref: string
): RootSafeResolveResult {
  const resolved = resolveRootSafeArtifactRef(rootDir, ref);
  if (!resolved.ok) {
    return resolved;
  }

  let canonicalRoot: string;
  try {
    canonicalRoot = realpathSync(rootDir);
  } catch {
    return { ok: false, reason: "declared root does not exist" };
  }

  let current = canonicalRoot;
  for (const part of resolved.relative_ref.split("/")) {
    current = path.join(current, part);
    try {
      if (lstatSync(current).isSymbolicLink()) {
        return {
          ok: false,
          reason: `ref traverses symbolic link '${part}' below declared root`
        };
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        break;
      }
      return {
        ok: false,
        reason: error instanceof Error ? error.message : String(error)
      };
    }
  }

  return {
    ok: true,
    absolute_path: path.join(canonicalRoot, ...resolved.relative_ref.split("/")),
    relative_ref: resolved.relative_ref
  };
}

/**
 * Resolve a relative ref against the first matching declared root (actor dir
 * first when provided). Returns null when every root rejects the ref.
 */
export function resolveUnderDeclaredRoots(
  ref: string,
  roots: readonly string[]
): RootSafeResolveResult {
  if (roots.length === 0) {
    return { ok: false, reason: "no declared artifact roots" };
  }
  let lastFailure: RootSafeResolveResult = {
    ok: false,
    reason: "ref rejected by all declared roots"
  };
  for (const root of roots) {
    const resolved = resolveRootSafeArtifactRef(root, ref);
    if (resolved.ok) {
      return resolved;
    }
    lastFailure = resolved;
  }
  return lastFailure;
}
