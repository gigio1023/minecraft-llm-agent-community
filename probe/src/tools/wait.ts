export type WaitResult = {
  status: "waited";
  ticks: number;
  durationMs: number;
};

type WaitArgs = {
  ticks: number;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Converts Minecraft ticks into a bounded wall-clock pause.
 *
 * Waiting is transcript-visible pacing, not progress evidence; verification must
 * still come from a later observation.
 */
export async function wait({ ticks }: WaitArgs): Promise<WaitResult> {
  const durationMs = ticks * 50;
  await delay(durationMs);

  return {
    status: "waited",
    ticks,
    durationMs
  };
}
