export function unique(values: readonly string[]) {
  return [...new Set(values.filter((value) => value.length > 0))];
}

export function sameStrings(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

export function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

export function positionFromRecord(value: unknown) {
  const record = asRecord(value);
  if (!record) {
    return undefined;
  }
  const x = readNumber(record.x);
  const y = readNumber(record.y);
  const z = readNumber(record.z);
  return x === undefined || y === undefined || z === undefined
    ? undefined
    : { x, y, z };
}
