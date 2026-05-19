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

export async function wait({ ticks }: WaitArgs): Promise<WaitResult> {
  await delay(ticks * 50);

  return {
    status: "waited",
    ticks
  };
}
