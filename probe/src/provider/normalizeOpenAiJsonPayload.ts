/**
 * Some OpenAI JSON-schema completions return the payload nested under `properties`
 * as if echoing the schema shape. Unwrap that before stage validators run.
 */
export function normalizeOpenAiJsonPayload<T extends Record<string, unknown>>(
  parsed: T
): T {
  const nested = parsed.properties;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as T;
  }
  return parsed;
}
