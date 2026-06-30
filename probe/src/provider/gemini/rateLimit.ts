let lastRequestStartedAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

function configuredIntervalMs() {
  const value = Number(process.env.GEMINI_MIN_REQUEST_INTERVAL_MS ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Applies an opt-in process-local gap before Gemini API requests.
 *
 * @remarks Gemini free-tier TPM is a rolling provider limit. The runtime can
 * otherwise produce valid runs that fail only because requests are too close
 * together. Set `GEMINI_MIN_REQUEST_INTERVAL_MS` for live benchmark lanes.
 */
export async function waitForGeminiRequestSlot() {
  const intervalMs = configuredIntervalMs();
  if (intervalMs <= 0) {
    return;
  }

  const waitForTurn = requestQueue.then(async () => {
    const now = Date.now();
    const waitMs = Math.max(0, lastRequestStartedAt + intervalMs - now);
    if (waitMs > 0) {
      await delay(waitMs);
    }
    lastRequestStartedAt = Date.now();
  });
  requestQueue = waitForTurn.catch(() => undefined);
  await waitForTurn;
}
