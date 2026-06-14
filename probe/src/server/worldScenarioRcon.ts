export type RconOutputFailure = {
  reason: string;
  pattern: string;
};

const FAILURE_PATTERNS: Array<{ pattern: string; reason: string }> = [
  {
    pattern: "that position is not loaded",
    reason: "target_position_not_loaded"
  },
  {
    pattern: "unknown or incomplete command",
    reason: "unknown_or_incomplete_command"
  },
  {
    pattern: "incorrect argument for command",
    reason: "incorrect_command_argument"
  },
  {
    pattern: "no player was found",
    reason: "no_player_found"
  },
  {
    pattern: "incomplete",
    reason: "incomplete_command"
  }
];

/**
 * Classifies the narrow set of RCON responses that this repo has already seen
 * as failed setup evidence. RCON transports some command failures as ordinary
 * output strings, so scenario setup cannot treat every resolved call as passed.
 *
 * This is deliberately not a broad prose parser. Add patterns only when a
 * Minecraft server response has been observed or documented as command failure.
 */
export function classifyRconOutputFailure(output: string | undefined): RconOutputFailure | undefined {
  if (!output) {
    return undefined;
  }

  const normalized = output.toLowerCase();
  return FAILURE_PATTERNS.find((entry) => normalized.includes(entry.pattern));
}
