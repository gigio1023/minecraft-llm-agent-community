export type WaitResult = {
  status: "waited";
  ticks: number;
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
  await delay(ticks * 50);

  return {
    status: "waited",
    ticks
  };
}
