type RepeatStatus = "passed" | "progressing" | "failed";

type RepeatAttempt = {
  actorId: string;
  tool: string;
  args: Record<string, unknown>;
  verificationStatus: RepeatStatus;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
    .join(",")}}`;
}

/**
 * Blocks repeated identical primitive attempts only after verified failures.
 *
 * The policy intentionally keys on actor, tool, and normalized args so a bot can
 * retry after a different observation or with different parameters, while still
 * making hidden loops visible as blocked transcript entries.
 */
export function createAntiRepeatPolicy(limit = 8, blockAfterRepeatedFailures = 3) {
  const attempts: RepeatAttempt[] = [];

  function matches(left: RepeatAttempt, right: RepeatAttempt) {
    return (
      left.actorId === right.actorId &&
      left.tool === right.tool &&
      stableStringify(left.args) === stableStringify(right.args)
    );
  }

  return {
    shouldBlock(attempt: Omit<RepeatAttempt, "verificationStatus">) {
      let repeatedFailures = 0;

      for (let index = attempts.length - 1; index >= 0; index -= 1) {
        const previous = attempts[index];

        // Stop at the first non-identical or non-failed attempt; the policy is
        // about consecutive fake-progress loops, not broad historical dislike.
        if (!previous || !matches(previous, { ...attempt, verificationStatus: "failed" })) {
          break;
        }

        if (previous.verificationStatus !== "failed") {
          break;
        }

        repeatedFailures += 1;
      }

      return repeatedFailures >= blockAfterRepeatedFailures;
    },
    record(attempt: RepeatAttempt) {
      attempts.push(attempt);

      if (attempts.length > limit) {
        attempts.splice(0, attempts.length - limit);
      }
    }
  };
}
