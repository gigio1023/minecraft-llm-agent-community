import { promises as fs } from "node:fs";
import path from "node:path";

const credentialPattern = /^\s*(?:export\s+)?GEMINI_API_KEY\s*=\s*(.+)\s*$/m;

function stripQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export async function loadGeminiApiKey(repoRoot: string): Promise<string | undefined> {
  if (process.env.GEMINI_API_KEY?.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }

  const authPath = path.join(repoRoot, "build/provider-auth/gemini-live.env");
  try {
    const raw = await fs.readFile(authPath, "utf8");
    const match = raw.match(credentialPattern);
    if (match?.[1]) {
      return stripQuotes(match[1]);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  return undefined;
}
