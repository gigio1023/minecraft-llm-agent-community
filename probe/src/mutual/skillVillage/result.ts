export function summarizeResult(result: unknown) {
  if (result === undefined) {
    return "undefined";
  }

  const serialized = JSON.stringify(result);
  return (serialized ?? String(result)).slice(0, 300);
}
