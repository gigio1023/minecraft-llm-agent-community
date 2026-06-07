/**
 * Lightweight Mineflayer session preflight for primitive execution.
 *
 * @remarks This adapts the MCP reference's "check before every tool" idea
 * without creating a reconnect architecture. The result is runtime evidence:
 * it can block a primitive cleanly, but it does not promise a new session.
 */
export type PrimitiveSessionPreflight =
  | {
      status: "ready";
      has_live_bot: true;
      reason: string;
    }
  | {
      status: "missing_bot" | "not_spawned" | "disconnected_or_ended" | "dead_or_respawning";
      has_live_bot: false;
      reason: string;
    };

type BotSessionLike = {
  entity?: unknown;
  health?: number;
  _client?: {
    ended?: boolean;
    socket?: {
      destroyed?: boolean;
    };
  };
};

function clientLooksEnded(bot: BotSessionLike) {
  return bot._client?.ended === true || bot._client?.socket?.destroyed === true;
}

export function evaluatePrimitiveSessionPreflight(bot?: BotSessionLike): PrimitiveSessionPreflight {
  if (!bot) {
    return {
      status: "missing_bot",
      has_live_bot: false,
      reason: "No Mineflayer bot is attached to this primitive execution"
    };
  }

  if (clientLooksEnded(bot)) {
    return {
      status: "disconnected_or_ended",
      has_live_bot: false,
      reason: "Mineflayer client is disconnected or ended"
    };
  }

  if (!bot.entity) {
    return {
      status: "not_spawned",
      has_live_bot: false,
      reason: "Mineflayer bot has no spawned entity yet"
    };
  }

  if (typeof bot.health === "number" && bot.health <= 0) {
    return {
      status: "dead_or_respawning",
      has_live_bot: false,
      reason: "Mineflayer bot appears dead or respawning"
    };
  }

  return {
    status: "ready",
    has_live_bot: true,
    reason: "Mineflayer bot session is ready for primitive execution"
  };
}
