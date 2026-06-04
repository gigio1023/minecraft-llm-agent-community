/**
 * Removes common Markdown fences from provider-generated TypeScript source.
 *
 * @remarks Stripping presentation syntax is not validation. The generated source
 * still needs helper, timeout, schema, and lifecycle gates before execution.
 */
export function stripGeneratedSourceFence(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:ts|typescript|json)?\s*([\s\S]*?)```$/i);
  return (match ? match[1] : trimmed).trim();
}
