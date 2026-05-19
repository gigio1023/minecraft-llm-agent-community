type Proposal = {
  tool: string;
  args?: Record<string, unknown>;
};

type LastResult = {
  tool: string;
  status: string;
};

function isBusyResult(lastResult: LastResult) {
  return lastResult.status === "busy";
}

type NextInput = {
  observation?: unknown;
  lastResult: LastResult | null;
};

function hasNoLastResult(input: NextInput) {
  return input.lastResult === null;
}

export function createDeterministicProvider() {
  return {
    next(input: NextInput): Proposal {
      if (hasNoLastResult(input)) {
        return { tool: "observe", args: {} };
      }

      const lastResult = input.lastResult;

      if (!lastResult) {
        return { tool: "observe", args: {} };
      }

      if (lastResult.tool === "observe") {
        return { tool: "move_to", args: { target: "npc_b" } };
      }

      if (lastResult.tool === "move_to") {
        return {
          tool: "say",
          args: { target: "npc_b", text: "hi npc_b, are you free?" }
        };
      }

      if (lastResult.tool === "say" && isBusyResult(lastResult)) {
        return {
          tool: "wait",
          args: { ticks: 20, reason: "npc_b was busy" }
        };
      }

      if (lastResult.tool === "wait") {
        return {
          tool: "say",
          args: {
            target: "npc_b",
            text: "checking again when you are ready"
          }
        };
      }

      return {
        tool: "remember",
        args: { note: "npc_b responded after one busy turn" }
      };
    }
  };
}
