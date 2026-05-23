export function stripGeneratedSourceFence(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:ts|typescript|json)?\s*([\s\S]*?)```$/i);
  return (match ? match[1] : trimmed).trim();
}
