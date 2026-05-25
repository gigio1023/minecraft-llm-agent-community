import { readFileSync } from "node:fs";

/**
 * Loads repo-root `.env` without overwriting unrelated process env keys.
 * Social-cycle provider auth uses repo-local keys such as OPENAI_API_KEY and
 * GEMINI_API_KEY from this file without printing secret values.
 */
export function loadRepoDotEnv(repoRoot: string, options?: { overrideKeys?: string[] }) {
  const override = new Set(options?.overrideKeys ?? ["OPENAI_API_KEY", "GEMINI_API_KEY"]);
  try {
    const raw = readFileSync(`${repoRoot}/.env`, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq);
      if (process.env[key] && !override.has(key)) continue;
      let value = trimmed.slice(eq + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // optional .env
  }
}
