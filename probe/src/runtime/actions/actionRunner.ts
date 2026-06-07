export type ActionStatus = "completed" | "timeout" | "cancelled" | "failed";

export type ActionRunnerResult<TValue = unknown> = {
  tool: string;
  ok: boolean;
  status: ActionStatus;
  value?: TValue;
  message?: string;
  durationMs: number;
  timeoutMs: number;
  timedOut: boolean;
  cancelled: boolean;
};

export type ActionTimeoutPolicy = {
  defaultTimeoutMs: number;
  perToolTimeoutMs?: Record<string, number>;
};

export type RunActionInput<TValue> = {
  tool: string;
  action: (signal: AbortSignal) => Promise<TValue> | TValue;
  timeoutPolicy?: ActionTimeoutPolicy;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 5_000;

/**
 * Runtime-owned timeout defaults for primitive action skills.
 *
 * These are deliberately shorter than a full probe run. A primitive that cannot
 * finish or report cancellation inside its slot should leave an explicit timeout
 * artifact instead of making the whole runtime loop look like it stalled.
 */
const DEFAULT_TIMEOUT_POLICY: ActionTimeoutPolicy = {
  defaultTimeoutMs: DEFAULT_TIMEOUT_MS,
  perToolTimeoutMs: {
    observe: 1_000,
    wait: 2_000,
    say: 2_000,
    remember: 1_000,
    move_to: 8_000,
    collect_logs: 45_000,
    mine_block: 20_000,
    craft_item: 5_000,
    craft_with_table: 6_000,
    consume_item: 5_000,
    equip_item: 3_000,
    run_mineflayer_program: 12_000,
    place_block: 8_000,
    build_pattern: 90_000,
    inspect_chest: 3_000,
    deposit_shared: 4_000,
    withdraw_shared: 4_000,
    converse: 3_000,
    reply_to: 2_000,
    look_at_actor: 2_000,
    drop_item: 3_000,
    observe_world: 1_000
  }
};

export function timeoutForTool(
  tool: string,
  policy: ActionTimeoutPolicy = DEFAULT_TIMEOUT_POLICY
) {
  return policy.perToolTimeoutMs?.[tool] ?? policy.defaultTimeoutMs;
}

/**
 * Executes one primitive action skill with a runtime-visible timeout result.
 *
 * Mineflayer calls are not all truly abortable. The AbortSignal is still passed
 * into the action so tool implementations can cancel pathfinder goals, listeners,
 * or wait loops; the runner records timeout/cancel state even when cleanup is
 * delegated to the primitive.
 */
export async function runAction<TValue>({
  tool,
  action,
  timeoutPolicy = DEFAULT_TIMEOUT_POLICY,
  timeoutMs = timeoutForTool(tool, timeoutPolicy)
}: RunActionInput<TValue>): Promise<ActionRunnerResult<TValue>> {
  const startTime = Date.now();
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const finish = (
    result: Omit<ActionRunnerResult<TValue>, "durationMs" | "timeoutMs">
  ): ActionRunnerResult<TValue> => ({
    ...result,
    durationMs: Date.now() - startTime,
    timeoutMs
  });

  try {
    const timeout = new Promise<ActionRunnerResult<TValue>>((resolve) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        resolve(
          finish({
            tool,
            ok: false,
            status: "timeout",
            message: `Tool execution timed out after ${timeoutMs}ms`,
            timedOut: true,
            cancelled: true
          })
        );
      }, timeoutMs);
    });

    // The timeout branch wins the race as an artifact, but the action may still
    // need its own signal-aware cleanup to stop movement or listeners.
    const execution = Promise.resolve()
      .then(() => action(controller.signal))
      .then((value) =>
        finish({
          tool,
          ok: true,
          status: "completed",
          value,
          timedOut: false,
          cancelled: false
        })
      )
      .catch((error) =>
        finish({
          tool,
          ok: false,
          status: controller.signal.aborted ? "cancelled" : "failed",
          message: error instanceof Error ? error.message : String(error),
          timedOut: false,
          cancelled: controller.signal.aborted
        })
      );

    return await Promise.race([execution, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
