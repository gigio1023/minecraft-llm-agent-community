export function readManualMinecraftPort(value = process.env.MC_PORT) {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`MC_PORT must be an integer between 1 and 65535, got: ${value}`);
  }

  return port;
}
