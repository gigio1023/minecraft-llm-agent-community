import { readFile } from "node:fs/promises";

type AuthStoreRecord = {
  accessToken: string;
  expiresAt: string;
  profileEmail?: string;
};

export type OpenAICodexAuth = {
  accessToken: string;
  profileEmail?: string;
  toJSON(): never;
};

/**
 * Validates the repo-local game-runtime auth store without exposing token data.
 *
 * This auth path is intentionally separate from Codex CLI login: gameplay uses
 * the `openai-codex` provider through a runtime-owned token file, and stale or
 * malformed auth must fail before a live Minecraft run starts.
 */
function parseAuthStore(raw: string): AuthStoreRecord {
  const parsed = JSON.parse(raw);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("OpenAI Codex auth store must be a JSON object");
  }

  const { accessToken, expiresAt, profileEmail } = parsed as Record<string, unknown>;

  if (typeof accessToken !== "string" || accessToken.trim().length === 0) {
    throw new Error("OpenAI Codex auth store accessToken must be a non-empty string");
  }

  if (typeof expiresAt !== "string" || expiresAt.length === 0) {
    throw new Error("OpenAI Codex auth store expiresAt must be a non-empty string");
  }

  const expiresAtTimestamp = Date.parse(expiresAt);

  if (Number.isNaN(expiresAtTimestamp)) {
    throw new Error("OpenAI Codex auth store expiresAt must be a valid date");
  }

  if (expiresAtTimestamp <= Date.now()) {
    throw new Error("OpenAI Codex auth store is expired");
  }

  if (profileEmail !== undefined && typeof profileEmail !== "string") {
    throw new Error("OpenAI Codex auth store profileEmail must be a string");
  }

  return {
    accessToken,
    expiresAt,
    ...(profileEmail ? { profileEmail } : {})
  };
}

export async function loadOpenAICodexAuth(authStorePath: string | URL): Promise<OpenAICodexAuth> {
  const authStore = parseAuthStore(await readFile(authStorePath, "utf8"));

  return {
    accessToken: authStore.accessToken,
    ...(authStore.profileEmail ? { profileEmail: authStore.profileEmail } : {}),
    toJSON() {
      // Prevent accidental transcript/log serialization of bearer credentials.
      throw new Error("Cannot serialize auth");
    }
  };
}
